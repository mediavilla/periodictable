import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const designs = [
  { id: '18', label: '18 columns', count: 118 },
  { id: 'racetrack', label: 'Race Track', count: 104 },
  { id: 'giguere', label: 'Giguère', count: 103 },
];
const cleanError = error => ({ name: error.name, message: error.message, stack: error.stack?.split('\n').slice(0, 5).join('\n') });
const vectorDistance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));

/**
 * Runs against a caller-owned Playwright Browser, including connectOverCDP.
 * Only contexts created here are closed. Measurements are browser emulation,
 * not evidence of performance on a physical mobile device.
 */
export async function runBrowserChecks(browser, baseURL = 'http://localhost:3017', options = {}) {
  const started = new Date();
  const artifactDirectory = path.resolve('artifacts/verification');
  await mkdir(artifactDirectory, { recursive: true });
  const root = `${baseURL.replace(/\/$/, '')}/`;
  const url = route => new URL(route.replace(/^\//, ''), root).href;
  const report = {
    startedAt: started.toISOString(), baseURL, environment: 'Playwright browser; mobile is viewport/touch emulation, not a physical device',
    checks: [], performance: [], diagnostics: [], screenshots: [],
  };
  const contexts = [];
  let checkSerial = 0;

  async function step(name, page, execute) {
    if(options.only && !options.only.some(term=>name.includes(term))) return;
    const begin = Date.now();
    try {
      const detail = await execute();
      report.checks.push({ name, status: 'passed', durationMs: Date.now() - begin, ...(detail === undefined ? {} : { detail }) });
    } catch (error) {
      report.checks.push({ name, status: 'failed', durationMs: Date.now() - begin, error: cleanError(error) });
      if (page && !page.isClosed()) {
        const target = path.join(artifactDirectory, `failure-${++checkSerial}.png`);
        try { await page.screenshot({ path: target, timeout: 10000 }); report.screenshots.push(target); } catch { /* Preserve the original failure. */ }
      }
    }
  }
  function monitor(page, label, expectedWebGLFailure = false) {
    page.on('pageerror', error => report.diagnostics.push({ surface: label, type: 'pageerror', expected: expectedWebGLFailure && /webgl|context/i.test(error.message), ...cleanError(error) }));
    page.on('console', message => {
      if (message.type() === 'error') report.diagnostics.push({ surface: label, type: 'console-error', expected: expectedWebGLFailure && /webgl|context|canvas/i.test(message.text()), message: message.text() });
    });
    page.on('requestfailed', request => {
      const reason = request.failure()?.errorText || 'Unknown request failure';
      if (request.url().startsWith(root) && !reason.includes('ERR_ABORTED')) report.diagnostics.push({ surface: label, type: 'failed-local-resource', url: request.url(), message: reason });
    });
    page.on('response', response => {
      if (response.url().startsWith(root) && response.status() >= 400) report.diagnostics.push({ surface: label, type: 'failed-local-resource', url: response.url(), status: response.status() });
    });
  }
  async function screenshot(page, name, fullPage = false) {
    const target = path.join(artifactDirectory, `${name}.png`);
    await page.screenshot({ path: target, fullPage, timeout: 20000 });
    report.screenshots.push(target);
  }
  async function scene(page, design = '18') {
    const config = designs.find(item => item.id === design);
    await page.waitForFunction(({ id, count }) => {
      const state = window.__periodicScene;
      return state?.design === id && state.count === count && Math.abs(state.transition) < 0.025 && !state.cameraMoving && state.camera?.length === 3;
    }, { id: design, count: config.count }, { timeout: 30000, polling: 100 });
    return page.evaluate(() => JSON.parse(JSON.stringify(window.__periodicScene)));
  }
  async function load(page, route = '/', design = '18') {
    await page.goto(url(route), { waitUntil: 'domcontentloaded', timeout: 45000 });
    await scene(page, design);
    await page.bringToFront();
  }
  async function choose(page, design) {
    await page.locator('.explorerDesigns').getByRole('button', { name: designs.find(item => item.id === design).label, exact: true }).click();
    return scene(page, design);
  }
  async function canvasCount(page, preserve = false) {
    assert.equal(await page.locator('canvas').count(), 1, 'Expected exactly one DOM canvas');
    const retained = await page.evaluate(preserve => {
      const current = document.querySelector('canvas');
      if (!preserve || !window.__browserChecksCanvas) { window.__browserChecksCanvas = current; return true; }
      return window.__browserChecksCanvas === current;
    }, preserve);
    assert.equal(retained, true, 'The shared canvas was replaced during navigation or transition');
  }
  async function projectedPoint(page, number) {
    await page.waitForFunction(number => window.__periodicScene?.projectedCells?.some(cell => cell.number === number && cell.frontFacing !== false), number, { timeout: 15000 });
    const point = await page.evaluate(number => {
      const state = window.__periodicScene;
      const cell = state.projectedCells.find(item => item.number === number && item.frontFacing !== false);
      const normalized = state.coordinateSpace === 'normalized' || (cell.x >= 0 && cell.x <= 1 && cell.y >= 0 && cell.y <= 1);
      return { x: normalized ? cell.x * innerWidth : cell.x, y: normalized ? cell.y * innerHeight : cell.y };
    }, number);
    const size = page.viewportSize();
    assert.ok(point.x > 0 && point.x < size.width && point.y > 0 && point.y < size.height, `Element ${number} is outside the viewport: ${JSON.stringify(point)}`);
    return point;
  }
  async function noHorizontalOverflow(page) {
    const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.visualViewport?.width || innerWidth }));
    assert.ok(dimensions.content <= page.viewportSize().width + 2, 'Mobile layout must not auto-zoom to fit overflowing content');
    assert.ok(dimensions.content <= dimensions.viewport + 2, `Horizontal overflow: ${dimensions.content}px into ${dimensions.viewport}px viewport`);
    return dimensions;
  }
  async function measureFrames(page, surface, phase) {
    await page.bringToFront();
    const measurements = await page.evaluate(() => new Promise(resolve => {
      const intervals = [];
      let last; let start;
      let finished = false;
      const safety = setTimeout(() => { finished = true; resolve({ samples: intervals.length, unavailable: 'Animation frames did not complete within 8 seconds', visibility: document.visibilityState }); }, 8000);
      const tick = time => {
        if (finished) return;
        if (start === undefined) start = time;
        if (last !== undefined) intervals.push(time - last);
        last = time;
        if (time - start < 2000) { requestAnimationFrame(tick); return; }
        const ordered = intervals.slice().sort((a, b) => a - b);
        const sum = intervals.reduce((a, b) => a + b, 0);
        finished = true; clearTimeout(safety);
        resolve({ samples: intervals.length, elapsedMs: time - start, medianMs: ordered[Math.floor(ordered.length * .5)], p95Ms: ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * .95))], averageFps: 1000 * intervals.length / sum, visibility: document.visibilityState, userAgent: navigator.userAgent, devicePixelRatio });
      };
      requestAnimationFrame(tick);
    }));
    report.performance.push({ surface, phase, ...measurements });
    return measurements;
  }

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    contexts.push(desktopContext);
    const desktop = await desktopContext.newPage();
    desktop.setDefaultTimeout(12000);
    monitor(desktop, 'desktop');

    await step('Desktop default 18-column model has 118 cells and one canvas', desktop, async () => {
      await load(desktop); await canvasCount(desktop); await noHorizontalOverflow(desktop);
      await screenshot(desktop, 'desktop-18');
    });
    for (const from of designs) for (const to of designs) {
      if (from.id === to.id) continue;
      await step(`Design transition ${from.id} → ${to.id}`, desktop, async () => {
        await choose(desktop, from.id);
        await canvasCount(desktop, true);
        await choose(desktop, to.id);
        await canvasCount(desktop, true);
        const pressed = await desktop.locator('.explorerDesigns button[aria-pressed="true"]').innerText();
        assert.ok(pressed.includes(to.label), `Wrong active design button: ${pressed}`);
      });
    }
    await step('Racetrack and Giguère screenshots after transition', desktop, async () => {
      await choose(desktop, 'racetrack'); await screenshot(desktop, 'desktop-racetrack');
      await choose(desktop, 'giguere'); await screenshot(desktop, 'desktop-giguere');
    });
    await step('Rapid design requests after zoom resolve to latest request', desktop, async () => {
      await choose(desktop, '18');
      await desktop.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await desktop.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await desktop.evaluate(() => {
        const buttons = [...document.querySelectorAll('.explorerDesigns button')];
        ['Race Track', 'Giguère', '18 columns', 'Giguère'].forEach((name, index) => setTimeout(() => buttons.find(button => button.textContent.includes(name))?.click(), index * 85));
      });
      await scene(desktop, 'giguere');
      await canvasCount(desktop, true);
    });
    await step('Giguère orbit changes the camera without opening a detail', desktop, async () => {
      const before = await scene(desktop, 'giguere');
      const bounds = await desktop.locator('.explorerTableView').boundingBox();
      const start = { x: bounds.x + bounds.width * .45, y: bounds.y + bounds.height * .5 };
      await desktop.mouse.move(start.x, start.y); await desktop.mouse.down();
      await desktop.mouse.move(start.x + 210, start.y + 45, { steps: 18 }); await desktop.mouse.up();
      await desktop.waitForFunction(before => Math.hypot(...window.__periodicScene.camera.map((v, i) => v - before[i])) > 1, before.camera);
      assert.equal(await desktop.locator('.explorerPanel').count(), 0, 'Orbit gesture incorrectly opened a detail');
    });
    await step('Element click opens details and preview restores saved camera', desktop, async () => {
      await load(desktop); await canvasCount(desktop);
      await desktop.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await desktop.waitForTimeout(500);
      const before = await scene(desktop);
      const hydrogen = await projectedPoint(desktop, 1);
      await desktop.mouse.click(hydrogen.x, hydrogen.y);
      await desktop.getByRole('region', { name: 'Hydrogen detail', exact: true }).waitFor();
      assert.equal(new URL(desktop.url()).searchParams.get('element'), 'hydrogen');
      await canvasCount(desktop, true); await screenshot(desktop, 'desktop-hydrogen-detail');
      await desktop.getByRole('button', { name: 'Return to table and restore camera', exact: true }).click();
      await desktop.waitForFunction(({ camera, target }) => {
        const actual = window.__periodicScene;
        return !actual.cameraMoving && Math.hypot(...actual.camera.map((value, i) => value - camera[i])) < .25 && Math.hypot(...actual.target.map((value, i) => value - target[i])) < .25;
      }, { camera: before.camera, target: before.target }, { timeout: 15000 });
      await canvasCount(desktop, true);
    });
    await step('Open query, browser Back/Forward, and refresh restore detail state', desktop, async () => {
      await load(desktop);
      await desktop.getByRole('button', { name: /Explore element/ }).click();
      await desktop.getByRole('region', { name: 'Hydrogen detail', exact: true }).waitFor();
      await desktop.goBack();
      await desktop.waitForFunction(() => !new URL(location.href).searchParams.has('element'));
      assert.equal(await desktop.locator('.explorerPanel').count(), 0);
      await desktop.goForward();
      await desktop.getByRole('region', { name: 'Hydrogen detail', exact: true }).waitFor();
      await desktop.reload({ waitUntil: 'domcontentloaded' });
      await desktop.getByRole('region', { name: 'Hydrogen detail', exact: true }).waitFor();
      await scene(desktop); await canvasCount(desktop);
    });
    await step('Selected Oganesson remains available but absent from historical models', desktop, async () => {
      await load(desktop, '/?element=oganesson');
      await desktop.getByRole('region', { name: 'Oganesson detail', exact: true }).waitFor();
      await desktop.getByRole('button', { name: 'Return to table and restore camera', exact: true }).click();
      for (const id of ['racetrack', 'giguere']) {
        await choose(desktop, id);
        assert.match(await desktop.locator('.explorerAbsent').innerText(), /Oganesson is not included/);
        const state = await scene(desktop, id);
        assert.ok(state.count < 118);
      }
    });
    await step('History panel and Timeline use source-backed chronological designs', desktop, async () => {
      await load(desktop, '/timeline/');
      const labels = await desktop.locator('.explorerDesigns button').allTextContents();
      assert.deepEqual(labels.map(label => label.match(/1933|1965|Today/)?.[0]), ['1933', '1965', 'Today']);
      await desktop.getByRole('button', { name: /About this design/ }).click();
      const history = desktop.getByRole('region', { name: 'Design history', exact: true });
      await history.waitFor();
      assert.ok(await history.getByRole('link').count() > 0);
      assert.match(await history.innerText(), /Displayed edition/);
      await screenshot(desktop, 'desktop-history');
    });
    await step('Elements discovery searches all 118 and standalone Carbon uses shared content', desktop, async () => {
      await load(desktop); await canvasCount(desktop);
      await desktop.getByRole('navigation', { name: 'Periodic table navigation' }).getByRole('link', { name: 'Elements', exact: true }).click();
      await desktop.locator('.explorerFinderCell').first().waitFor();
      assert.equal(await desktop.locator('.explorerFinderCell').count(), 118);
      await canvasCount(desktop, true);
      const search = desktop.getByRole('searchbox', { name: 'Search all elements', exact: true });
      for (const query of ['79', ' au ', 'GOLD']) {
        await search.fill(query); assert.equal(await desktop.locator('.explorerFinderCell').count(), 1);
        assert.match(await desktop.locator('.explorerFinderCell').innerText(), /Gold/);
      }
      await search.fill('not-an-element'); assert.equal(await desktop.locator('.explorerFinderCell').count(), 0);
      await desktop.getByText(/No elements match this search/).waitFor();
      await search.fill(''); await screenshot(desktop, 'desktop-elements');
      await search.fill('carbon');
      await desktop.locator('.explorerFinderCell').click();
      await desktop.getByRole('article', { name: 'Carbon details', exact: true }).waitFor();
      assert.ok(new URL(desktop.url()).pathname.endsWith('/carbon/'));
      await desktop.getByRole('button', { name: 'Diamond', exact: true }).click();
      assert.equal(await desktop.getByRole('button', { name: 'Diamond', exact: true }).getAttribute('aria-pressed'), 'true');
      await canvasCount(desktop, true); await screenshot(desktop, 'desktop-carbon', true);
      await desktop.reload({ waitUntil: 'domcontentloaded' });
      await desktop.getByRole('article', { name: 'Carbon details', exact: true }).waitFor();
      await desktop.getByRole('link', { name: /View in the table/ }).click();
      await desktop.getByRole('region', { name: 'Carbon detail', exact: true }).waitFor();
      assert.equal(new URL(desktop.url()).searchParams.get('element'), 'carbon');
    });
    await step('Desktop animation frame sampling at rest and while hovering Gold', desktop, async () => {
      await load(desktop); await measureFrames(desktop, 'desktop 1440×1000', 'rest');
      const gold = await projectedPoint(desktop, 79); await desktop.mouse.move(gold.x, gold.y);
      await measureFrames(desktop, 'desktop 1440×1000', 'hover Gold');
    });

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    contexts.push(mobileContext);
    const mobile = await mobileContext.newPage(); mobile.setDefaultTimeout(12000); monitor(mobile, 'mobile emulation');
    await step('Mobile first touch selects Hydrogen; explicit action opens detail', mobile, async () => {
      await load(mobile); await canvasCount(mobile);
      const hydrogen = await projectedPoint(mobile, 1); await mobile.touchscreen.tap(hydrogen.x, hydrogen.y);
      assert.equal(await mobile.locator('.explorerPanel').count(), 0, 'The first touch should only select');
      assert.match(await mobile.locator('.explorerSelection').innerText(), /Hydrogen/);
      await mobile.getByRole('button', { name: /Explore element/ }).tap();
      await mobile.getByRole('region', { name: 'Hydrogen detail', exact: true }).waitFor();
      await canvasCount(mobile, true); await noHorizontalOverflow(mobile);
      await screenshot(mobile, 'mobile-hydrogen-detail');
      await mobile.getByRole('button', { name: 'Return to table and restore camera', exact: true }).tap();
      await scene(mobile); await screenshot(mobile, 'mobile-18');
    });
    await step('Mobile portrait, landscape, and tablet breakpoints remain usable', mobile, async () => {
      for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }]) {
        await mobile.setViewportSize(viewport); await load(mobile);
        await noHorizontalOverflow(mobile); await canvasCount(mobile);
        await screenshot(mobile, `viewport-${viewport.width}x${viewport.height}`);
      }
    });
    await step('Mobile footer is reachable without a canvas gesture trap', mobile, async () => {
      await mobile.setViewportSize({ width: 390, height: 844 }); await load(mobile);
      let touchSession;
      try {
        touchSession = await mobileContext.newCDPSession(mobile);
        await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 385, y: 710 }] });
        for (let index = 1; index <= 10; index++) {
          await touchSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 385, y: 710 - index * 45 }] });
          await mobile.waitForTimeout(20);
        }
        await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await mobile.waitForFunction(() => scrollY > 10, undefined, { timeout: 5000 });
      } finally { if (touchSession) await touchSession.detach().catch(() => {}); }
      await mobile.locator('footer').scrollIntoViewIfNeeded();
      const footer = await mobile.locator('footer').boundingBox();
      assert.ok(footer && footer.y < 844 && footer.y + footer.height > 0, 'Footer not in viewport after scrolling');
      assert.ok(await mobile.evaluate(() => scrollY > 0), 'Document did not scroll');
      await screenshot(mobile, 'mobile-footer');
      await noHorizontalOverflow(mobile);
    });
    await step('Mobile Elements search and standalone details remain readable', mobile, async () => {
      await mobile.goto(url('/elements/'), { waitUntil: 'domcontentloaded' });
      const search = mobile.getByRole('searchbox', { name: 'Search all elements', exact: true });
      await search.fill('1'); assert.equal(await mobile.locator('.explorerFinderCell').count(), 1);
      await mobile.locator('.explorerFinderCell').tap();
      await mobile.getByRole('article', { name: 'Hydrogen details', exact: true }).waitFor();
      await noHorizontalOverflow(mobile); await screenshot(mobile, 'mobile-element-page', true);
    });
    await step('Mobile emulation animation sampling with 4× CPU slowdown', mobile, async () => {
      await load(mobile);
      let throttle = 'not supported'; let cdp;
      try { cdp = await mobileContext.newCDPSession(mobile); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); throttle = '4× CPU slowdown'; } catch { /* Non-Chromium callers still get frame measurements. */ }
      report.performance.push({ surface: 'mobile emulation 390×844', throttle, physicalDevice: false });
      try {
        await measureFrames(mobile, 'mobile emulation 390×844', 'rest');
        const gold = await projectedPoint(mobile, 79); await mobile.mouse.move(gold.x, gold.y);
        await measureFrames(mobile, 'mobile emulation 390×844', 'hover simulation');
      } finally {
        if (cdp) { await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {}); await cdp.detach().catch(() => {}); }
      }
    });
    await step('Camera commands are not replayed after returning from Elements', desktop, async () => {
      await load(desktop);const before=await scene(desktop);
      await desktop.getByRole('button',{name:'Zoom in',exact:true}).click();
      await desktop.getByRole('navigation',{name:'Periodic table navigation'}).getByRole('link',{name:'Elements',exact:true}).click();
      await desktop.locator('.explorerFinderCell').first().waitFor();
      await desktop.getByRole('navigation',{name:'Periodic table navigation'}).getByRole('link',{name:'Designs',exact:true}).click();
      const after=await scene(desktop);assert.ok(vectorDistance(before.camera,after.camera)<.05,'An old zoom command was replayed on the new scene');
    });
    await step('Reduced motion still permits model changes and readable details', mobile, async () => {
      await mobile.emulateMedia({ reducedMotion: 'reduce' }); await load(mobile);
      await choose(mobile, 'giguere'); await choose(mobile, '18');
      await mobile.getByRole('button', { name: /Explore element/ }).tap();
      await mobile.getByRole('region', { name: 'Hydrogen detail', exact: true }).waitFor();
      assert.equal(await mobile.getByRole('button', { name: /Orbit paused/ }).isDisabled(), true);
      await mobile.emulateMedia({ reducedMotion: 'no-preference' });
    });

    const fallback = await desktopContext.newPage(); monitor(fallback, 'simulated WebGL unavailable', true);
    await step('WebGL failure preserves HTML element discovery', fallback, async () => {
      await fallback.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/i.test(type) ? null : original.call(this, type, ...args); };
      });
      await fallback.goto(url('/elements/'), { waitUntil: 'domcontentloaded' });
      await fallback.locator('.explorerFinderCell').first().waitFor();
      assert.equal(await fallback.locator('.explorerFinderCell').count(), 118);
      await fallback.getByRole('searchbox', { name: 'Search all elements', exact: true }).fill('carbon');
      await fallback.locator('.explorerFinderCell').click();
      await fallback.getByRole('article', { name: 'Carbon details', exact: true }).waitFor();
      await screenshot(fallback, 'webgl-fallback-carbon');
    });
  } catch (error) {
    report.checks.push({ name: 'Browser test setup', status: 'failed', error: cleanError(error) });
  } finally {
    for (const context of contexts.reverse()) await context.close().catch(error => report.diagnostics.push({ type: 'context-cleanup', ...cleanError(error) }));
  }

  const failures = report.diagnostics.filter(item => !item.expected && ['pageerror', 'failed-local-resource'].includes(item.type));
  report.checks.push({ name: 'No unexpected page errors or failed local resources', status: failures.length ? 'failed' : 'passed', detail: failures });
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - started.getTime();
  report.passed = report.checks.filter(check => check.status === 'passed').length;
  report.failed = report.checks.filter(check => check.status === 'failed').length;
  report.reportPath = path.join(artifactDirectory, options.reportName || 'browser-checks.json');
  await writeFile(report.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

/** Focused native Chromium gestures and camera easing; no performance sampling. */
export async function runTouchGestureChecks(browser, baseURL = 'http://localhost:3018') {
  const directory = path.resolve('artifacts/verification');
  await mkdir(directory, { recursive: true });
  const report = { baseURL, startedAt: new Date().toISOString(), environment: 'Chromium CDP, 390×844 touch emulation; not a physical device', checks: [], diagnostics: [] };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  let page; let cdp;
  const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
  const read = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__periodicScene)));
  const settled = async (design = '18') => {
    await page.waitForFunction(design => {
      const s = window.__periodicScene;
      return s?.design === design && !s.cameraMoving && Math.abs(s.transition) < .025;
    }, design, { timeout: 20000, polling: 50 });
    return read();
  };
  const check = async (name, work) => {
    try { report.checks.push({ name, status: 'passed', detail: await work() }); }
    catch (error) { report.checks.push({ name, status: 'failed', error: cleanError(error) }); if (page) await page.screenshot({ path: path.join(directory, `touch-failure-${report.checks.length}.png`) }).catch(() => {}); }
  };
  const noDetail = async () => assert.equal(await page.locator('.explorerPanel').count(), 0, 'Two-finger gesture opened an accidental element detail');
  const reset = async () => {
    await page.getByRole('button', { name: 'Reset camera', exact: true }).click();
    await page.waitForTimeout(850);
    return settled(new URL(page.url()).searchParams.get('design') || '18');
  };
  const gesture = async ({ separationFrom = 24, separationTo = 24, dx = 0, dy = 0 }) => {
    const rect = await page.locator('.explorerTableView').boundingBox();
    const cx = rect.x + rect.width * .5;
    const cy = Math.max(210, Math.min(650, rect.y + rect.height * .45));
    const touches = progress => {
      const gap = separationFrom + (separationTo - separationFrom) * progress;
      return [{ id: 1, x: cx - gap + dx * progress, y: cy + dy * progress }, { id: 2, x: cx + gap + dx * progress, y: cy + dy * progress }];
    };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches(0) });
    for (let index = 1; index <= 12; index++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(index / 12) });
      await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(700);
    await noDetail();
    return read();
  };
  try {
    page = await context.newPage(); page.setDefaultTimeout(12000);
    page.on('pageerror', error => report.diagnostics.push(cleanError(error)));
    cdp = await context.newCDPSession(page);
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' }); await page.bringToFront(); await settled();
    await check('Camera Reset eases through intermediate positions and returns to default', async () => {
      const defaultPose = await settled();
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click(); await page.waitForTimeout(700);
      const zoomed = await settled();
      assert.ok(distance(defaultPose.camera, zoomed.camera) > .5, 'Zoom did not change the camera');
      const samples = await page.evaluate(() => new Promise(resolve => {
        const samples = []; const start = performance.now();
        document.querySelector('[aria-label="Reset camera"]').click();
        const sample = () => {
          const state = window.__periodicScene;
          samples.push({ elapsedMs: performance.now() - start, camera: [...state.camera], moving: state.cameraMoving });
          if (performance.now() - start < 1150) requestAnimationFrame(sample); else resolve(samples);
        };
        requestAnimationFrame(sample);
      }));
      const final = await settled();
      assert.ok(samples.some(sample => sample.moving), 'cameraMoving never became true during Reset');
      assert.ok(samples.some(sample => sample.moving && distance(sample.camera, zoomed.camera) > .1 && distance(sample.camera, defaultPose.camera) > .1), 'No intermediate camera pose observed');
      assert.ok(distance(final.camera, defaultPose.camera) < .08, 'Reset camera did not return to default framing');
      assert.ok(distance(final.target, defaultPose.target) < .08, 'Reset target differs from default');
      return { defaultCamera: defaultPose.camera, zoomedCamera: zoomed.camera, finalCamera: final.camera, movingSamples: samples.filter(sample => sample.moving).length, samples };
    });
    for (const design of ['18', 'racetrack', 'giguere']) {
      await check(`${design}: native two-finger pinch zooms both ways without opening details`, async () => {
        await page.locator('.explorerDesigns').getByRole('button', { name: designs.find(item => item.id === design).label, exact: true }).click();
        await settled(design); const before = await reset();
        const zoomed = await gesture({ separationFrom: 24, separationTo: 65 });
        const beforeRadius = distance(before.camera, before.target);
        const zoomedRadius = distance(zoomed.camera, zoomed.target);
        assert.ok(zoomedRadius < beforeRadius * .9, `Pinch-out did not zoom in: ${beforeRadius} → ${zoomedRadius}`);
        const out = await gesture({ separationFrom: 65, separationTo: 24 });
        const outRadius = distance(out.camera, out.target);
        assert.ok(outRadius > zoomedRadius * 1.1, `Pinch-in did not zoom out: ${zoomedRadius} → ${outRadius}`);
        assert.equal(await page.locator('canvas').count(), 1);
        await page.screenshot({ path: path.join(directory, `touch-pinch-${design}.png`) });
        return { beforeRadius, zoomedRadius, outRadius };
      });
    }
    await check('Flat 18-column table pans without tilting during two-finger translation', async () => {
      await page.locator('.explorerDesigns').getByRole('button', { name: '18 columns', exact: true }).click(); await settled();
      await reset(); await page.getByRole('button', { name: 'Zoom in', exact: true }).click(); await page.waitForTimeout(600); await settled(); const before = await read(); const after = await gesture({ dx: 85, dy: -30 });
      assert.ok(distance(before.target, after.target) > .05, `Flat table did not pan: ${before.target} → ${after.target}`);
      assert.ok(Math.abs(after.camera[0] - after.target[0]) < .001 && Math.abs(after.camera[1] - after.target[1]) < .001, 'Flat camera tilted');
      return { beforeTarget: before.target, afterTarget: after.target };
    });
    await check('Giguère two-finger panning stays bounded and outside the model', async () => {
      await page.locator('.explorerDesigns').getByRole('button', { name: 'Giguère', exact: true }).click(); await settled('giguere');
      const before = await reset(); let after;
      for (let index = 0; index < 5; index++) after = await gesture({ dx: 90, dy: -40 });
      assert.ok(distance(before.target, after.target) > .25, 'Two-finger translation did not pan Giguère');
      assert.ok(Math.abs(after.target[0]) <= 4.01 && Math.abs(after.target[1]) <= 3.01 && Math.abs(after.target[2]) <= 4.01, `Pan exceeded bounds: ${after.target}`);
      const radius = distance(after.camera, after.target);
      assert.ok(radius >= 12 + Math.hypot(...after.target) - .15, `Camera went inside its collision limit: radius ${radius}, target ${after.target}`);
      await page.screenshot({ path: path.join(directory, 'touch-giguere-bounded-pan.png') });
      return { beforeTarget: before.target, finalTarget: after.target, cameraRadius: radius };
    });
  } catch (error) { report.checks.push({ name: 'Native gesture test setup', status: 'failed', error: cleanError(error) }); }
  finally { if (cdp) await cdp.detach().catch(() => {}); await context.close(); }
  report.finishedAt = new Date().toISOString();
  report.passed = report.checks.filter(item => item.status === 'passed').length;
  report.failed = report.checks.filter(item => item.status === 'failed').length;
  report.reportPath = path.join(directory, 'touch-gesture-checks.json');
  await writeFile(report.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
