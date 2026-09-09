import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const SURFACE = '[data-testid="orbital-surface"]';
const DESKTOP = { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const percentiles = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    samples: sorted.length,
    medianMs: sorted[Math.floor(sorted.length / 2)],
    p95Ms: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)],
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
  };
};

async function environment(page, browser, label) {
  return {
    label,
    browserVersion: browser.version(),
    ...await page.evaluate(() => {
      const gl = document.querySelector('canvas')?.getContext('webgl2');
      const debug = gl?.getExtension('WEBGL_debug_renderer_info');
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemoryGiB: navigator.deviceMemory ?? null,
        dpr: devicePixelRatio,
        viewport: { width: innerWidth, height: innerHeight },
        primaryCoarsePointer: matchMedia('(pointer: coarse)').matches,
        anyCoarsePointer: matchMedia('(any-pointer: coarse)').matches,
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
      };
    }),
  };
}

async function centreSurface(page) {
  await page.locator(SURFACE).evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction((selector) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    return rect && rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth;
  }, SURFACE);
}

async function orbitalState(page) {
  return page.locator(SURFACE).evaluate((element) => JSON.parse(element.dataset.orbitalState || 'null'));
}

async function waitForOrbital(page) {
  await centreSurface(page);
  await page.waitForFunction((selector) => {
    const state = JSON.parse(document.querySelector(selector)?.dataset.orbitalState || 'null');
    return state?.renders > 0;
  }, SURFACE);
  return orbitalState(page);
}

async function tableCamera(page) {
  return page.evaluate(() => {
    const state = window.__periodicScene;
    return state?.camera && state?.target ? { camera: [...state.camera], target: [...state.target] } : null;
  });
}

/**
 * Bounded browser profiling, not a GPU benchmark or physical-device test.
 * Each measurement gets its own fresh context. No other caller contexts close.
 */
