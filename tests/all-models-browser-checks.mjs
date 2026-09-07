import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const models = {
  18: { label: "18 columns", count: 118 },
  racetrack: { label: "Race Track", count: 104 },
  giguere: { label: "Giguère", count: 103, orbit: true },
  32: { label: "32 columns", count: 118 },
  dobereiner: { label: "Döbereiner", count: 12, timeline: true },
  mendeleev: { label: "Mendeleev", count: 66, timeline: true },
  janet: { label: "Janet", count: 120 },
  stowe: { label: "Stowe", count: 120, orbit: true },
  telluric: {
    label: "de Chancourtois",
    count: 123,
    timeline: true,
    orbit: true,
  },
  benfey: { label: "Benfey spiral", count: 144 },
  "chemical-galaxy": { label: "Chemical galaxy", count: 119 },
};
const collections = {
  designs: [
    "18",
    "racetrack",
    "giguere",
    "32",
    "janet",
    "stowe",
    "benfey",
    "chemical-galaxy",
  ],
  timeline: [
    "dobereiner",
    "telluric",
    "mendeleev",
    "janet",
    "racetrack",
    "giguere",
    "stowe",
    "18",
  ],
};
const distance = (a, b) =>
  Math.hypot(...a.map((value, index) => value - b[index]));
const regexEscape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const errorInfo = (error) => ({
  name: error.name,
  message: error.message,
  stack: error.stack?.split("\n").slice(0, 5).join("\n"),
});

// A complete directed graph has an Euler circuit. This covers all 56 directed
// changes in each collection without an extra reset transition before each one.
function transitionCircuit(ids) {
  const remaining = new Map(
    ids.map((id) => [id, ids.filter((other) => other !== id)]),
  );
  const stack = [ids[0]];
  const result = [];
  while (stack.length) {
    const next = remaining.get(stack.at(-1));
    if (next.length) stack.push(next.pop());
    else result.push(stack.pop());
  }
  return result.reverse();
}

/**
 * Caller owns Browser; this runner closes only its own contexts.
 * Requires the development scene diagnostics at window.__periodicScene.
 * options.only accepts case-insensitive phase/name substrings, e.g.
 * ["picking", "history"], ["transitions:timeline"], or ["responsive:phone"].
 * Measurements describe browser emulation, never physical-device performance.
 */