export async function runOrbitalPerformanceChecks(browser, baseURL = 'http://localhost:3000') {
  const root = new URL(`${baseURL.replace(/\/+$/, '')}/`);
  const url = (route) => new URL(route.replace(/^\//, ''), root).href;
  const tag = root.pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'root';
  const report = {
    startedAt: new Date().toISOString(),
    baseURL: root.href,
    measurements: [],
    limitations: [
      'Phone measurements use browser viewport/touch emulation, not a physical phone.',
      'Frame intervals are requestAnimationFrame cadence during local pointer-event rotation, not GPU timer-query durations or a measured physical-device FPS guarantee.',
      'First-render timing starts at the Orbitals click and ends when the renderer publishes its first submitted render. It includes lazy loading, React mounting, visibility setup, shader work and CPU render submission; it does not isolate shader compilation or prove GPU completion.',
      'Fresh browser contexts isolate page/module state and HTTP caches. The browser process, operating-system caches and GPU driver caches may remain warm.',
    ],
  };
  const measure = async (label, settings, execute) => {
    const context = await browser.newContext(settings);
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      const diagnostics = [];
      page.on('pageerror', (error) => diagnostics.push(error.message));
      const result = await execute(page, context);
      report.measurements.push({ label, status: 'measured', ...result, environment: await environment(page, browser, label), diagnostics });
    } catch (error) {
      report.measurements.push({ label, status: 'failed', error: error.stack || error.message });
    } finally {
      await context.close();
    }
  };

  try {
    for (const [name, slug] of [['Hydrogen', 'hydrogen'], ['Carbon', 'carbon']]) {
      await measure(`${name} fresh-context mode-to-first-render`, DESKTOP, async (page) => {
        await page.goto(url(`${slug}/`), { waitUntil: 'domcontentloaded' });
        await page.getByRole('article', { name: `${name} details`, exact: true }).waitFor();
        const tab = page.getByRole('tab', { name: 'Orbitals', exact: true });
        await tab.evaluate((element) => window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - 140, behavior: 'instant' }));
        await page.evaluate((selector) => {
          window.__orbitalProfileFirstRender = { started: null, result: null };
          const timing = window.__orbitalProfileFirstRender;
          const begin = (event) => {
            const tab = event.target.closest('[role="tab"]');
            if (tab?.textContent.trim() !== 'Orbitals') return;
            timing.started = performance.now();
            document.removeEventListener('click', begin, true);
          };
          document.addEventListener('click', begin, true);
          const observer = new MutationObserver(() => {
            if (timing.started === null) return;
            const surface = document.querySelector(selector);
            const state = JSON.parse(surface?.dataset.orbitalState || 'null');
            if (!state?.renders) return;
            const submitted = performance.now();
            observer.disconnect();
            const rect = surface.getBoundingClientRect();
            const firstState = state;
            requestAnimationFrame((frameTime) => {
              timing.result = {
                modeToFirstRenderSubmissionMs: submitted - timing.started,
                modeToNextAnimationFrameMs: frameTime - timing.started,
                firstState,
                firstSurfaceVisible: rect.top < innerHeight && rect.bottom > 0,
                timingKind: 'Click capture to first data-orbital-state publication, plus the next animation-frame callback; not isolated shader compile or GPU completion time',
              };
            });
          });
          observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['data-orbital-state'] });
          // Bound this observer even if a loading/rendering failure occurs.
          setTimeout(() => {
            observer.disconnect();
            document.removeEventListener('click', begin, true);
          }, 20000);
        }, SURFACE);
        await tab.click();
        await page.locator(SURFACE).waitFor();
        // Rendering may be intentionally deferred if a layout shift puts the
        // view offscreen. Visibility setup is therefore part of this latency.
        await centreSurface(page);
        await page.waitForFunction(() => window.__orbitalProfileFirstRender?.result);
        const timing = await page.evaluate(() => window.__orbitalProfileFirstRender.result);
        assert.ok(timing.firstSurfaceVisible, 'The first submitted view must intersect the screen');
        return timing;
      });
    }

    for (const scenario of [
      { label: 'Desktop Carbon standalone pointer rotation', route: 'carbon/', settings: DESKTOP, touch: false },
      { label: 'Desktop Carbon table-sidebar pointer rotation', route: '?element=carbon', settings: DESKTOP, touch: false },
      { label: 'Emulated phone Carbon table-sidebar pointer rotation', route: '?element=carbon', settings: PHONE, touch: true },
    ]) {
      await measure(scenario.label, scenario.settings, async (page, context) => {
        await page.goto(url(scenario.route), { waitUntil: 'domcontentloaded' });
        await page.getByRole('article', { name: 'Carbon details', exact: true }).waitFor();
        await page.getByRole('tab', { name: 'Orbitals', exact: true }).click();
        await waitForOrbital(page);
        if (scenario.touch) {
          await page.getByRole('button', { name: 'Interact with orbital', exact: true }).tap();
          await centreSurface(page);
        }
        if (await page.evaluate(() => Boolean(window.__periodicScene))) {
          await page.waitForFunction(() => !window.__periodicScene.cameraMoving && Math.abs(window.__periodicScene.transition) < 0.002);
        }
        await centreSurface(page);
        const initialState = await orbitalState(page);
        const initialTableCamera = await tableCamera(page);
        const box = await page.locator(SURFACE).boundingBox();
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await page.locator(SURFACE).evaluate((element) => {
          window.__orbitalProfilePointer = null;
          element.addEventListener('pointerdown', (event) => {
            window.__orbitalProfilePointer = { pointerId: event.pointerId, pointerType: event.pointerType };
          }, { once: true, capture: true });
        });
        let cdp;
        let interaction;
        try {
          // A real input down establishes pointer capture. Frame-paced moves
          // are then local to this one surface, avoiding CDP round-trip delays
          // in every interval while exercising its actual pointer handler.
          if (scenario.touch) {
            cdp = await context.newCDPSession(page);
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
          } else {
            await page.mouse.move(x, y);
            await page.mouse.down();
          }
          await page.waitForFunction(() => window.__orbitalProfilePointer);
          interaction = await page.locator(SURFACE).evaluate((element) => new Promise((resolve, reject) => {
            const pointer = window.__orbitalProfilePointer;
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const intervals = [];
            const renderProfiles = new Map();
            let previous = null;
            let frames = 0;
            let fullyVisible = true;
            let firstRenderCount = null;
            let lastRenderCount = null;
            let raf;
            const timeout = setTimeout(() => {
              cancelAnimationFrame(raf);
              reject(new Error('Pointer profiling exceeded its 12-second budget'));
            }, 12000);
            const tick = (time) => {
              const currentRect = element.getBoundingClientRect();
              fullyVisible &&= currentRect.top >= 0 && currentRect.bottom <= innerHeight && currentRect.left >= 0 && currentRect.right <= innerWidth;
              const state = JSON.parse(element.dataset.orbitalState || 'null');
              // Six warm-up intervals let the interaction-quality frame arrive.
              if (previous !== null && frames > 6) {
                intervals.push(time - previous);
                if (state) {
                  const key = `${state.width}x${state.height}/${state.steps}`;
                  const profile = renderProfiles.get(key) || { width: state.width, height: state.height, steps: state.steps, observedFrames: 0 };
                  profile.observedFrames += 1;
                  renderProfiles.set(key, profile);
                  firstRenderCount ??= state.renders;
                  lastRenderCount = state.renders;
                }
              }
              previous = time;
              frames += 1;
              element.dispatchEvent(new PointerEvent('pointermove', {
                bubbles: true,
                pointerId: pointer.pointerId,
                pointerType: pointer.pointerType,
                isPrimary: true,
                button: -1,
                buttons: 1,
                clientX: x + Math.sin(frames * 0.09) * Math.min(70, rect.width * 0.2),
                clientY: y + Math.sin(frames * 0.12) * Math.min(25, rect.height * 0.08),
              }));
              if (intervals.length < 60) raf = requestAnimationFrame(tick);
              else {
                clearTimeout(timeout);
                const table = document.querySelector('.explorerTableView')?.getBoundingClientRect();
                resolve({
                  intervalsMs: intervals,
                  renderProfiles: [...renderProfiles.values()],
                  rayMarchCountDuringSamples: lastRenderCount - firstRenderCount,
                  surfaceFullyVisibleThroughout: fullyVisible,
                  tablePreviewIntersectsScreen: table ? table.top < innerHeight && table.bottom > 0 && table.left < innerWidth && table.right > 0 : null,
                  pointerType: pointer.pointerType,
                  samplingKind: '60 requestAnimationFrame intervals during surface-local pointermove events, after a real captured pointerdown and six warm-up intervals',
                });
              }
            };
            raf = requestAnimationFrame(tick);
          }));
        } finally {
          if (cdp) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => {});
            await cdp.detach();
          } else await page.mouse.up();
        }
        await page.waitForFunction((selector) => JSON.parse(document.querySelector(selector)?.dataset.orbitalState || 'null')?.steps === 96, SURFACE);
        const finalState = await orbitalState(page);
        const finalTableCamera = await tableCamera(page);
        assert.ok(interaction.surfaceFullyVisibleThroughout, 'Keep the orbital surface visible throughout profiling');
        assert.ok(Math.abs(finalState.yaw - initialState.yaw) + Math.abs(finalState.pitch - initialState.pitch) > 0.01, 'Pointer profiling must actually rotate the orbital');
        const tableCameraUnchanged = initialTableCamera && finalTableCamera
          ? [...initialTableCamera.camera, ...initialTableCamera.target].every((value, index) => Math.abs(value - [...finalTableCamera.camera, ...finalTableCamera.target][index]) < 0.001)
          : null;
        if (tableCameraUnchanged !== null) assert.ok(tableCameraUnchanged, 'Orbital profiling must not move the table camera');
        return {
          ...interaction,
          ...percentiles(interaction.intervalsMs),
          tableCameraUnchanged,
          tableCameraVerification: tableCameraUnchanged === null ? 'No development camera instrumentation available on this page/export' : 'Compared camera position and target before/after pointer rotation',
          initialState,
          finalState,
          finalResources: { textures: finalState.textures, geometries: finalState.geometries },
        };
      });
    }
  } finally {
    report.finishedAt = new Date().toISOString();
    report.failed = report.measurements.filter((item) => item.status === 'failed').length;
    report.reportPath = `artifacts/verification/orbitals-${tag}-performance.json`;
    await mkdir('artifacts/verification', { recursive: true });
    await writeFile(report.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}