export async function runAllModelsBrowserChecks(
  browser,
  baseURL = "http://localhost:3018",
  options = {},
) {
  const started = Date.now();
  const root = `${baseURL.replace(/\/$/, "")}/`;
  const artifactDirectory = path.resolve("artifacts/verification");
  await mkdir(artifactDirectory, { recursive: true });
  const report = {
    startedAt: new Date(started).toISOString(),
    baseURL,
    environment:
      "Playwright development browser; phone/tablet and CPU slowdown are emulation, not physical devices",
    expectedModels: Object.fromEntries(
      Object.entries(models).map(([id, model]) => [id, model.count]),
    ),
    expectedDirectedTransitions: 112,
    checks: [],
    diagnostics: [],
    screenshots: [],
    performance: [],
  };
  const contexts = [];
  let deadline = Infinity;
  const budget = (maximum = 20000) =>
    Math.max(1, Math.min(maximum, deadline - Date.now()));
  const includes = (phase, name = "") =>
    !options.only ||
    (Array.isArray(options.only) ? options.only : [options.only]).some((term) =>
      `${phase} ${name}`.toLowerCase().includes(String(term).toLowerCase()),
    );
  const url = (route = "") => new URL(route.replace(/^\//, ""), root).href;
  const routeFor = (id) =>
    `${models[id].timeline ? "timeline/" : ""}${id === "18" ? "" : `?design=${encodeURIComponent(id)}`}`;
  const readScene = (page) =>
    page.evaluate(() =>
      JSON.parse(JSON.stringify(window.__periodicScene || null)),
    );
  const button = (page, id) =>
    page
      .locator(".explorerDesigns")
      .getByRole("button", {
        name: new RegExp(`${regexEscape(models[id].label)}$`),
      });

  function monitor(page, surface) {
    page.on("pageerror", (error) =>
      report.diagnostics.push({
        surface,
        type: "pageerror",
        ...errorInfo(error),
      }),
    );
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      // Existing Footer links use href="#"; Next resolves its query differently
      // on hydration. Ignore exactly that documented warning, not all hydration.
      const expected =
        /Warning: Prop .* did not match/.test(text) &&
        /href/.test(text) &&
        /#["']/.test(text) &&
        /at Footer\b/.test(text);
      report.diagnostics.push({
        surface,
        type: "console-error",
        expected,
        message: text,
      });
    });
    page.on("response", (response) => {
      if (response.url().startsWith(root) && response.status() >= 400)
        report.diagnostics.push({
          surface,
          type: "failed-local-resource",
          url: response.url(),
          status: response.status(),
        });
    });
    page.on("requestfailed", (request) => {
      const reason = request.failure()?.errorText || "Unknown failure";
      if (request.url().startsWith(root) && !/ERR_ABORTED/.test(reason))
        report.diagnostics.push({
          surface,
          type: "failed-local-resource",
          url: request.url(),
          message: reason,
        });
    });
  }
  async function createPage(surface, settings) {
    const context = await browser.newContext(settings);
    contexts.push(context);
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    page.setDefaultNavigationTimeout(20000);
    monitor(page, surface);
    return { context, page };
  }
  async function scene(page, id) {
    await page.waitForFunction(
      ({ id, count }) => {
        const state = window.__periodicScene;
        return (
          state?.design === id &&
          state.count === count &&
          !state.cameraMoving &&
          Math.abs(state.transition) < 0.002 &&
          state.camera?.length === 3
        );
      },
      { id, count: models[id].count },
      { timeout: budget(), polling: 75 },
    );
    return readScene(page);
  }
  async function canvas(page, remember = false) {
    assert.equal(
      await page.locator("canvas").count(),
      1,
      "Expected one persistent DOM canvas",
    );
    assert.equal(
      await page.evaluate((remember) => {
        const canvas = document.querySelector("canvas");
        if (remember || !window.__allModelsCanvas)
          window.__allModelsCanvas = canvas;
        return window.__allModelsCanvas === canvas;
      }, remember),
      true,
      "Navigation replaced the shared canvas",
    );
  }
  async function load(page, id = "18", route = routeFor(id)) {
    await page.goto(url(route), {
      waitUntil: "domcontentloaded",
      timeout: budget(),
    });
    await page.bringToFront();
    await scene(page, id);
    await canvas(page, true);
  }
  async function choose(page, id) {
    const selected = await button(page, id).getAttribute("aria-pressed", {
      timeout: budget(),
    });
    if (selected !== "true")
      await button(page, id).click({ timeout: budget() });
    const state = await scene(page, id);
    assert.equal(await button(page, id).getAttribute("aria-pressed"), "true");
    await canvas(page);
    return state;
  }
  async function closePanel(page, id) {
    await page
      .getByRole("button", {
        name: "Return to table and restore camera",
        exact: true,
      })
      .click({ timeout: budget() });
    await page
      .locator(".explorerPanel")
      .waitFor({ state: "detached", timeout: budget() });
    // The debug snapshot can still describe the settled miniature on the first
    // render after closing; wait through the 600 ms restoration before reading.
    await page.waitForTimeout(Math.min(750, budget()));
    return scene(page, id);
  }
  async function screenshot(page, name) {
    const target = path.join(artifactDirectory, `all-models-${name}.png`);
    await page.screenshot({ path: target, timeout: 6000 });
    report.screenshots.push(target);
  }
  async function check(phase, name, page, work, force = false) {
    if (!force && !includes(phase, name)) return;
    const begin = Date.now();
    deadline = begin + 20000;
    console.log(`[all-models] ${phase}: ${name}`);
    try {
      const detail = await work();
      report.checks.push({
        phase,
        name,
        status: "passed",
        durationMs: Date.now() - begin,
        ...(detail === undefined ? {} : { detail }),
      });
    } catch (error) {
      let state;
      try {
        state = await readScene(page);
      } catch {
        /* Retain the original failure. */
      }
      report.checks.push({
        phase,
        name,
        status: "failed",
        durationMs: Date.now() - begin,
        error: errorInfo(error),
        url: page?.url(),
        scene: state,
      });
      console.log(`[all-models] FAILED ${phase}: ${name}: ${error.message}`);
      if (page && !page.isClosed())
        await screenshot(page, `failure-${report.checks.length}`).catch(
          () => {},
        );
    } finally {
      deadline = Infinity;
    }
    // Incremental results survive a stopped browser session or a later failure.
    await writeFile(
      path.join(
        artifactDirectory,
        options.reportName || "all-models-browser-checks.json",
      ),
      `${JSON.stringify(report, null, 2)}\n`,
    );
  }
  async function noOverflow(page) {
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
      visibleViewport: visualViewport?.width || innerWidth,
    }));
    assert.ok(
      dimensions.content <= dimensions.viewport + 2,
      `Horizontal document overflow: ${JSON.stringify(dimensions)}`,
    );
    assert.ok(
      dimensions.content <= page.viewportSize().width + 2,
      "Mobile document auto-scaled to fit overflowing content",
    );
    return dimensions;
  }
  async function pointCandidates(page, id, filter = {}) {
    await page
      .locator(".explorerTableView")
      .scrollIntoViewIfNeeded({ timeout: budget() });
    await page.waitForTimeout(Math.min(200, budget()));
    await scene(page, id);
    return page.evaluate((filter) => {
      const box = document
        .querySelector(".explorerTableView")
        .getBoundingClientRect();
      const center = {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
      };
      return (window.__periodicScene.projectedCells || [])
        .filter(
          (cell) =>
            cell.frontFacing !== false &&
            Number.isFinite(cell.x) &&
            Number.isFinite(cell.y) &&
            cell.x > Math.max(6, box.left + 6) &&
            cell.x < Math.min(innerWidth - 6, box.right - 6) &&
            cell.y > Math.max(6, box.top + 6) &&
            cell.y < Math.min(innerHeight - 6, box.bottom - 6) &&
            (filter.number == null || cell.number === filter.number) &&
            (filter.id == null || cell.id === filter.id),
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - center.x, a.y - center.y) -
            Math.hypot(b.x - center.x, b.y - center.y),
        );
    }, filter);
  }
  async function pick(page, id, filter = {}, keyboardFallback = true) {
    const candidates = await pointCandidates(page, id, filter);
    for (const candidate of candidates.slice(0, 5)) {
      await page.mouse.click(candidate.x, candidate.y);
      try {
        await page
          .locator(".explorerPanel")
          .waitFor({ state: "visible", timeout: budget(1300) });
        const query = Object.fromEntries(new URL(page.url()).searchParams);
        if (filter.id)
          assert.equal(
            query.slot,
            filter.id,
            "A different overlapping cell intercepted the intended source entry",
          );
        assert.ok(
          query.element || query.panel === "entry",
          "Canvas click did not open element/source-entry details",
        );
        return { method: "canvas pointer click", candidate, query };
      } catch (error) {
        if (await page.locator(".explorerPanel").count()) throw error;
      }
    }
    if (!keyboardFallback || candidates.length)
      throw new Error(
        `No canvas hit in ${id}; attempted ${Math.min(5, candidates.length)} projected front-facing centres`,
      );
    // Only use accessibility fallback when no front-facing centre is visible.
    // It is recorded distinctly and never claimed as verified mesh raycasting.
    await page.locator(".explorerTableView").focus({ timeout: budget() });
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await page
      .locator(".explorerPanel")
      .waitFor({ state: "visible", timeout: budget() });
    return {
      method: "keyboard fallback; no projected front-facing centre",
      geometryPickingVerified: false,
      query: Object.fromEntries(new URL(page.url()).searchParams),
    };
  }
  async function zoom(page, id) {
    const before = await scene(page, id);
    await page
      .getByRole("button", { name: "Zoom in", exact: true })
      .click({ timeout: budget() });
    await page.waitForFunction(
      (before) => {
        const state = window.__periodicScene;
        return (
          state &&
          Math.hypot(
            ...state.camera.map((value, index) => value - before[index]),
          ) > 0.05
        );
      },
      before.camera,
      { timeout: budget() },
    );
    return scene(page, id);
  }
  async function drag(page, dx = 120, dy = 35) {
    const box = await page.locator(".explorerTableView").boundingBox();
    const x = box.x + box.width * 0.48;
    const y = Math.min(
      page.viewportSize().height - 90,
      box.y + box.height * 0.45,
    );
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(450);
    assert.equal(
      await page.locator(".explorerPanel").count(),
      0,
      "Dragging opened details",
    );
  }
  async function sampleFrames(page, surface, id, throttle) {
    await page.bringToFront();
    const samples = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const intervals = [];
          let previous;
          let first;
          let finished = false;
          const safety = setTimeout(() => {
            finished = true;
            resolve({
              samples: intervals.length,
              unavailable: true,
              visibility: document.visibilityState,
            });
          }, 5000);
          const tick = (time) => {
            if (finished) return;
            first ??= time;
            if (previous != null) intervals.push(time - previous);
            previous = time;
            if (time - first < 1500) return requestAnimationFrame(tick);
            finished = true;
            clearTimeout(safety);
            const ordered = intervals.slice().sort((a, b) => a - b);
            resolve({
              samples: intervals.length,
              elapsedMs: time - first,
              medianMs: ordered[Math.floor(ordered.length / 2)],
              p95Ms:
                ordered[
                  Math.min(
                    ordered.length - 1,
                    Math.floor(ordered.length * 0.95),
                  )
                ],
              averageFps:
                (intervals.length * 1000) /
                intervals.reduce((sum, interval) => sum + interval, 0),
              devicePixelRatio,
              visibility: document.visibilityState,
              resources: window.__periodicScene?.resources,
              drawCalls: window.__periodicScene?.drawCalls,
            });
          };
          requestAnimationFrame(tick);
        }),
    );
    const result = {
      surface,
      model: id,
      throttle,
      physicalDevice: false,
      ...samples,
    };
    report.performance.push(result);
    assert.ok(
      !samples.unavailable && samples.samples > 5,
      "No usable foreground animation-frame sample",
    );
    return result;
  }

  try {
    const { page: desktop } = await createPage("desktop", {
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
    });
    for (const id of Object.keys(models)) {
      await check(
        "setup",
        `${id}: expected source slot count and one canvas`,
        desktop,
        async () => {
          await load(desktop, id);
          const state = await scene(desktop, id);
          return { id, count: state.count };
        },
      );
    }

    for (const [collection, ids] of Object.entries(collections)) {
      const circuit = transitionCircuit(ids);
      const phase = `transitions:${collection}`;
      if (
        includes(phase) ||
        circuit.some(
          (to, index) =>
            index && includes(phase, `${circuit[index - 1]} → ${to}`),
        )
      ) {
        await check(
          phase,
          "Collection preparation",
          desktop,
          async () => {
            await load(
              desktop,
              circuit[0],
              `${collection === "timeline" ? "timeline/" : ""}${circuit[0] === "18" ? "" : `?design=${circuit[0]}`}`,
            );
            assert.equal(
              await desktop.locator(".explorerDesigns > button").count(),
              8,
            );
          },
          true,
        );
      }
      for (let index = 1; index < circuit.length; index++) {
        const from = circuit[index - 1],
          to = circuit[index];
        await check(phase, `${from} → ${to}`, desktop, async () => {
          if ((await readScene(desktop))?.design !== from)
            await choose(desktop, from);
          const state = await choose(desktop, to);
          return { from, to, count: state.count, persistentCanvas: true };
        });
      }
    }

    for (const id of Object.keys(models)) {
      await check(
        "picking",
        `${id}: canvas hit targets open details`,
        desktop,
        async () => {
          await load(desktop, id);
          const result = await pick(desktop, id);
          await closePanel(desktop, id);
          await canvas(desktop);
          return result;
        },
      );
    }

    for (const start of ["janet", "stowe"]) {
      await check(
        "rapid",
        `Latest request wins after ${models[start].orbit ? "orbiting" : "zooming"} ${start}`,
        desktop,
        async () => {
          await load(desktop, start);
          await zoom(desktop, start);
          if (models[start].orbit) await drag(desktop);
          const requests =
            start === "janet"
              ? ["benfey", "32", "chemical-galaxy", "stowe"]
              : ["janet", "chemical-galaxy", "benfey", "18"];
          // Real navigation handlers, dispatched tightly enough to overlap camera
          // and geometry preparation; no React state is modified by this test.
          await desktop.evaluate(
            async (labels) => {
              for (const label of labels) {
                const button = [
                  ...document.querySelectorAll(".explorerDesigns > button"),
                ].find(
                  (button) =>
                    button.querySelector("span:last-child")?.textContent ===
                    label,
                );
                if (!button) throw new Error(`Missing model button ${label}`);
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 85));
              }
            },
            requests.map((id) => models[id].label),
          );
          await scene(desktop, requests.at(-1));
          await canvas(desktop);
          await desktop.waitForTimeout(700);
          assert.equal(
            (await readScene(desktop)).design,
            requests.at(-1),
            "A stale geometry request replaced the latest model",
          );
          return { start, requests, final: requests.at(-1) };
        },
      );
    }

    await check(
      "history",
      "Mapped historical slot keeps source context and restores camera",
      desktop,
      async () => {
        await load(desktop, "mendeleev");
        const before = await zoom(desktop, "mendeleev");
        const picked = await pick(
          desktop,
          "mendeleev",
          { id: "mendeleev-r7-c1" },
          false,
        );
        assert.equal(picked.query.element, "hydrogen");
        assert.match(
          await desktop.locator(".explorerPanel").innerText(),
          /In this edition: H = 1/,
        );
        const returned = await closePanel(desktop, "mendeleev");
        assert.ok(
          distance(before.camera, returned.camera) < 0.25,
          "Saved camera position was not restored",
        );
        assert.ok(
          distance(before.target, returned.target) < 0.25,
          "Saved camera target was not restored",
        );
        await desktop.goBack({
          waitUntil: "domcontentloaded",
          timeout: budget(),
        });
        await desktop
          .getByRole("region", { name: "Hydrogen detail", exact: true })
          .waitFor({ timeout: budget() });
        assert.equal(
          new URL(desktop.url()).searchParams.get("slot"),
          "mendeleev-r7-c1",
        );
        await desktop.reload({
          waitUntil: "domcontentloaded",
          timeout: budget(),
        });
        await desktop
          .getByRole("region", { name: "Hydrogen detail", exact: true })
          .waitFor({ timeout: budget() });
        await scene(desktop, "mendeleev");
        await canvas(desktop, true);
        return { picked, cameraRestored: true, backAndRefresh: true };
      },
    );
    await check(
      "history",
      "Unknown Janet entry survives refresh and browser Back",
      desktop,
      async () => {
        await load(desktop, "janet");
        const picked = await pick(desktop, "janet", { id: "janet-85" }, false);
        assert.equal(picked.query.panel, "entry");
        assert.equal(
          picked.query.element,
          undefined,
          "Historical blank was assigned a modern element",
        );
        await desktop
          .getByRole("region", { name: "Historical entry", exact: true })
          .waitFor({ timeout: budget() });
        assert.match(
          await desktop.locator(".explorerPanel").innerText(),
          /Printed position: 85/,
        );
        await desktop.reload({
          waitUntil: "domcontentloaded",
          timeout: budget(),
        });
        await desktop
          .getByRole("region", { name: "Historical entry", exact: true })
          .waitFor({ timeout: budget() });
        await scene(desktop, "janet");
        await canvas(desktop, true);
        await desktop.goBack({
          waitUntil: "domcontentloaded",
          timeout: budget(),
        });
        await desktop
          .locator(".explorerPanel")
          .waitFor({ state: "detached", timeout: budget() });
        await scene(desktop, "janet");
        assert.equal(new URL(desktop.url()).searchParams.has("slot"), false);
        return { slot: "janet-85", refresh: true, backClosedPanel: true };
      },
    );

    const surfaces = [
      {
        name: "phone",
        settings: {
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 2,
          isMobile: true,
          hasTouch: true,
        },
      },
      {
        name: "tablet",
        settings: {
          viewport: { width: 768, height: 1024 },
          deviceScaleFactor: 2,
          isMobile: true,
          hasTouch: true,
        },
      },
    ];
    for (const surface of surfaces) {
      const wanted =
        includes(`responsive:${surface.name}`) ||
        (surface.name === "phone" &&
          (includes("touch") || includes("performance")));
      if (!wanted) continue;
      const { page, context } = await createPage(
        surface.name,
        surface.settings,
      );
      for (const id of Object.keys(models)) {
        await check(
          `responsive:${surface.name}`,
          `${id}: fit, scrolling and reachable footer`,
          page,
          async () => {
            await load(page, id);
            const state = await scene(page, id);
            const dimensions = await noOverflow(page);
            assert.ok(
              state.projectedCells.some(
                (cell) =>
                  cell.x > 0 &&
                  cell.x < surface.settings.viewport.width &&
                  cell.y > 0 &&
                  cell.y < surface.settings.viewport.height,
              ),
              "No table cells are in the initial viewport",
            );
            const scroll = await page
              .locator(".explorerDesigns")
              .evaluate((element) => {
                const before = element.scrollLeft;
                element.scrollLeft = Math.min(
                  400,
                  element.scrollWidth - element.clientWidth,
                );
                return {
                  before,
                  after: element.scrollLeft,
                  overflow: element.scrollWidth - element.clientWidth,
                  scrollbars: getComputedStyle(element).scrollbarWidth,
                };
              });
            assert.ok(
              scroll.overflow <= 0 || scroll.after > 0,
              "Horizontal navigation could not scroll",
            );
            await page
              .locator("footer")
              .scrollIntoViewIfNeeded({ timeout: budget() });
            const footer = await page.locator("footer").boundingBox();
            assert.ok(
              footer.y < surface.settings.viewport.height &&
                footer.y + footer.height > 0,
              "Footer is not reachable in the document",
            );
            await noOverflow(page);
            return { dimensions, scroll, count: state.count };
          },
        );
      }
      if (surface.name !== "phone") continue;
      for (const id of ["18", "janet", "stowe"]) {
        await check(
          "touch",
          `${id}: first tap selects and second tap opens`,
          page,
          async () => {
            await load(page, id);
            if (id === "janet") await zoom(page, id);
            const candidates = await pointCandidates(page, id);
            assert.ok(candidates.length, "No touch target centre in viewport");
            const point =
              candidates.find((cell) => cell.number != null) || candidates[0];
            await page.touchscreen.tap(point.x, point.y);
            await page.waitForTimeout(160);
            assert.equal(
              await page.locator(".explorerPanel").count(),
              0,
              "First tap opened details immediately",
            );
            await page.touchscreen.tap(point.x, point.y);
            await page
              .locator(".explorerPanel")
              .waitFor({ state: "visible", timeout: budget() });
            const query = Object.fromEntries(new URL(page.url()).searchParams);
            await closePanel(page, id);
            await noOverflow(page);
            return { point, query, twoTapBehavior: true };
          },
        );
      }
      await check(
        "performance",
        "Phone emulation: heaviest slot count with optional 4× CPU slowdown",
        page,
        async () => {
          await load(page, "benfey");
          let cdp;
          let throttle = "not supported by this browser";
          try {
            cdp = await context.newCDPSession(page);
            await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
            throttle = "4× CPU slowdown";
          } catch {
            /* Frame sampling still works in non-Chromium browsers. */
          }
          try {
            return await sampleFrames(
              page,
              "phone 390×844",
              "benfey",
              throttle,
            );
          } finally {
            if (cdp) {
              await cdp
                .send("Emulation.setCPUThrottlingRate", { rate: 1 })
                .catch(() => {});
              await cdp.detach().catch(() => {});
            }
          }
        },
      );
    }
    for (const id of ["benfey", "stowe", "telluric"]) {
      await check(
        "performance",
        `Desktop animation and resource sample: ${id}`,
        desktop,
        async () => {
          await load(desktop, id);
          return sampleFrames(desktop, "desktop 1440×1000", id, "none");
        },
      );
    }
  } catch (error) {
    report.checks.push({
      phase: "setup",
      name: "Runner setup",
      status: "failed",
      error: errorInfo(error),
    });
  } finally {
    for (const context of contexts.reverse())
      await context
        .close()
        .catch((error) =>
          report.diagnostics.push({
            type: "context-cleanup",
            ...errorInfo(error),
          }),
        );
  }
  const unexpected = report.diagnostics.filter(
    (diagnostic) => !diagnostic.expected,
  );
  report.checks.push({
    phase: "diagnostics",
    name: "No unexpected runtime, console or local-resource errors",
    status: unexpected.length ? "failed" : "passed",
    detail: unexpected,
  });
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - started;
  report.passed = report.checks.filter(
    (check) => check.status === "passed",
  ).length;
  report.failed = report.checks.filter(
    (check) => check.status === "failed",
  ).length;
  report.directedTransitionsPassed = report.checks.filter(
    (check) =>
      check.phase.startsWith("transitions:") &&
      check.detail?.from &&
      check.status === "passed",
  ).length;
  report.reportPath = path.join(
    artifactDirectory,
    options.reportName || "all-models-browser-checks.json",
  );
  await writeFile(report.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `[all-models] Finished: ${report.passed} passed, ${report.failed} failed; ${report.directedTransitionsPassed}/112 directed transitions checked. ${report.reportPath}`,
  );
  return report;
}
