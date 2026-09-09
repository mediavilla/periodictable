import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const SURFACE = '[data-testid="orbital-surface"]';
const vectorDistance = (a, b) =>
  Math.hypot(...a.map((value, i) => value - b[i]));

// Accept an existing Playwright Browser so these checks can use either the
// development server or the exported app, including its /periodictable prefix.
export async function runOrbitalChecks(
  browser,
  baseURL = "http://localhost:3000",
  { stressSwitches = 30 } = {},
) {
  const root = new URL(`${baseURL.replace(/\/+$/, "")}/`);
  const url = (path = "") => new URL(path.replace(/^\//, ""), root).href;
  const tag =
    root.pathname.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "root";
  const artifact = (name, extension = "png") =>
    `artifacts/verification/orbitals-${tag}-${name}.${extension}`;
  await mkdir("artifacts/verification", { recursive: true });
  const report = {
    startedAt: new Date().toISOString(),
    baseURL: root.href,
    checks: [],
    diagnostics: [],
    measurements: {},
    limitations: ["Touch checks use browser emulation, not a physical phone."],
  };
  const contexts = [];
  let currentCheck = "Browser setup";
  const record = (name, detail) =>
    report.checks.push({ name, status: "passed", detail });
  const monitor = (page, label, expectedErrors = false) => {
    page.on("pageerror", (error) => {
      report.diagnostics.push({
        label,
        expected: expectedErrors,
        type: "pageerror",
        message: error.message,
      });
    });
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /THREE|WebGL|shader|React|ChunkLoadError/i.test(message.text())
      )
        report.diagnostics.push({
          label,
          expected: expectedErrors,
          type: "console",
          message: message.text(),
        });
    });
  };
  const makePage = async (settings, label, expectedErrors = false) => {
    const context = await browser.newContext(settings);
    contexts.push(context);
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    monitor(page, label, expectedErrors);
    return { context, page };
  };
  const state = (page) =>
    page
      .locator(SURFACE)
      .evaluate((element) =>
        JSON.parse(element.dataset.orbitalState || "null"),
      );
  const waitState = async (page, expected = {}) => {
    // Offscreen views intentionally defer rendering until visible again.
    await page.locator(SURFACE).scrollIntoViewIfNeeded();
    await page.waitForFunction(
      ({ selector, expected }) => {
        const current = JSON.parse(
          document.querySelector(selector)?.dataset.orbitalState || "null",
        );
        return (
          current?.renders > 0 &&
          Object.entries(expected).every(([key, value]) =>
            typeof value === "number"
              ? Math.abs(current[key] - value) < 0.0001
              : current[key] === value,
          )
        );
      },
      { selector: SURFACE, expected },
    );
    return state(page);
  };
  const openOrbitals = async (page) => {
    await page.getByRole("tab", { name: "Orbitals", exact: true }).click();
    await page.locator(SURFACE).scrollIntoViewIfNeeded();
    return waitState(page);
  };
  const tab = (page, name) => page.getByRole("tab", { name, exact: true });
  const loadElement = async (page, path, name) => {
    await page.goto(url(path), { waitUntil: "domcontentloaded" });
    await page
      .getByRole("article", { name: `${name} details`, exact: true })
      .waitFor();
    assert.equal(
      await tab(page, "Shell model").getAttribute("aria-selected"),
      "true",
    );
    assert.equal(
      await page.locator(SURFACE).count(),
      0,
      "Shell mode should not mount an orbital viewport",
    );
  };
  const scene = async (page) => {
    if (!(await page.evaluate(() => Boolean(window.__periodicScene))))
      return null;
    await page.waitForFunction(
      () =>
        window.__periodicScene?.count &&
        !window.__periodicScene.cameraMoving &&
        Math.abs(window.__periodicScene.transition) < 0.002,
    );
    await page.waitForTimeout(250);
    return page.evaluate(() => window.__periodicScene);
  };
  const screenshot = async (page, name) => {
    await page.screenshot({ path: artifact(name) });
    return artifact(name);
  };
  const styles = (locator) =>
    locator.evaluate((element) => {
      const value = getComputedStyle(element);
      return {
        background: value.backgroundColor,
        color: value.color,
        border: value.borderColor,
        touchAction: value.touchAction,
      };
    });
  const dismissExpectedDevelopmentError = async (page) => {
    // Next's development-only overlay also reports errors caught by a React
    // boundary. Close its own UI after deliberately injecting a failure.
    const close = page.locator("nextjs-portal").getByRole("button", {
      name: "Close",
      exact: true,
    });
    if (await close.isVisible()) await close.click();
  };

  try {
    const { page } = await makePage(
      { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 },
      "desktop",
    );
    report.measurements.environment = await page.evaluate(() => ({
      userAgent: navigator.userAgent,
      dpr: devicePixelRatio,
      width: innerWidth,
      height: innerHeight,
    }));
    currentCheck =
      "Hydrogen standalone, lazy mounting, keyboard tabs and shared metadata";
    await loadElement(page, "hydrogen/", "Hydrogen");
    const shellTab = tab(page, "Shell model");
    await shellTab.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await tab(page, "Orbitals").getAttribute("aria-selected"),
      "true",
    );
    assert.equal(
      await tab(page, "Orbitals").evaluate(
        (element) => element === document.activeElement,
      ),
      true,
    );
    await page.locator(SURFACE).scrollIntoViewIfNeeded();
    let orbital = await waitState(page, { orbital: "1s" });
    assert.equal(
      await page
        .getByRole("combobox", { name: "Orbital subshell" })
        .locator("option")
        .count(),
      1,
    );
    assert.equal(
      await page.getByRole("combobox", { name: "Orbital orientation" }).count(),
      0,
    );
    const structure = page
      .locator("section")
      .filter({ has: page.getByRole("tablist") });
    assert.equal(
      await structure
        .getByText("Electron configuration", { exact: true })
        .count(),
      1,
    );
    assert.equal(
      await structure.getByText("electrons by shell", { exact: true }).count(),
      1,
    );
    assert.equal(await page.locator("canvas").count(), 1);
    await screenshot(page, "hydrogen-desktop");
    await tab(page, "Orbitals").focus();
    await page.keyboard.press("Home");
    assert.equal(await shellTab.getAttribute("aria-selected"), "true");
    assert.equal(await page.locator(SURFACE).count(), 0);
    await page.keyboard.press("End");
    await page.locator(SURFACE).scrollIntoViewIfNeeded();
    await waitState(page, { orbital: "1s" });
    record(currentCheck);

    currentCheck =
      "Carbon subshells, basis orientations, cross-section and reset";
    await loadElement(page, "carbon/", "Carbon");
    orbital = await openOrbitals(page);
    assert.equal(orbital.orbital, "2p");
    assert.equal(orbital.axis, "z");
    assert.deepEqual(
      await page
        .getByRole("combobox", { name: "Orbital subshell" })
        .locator("option")
        .allTextContents(),
      ["1s", "2s", "2p"],
    );
    for (const axis of ["x", "y", "z"]) {
      await page
        .getByRole("combobox", { name: "Orbital orientation" })
        .selectOption(axis);
      await waitState(page, { axis });
      assert.ok(
        await page
          .getByTestId("orbital-visualization")
          .getByText("2 electrons in 2p subshell", { exact: true })
          .isVisible(),
      );
    }
    await screenshot(page, "carbon-2p-desktop");
    await page
      .getByRole("combobox", { name: "Orbital subshell" })
      .selectOption("2s");
    await waitState(page, { orbital: "2s", cutaway: false, zoom: 1 });
    assert.equal(
      await page.getByRole("combobox", { name: "Orbital orientation" }).count(),
      0,
    );
    await page.getByRole("checkbox", { name: "Show cross-section" }).check();
    await waitState(page, { orbital: "2s", cutaway: true });
    await screenshot(page, "carbon-2s-cutaway");
    await page
      .getByRole("combobox", { name: "Orbital subshell" })
      .selectOption("1s");
    await waitState(page, { orbital: "1s", cutaway: false });
    assert.equal(
      await page
        .getByRole("checkbox", { name: "Show cross-section" })
        .isChecked(),
      false,
    );
    record(currentCheck);

    currentCheck =
      "Orbital camera buttons, keyboard, bounds and white resting controls";
    const surface = page.locator(SURFACE);
    await surface.focus();
    const initial = await state(page);
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      (yaw) =>
        JSON.parse(
          document.querySelector('[data-testid="orbital-surface"]').dataset
            .orbitalState,
        ).yaw > yaw,
      initial.yaw,
    );
    await page.keyboard.press("Home");
    await waitState(page, { yaw: initial.yaw, pitch: initial.pitch, zoom: 1 });
    for (let i = 0; i < 16; i++)
      await page
        .getByRole("button", { name: "Zoom in orbital", exact: true })
        .click();
    await surface.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const nearest = await state(page);
    assert.ok(nearest.zoom > 1 && nearest.zoom <= 8);
    await page
      .getByRole("button", { name: "Zoom in orbital", exact: true })
      .click();
    await waitState(page, { zoom: nearest.zoom });
    for (let i = 0; i < 20; i++)
      await page
        .getByRole("button", { name: "Zoom out orbital", exact: true })
        .click();
    await waitState(page, { zoom: 1 });
    for (let i = 0; i < 12; i++)
      await page
        .getByRole("button", { name: "Rotate orbital up", exact: true })
        .click();
    await waitState(page, { pitch: 1.4 });
    for (let i = 0; i < 18; i++)
      await page
        .getByRole("button", { name: "Rotate orbital down", exact: true })
        .click();
    await waitState(page, { pitch: -1.4 });
    const reset = page.getByRole("button", {
      name: "Reset orbital view",
      exact: true,
    });
    await reset.click();
    await waitState(page, { yaw: initial.yaw, pitch: initial.pitch, zoom: 1 });
    await page.mouse.move(1, 1);
    await page.waitForTimeout(180);
    assert.equal((await styles(reset)).background, "rgb(255, 255, 255)");
    record(currentCheck);

    currentCheck = "Ray-march cache is idle while stationary and offscreen";
    await surface.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const cached = await state(page);
    await page.waitForTimeout(650);
    assert.equal(
      (await state(page)).renders,
      cached.renders,
      "Stationary orbital should reuse its render target",
    );
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const offscreen = await state(page);
    await page.waitForTimeout(650);
    assert.equal(
      (await state(page)).renders,
      offscreen.renders,
      "Offscreen orbital should not ray-march",
    );
    record(currentCheck, {
      idleRenders: cached.renders,
      offscreenRenders: offscreen.renders,
      renderSize: [cached.width, cached.height],
      steps: cached.steps,
    });

    currentCheck = "Desktop interaction frame sample";
    await surface.scrollIntoViewIfNeeded();
    await surface.focus();
    const frameTimes = await surface.evaluate(
      (element) =>
        new Promise((resolve) => {
          const intervals = [];
          let previous = performance.now();
          function step(now) {
            intervals.push(now - previous);
            previous = now;
            element.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "ArrowRight",
                bubbles: true,
              }),
            );
            if (intervals.length < 45) requestAnimationFrame(step);
            else resolve(intervals.slice(1));
          }
          requestAnimationFrame(step);
        }),
    );
    const sorted = [...frameTimes].sort((a, b) => a - b);
    report.measurements.desktopInteraction = {
      samples: frameTimes.length,
      medianMs: sorted[Math.floor(sorted.length / 2)],
      p95Ms: sorted[Math.floor(sorted.length * 0.95)],
      intervalMs: frameTimes,
      kind: "Browser animation-frame intervals during keyboard rotation; not GPU timer queries",
    };
    record(currentCheck);

    currentCheck = "Gold retains the existing shell-only card";
    await page.goto(url("gold/"));
    await page
      .getByRole("article", { name: "Gold details", exact: true })
      .waitFor();
    assert.equal(
      await page.getByRole("tab", { name: "Orbitals", exact: true }).count(),
      0,
    );
    assert.equal(await page.locator(SURFACE).count(), 0);
    assert.ok(
      await page
        .getByRole("button", { name: "Pause orbit", exact: true })
        .count(),
    );
    record(currentCheck);

    currentCheck =
      "Designs and Timeline sidebar entry, direct refresh and camera isolation";
    let testedCamera = false;
    for (const [path, name, expectedOrbital] of [
      ["?element=hydrogen", "Hydrogen", "1s"],
      ["?element=carbon", "Carbon", "2p"],
      ["timeline/?design=racetrack&element=hydrogen", "Hydrogen", "1s"],
      ["timeline/?design=racetrack&element=carbon", "Carbon", "2p"],
    ]) {
      await loadElement(page, path, name);
      await openOrbitals(page);
      await waitState(page, { orbital: expectedOrbital });
      const before = await scene(page);
      const box = await surface.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width / 2 + 40,
        box.y + box.height / 2 + 18,
        { steps: 6 },
      );
      await page.mouse.up();
      if (before) {
        const after = await scene(page);
        assert.ok(
          vectorDistance(before.camera, after.camera) < 0.001,
          "Orbital drag moved the table camera",
        );
        assert.ok(
          vectorDistance(before.target, after.target) < 0.001,
          "Orbital drag moved the table target",
        );
        testedCamera = true;
      }
      const savedOrbital = await state(page);
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
      const tableZoomed = await scene(page);
      await surface.scrollIntoViewIfNeeded();
      await waitState(page, {
        yaw: savedOrbital.yaw,
        pitch: savedOrbital.pitch,
        zoom: savedOrbital.zoom,
      });
      if (before && tableZoomed)
        assert.ok(
          vectorDistance(before.camera, tableZoomed.camera) > 0.05,
          "Table zoom stopped working while orbitals are open",
        );
      await page.reload();
      await page
        .getByRole("article", { name: `${name} details`, exact: true })
        .waitFor();
      assert.equal(
        await tab(page, "Shell model").getAttribute("aria-selected"),
        "true",
      );
      await openOrbitals(page);
      await waitState(page, { orbital: expectedOrbital });
      assert.equal(await page.locator("canvas").count(), 1);
    }
    if (!testedCamera)
      report.limitations.push(
        "Table-camera coordinate instrumentation is development-only; exported app run checks control availability and orbital state isolation instead.",
      );
    await screenshot(page, "carbon-timeline-sidebar");
    record(currentCheck, { tableCameraCoordinatesVerified: testedCamera });

    currentCheck =
      "Repeated H/C switches release orbital resources and reset defaults";
    await page.goto(url("?element=hydrogen"));
    await openOrbitals(page);
    const memory = [];
    for (let index = 0; index < stressSwitches; index++) {
      const number = index % 2 === 0 ? 6 : 1;
      const name = number === 6 ? "Carbon" : "Hydrogen";
      const finder = page.locator("details.explorerKeyboard").filter({
        has: page.getByRole("searchbox", {
          name: "Search all elements",
          includeHidden: true,
        }),
      });
      if ((await finder.getAttribute("open")) === null)
        await finder.locator("summary").click();
      await page
        .getByRole("searchbox", { name: "Search all elements" })
        .fill(String(number));
      await page
        .getByRole("button", {
          name: `${number}. ${name}, ${number === 6 ? "C" : "H"}`,
          exact: true,
        })
        .click();
      await page
        .getByRole("article", { name: `${name} details`, exact: true })
        .waitFor();
      assert.equal(
        await tab(page, "Shell model").getAttribute("aria-selected"),
        "true",
      );
      const item = await openOrbitals(page);
      assert.equal(item.orbital, number === 6 ? "2p" : "1s");
      memory.push({
        index,
        element: name,
        textures: item.textures,
        geometries: item.geometries,
      });
    }
    if (memory.length >= 8) {
      const first = memory.slice(2, 8),
        last = memory.slice(-6);
      assert.ok(
        Math.max(...last.map((item) => item.textures)) <=
          Math.max(...first.map((item) => item.textures)) + 4,
        "Texture count grows after repeated orbital unmounts",
      );
      assert.ok(
        Math.max(...last.map((item) => item.geometries)) <=
          Math.max(...first.map((item) => item.geometries)) + 4,
        "Geometry count grows after repeated orbital unmounts",
      );
    }
    report.measurements.switchResources = memory;
    record(currentCheck, { switches: stressSwitches });

    currentCheck =
      "Touch activation, orbital gestures, scroll escape and mobile layout";
    const { context: mobileContext, page: mobile } = await makePage(
      {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
      "emulated phone",
    );
    await loadElement(mobile, "carbon/", "Carbon");
    await openOrbitals(mobile);
    const mobileSurface = mobile.locator(SURFACE);
    assert.equal((await styles(mobileSurface)).touchAction, "pan-y");
    assert.ok(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await mobile
      .getByRole("button", { name: "Interact with orbital", exact: true })
      .tap();
    await mobileSurface.evaluate((element) =>
      element.scrollIntoView({ block: "center" }),
    );
    assert.equal((await styles(mobileSurface)).touchAction, "none");
    const cdp = await mobileContext.newCDPSession(mobile);
    try {
      const box = await mobileSurface.boundingBox();
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2;
      const start = await state(mobile);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y, id: 1 }],
      });
      for (let i = 1; i <= 6; i++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x + i * 6, y: y + i * 2, id: 1 }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await mobile.waitForFunction(
        (yaw) =>
          JSON.parse(
            document.querySelector('[data-testid="orbital-surface"]').dataset
              .orbitalState,
          ).yaw !== yaw,
        start.yaw,
      );
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          { x: x - 25, y, id: 1 },
          { x: x + 25, y, id: 2 },
        ],
      });
      for (let i = 1; i <= 5; i++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            { x: x - 25 - i * 4, y, id: 1 },
            { x: x + 25 + i * 4, y, id: 2 },
          ],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await mobile.waitForFunction(
        () =>
          JSON.parse(
            document.querySelector('[data-testid="orbital-surface"]').dataset
              .orbitalState,
          ).zoom > 1.1,
      );
      await mobile
        .getByRole("button", { name: "Done interacting", exact: true })
        .tap();
      assert.equal((await styles(mobileSurface)).touchAction, "pan-y");
      await mobileSurface.evaluate((element) =>
        element.scrollIntoView({ block: "center" }),
      );
      const inactive = await state(mobile);
      const scrollStart = await mobile.evaluate(() => scrollY);
      const scrollBox = await mobileSurface.boundingBox();
      const sx = scrollBox.x + scrollBox.width / 2,
        sy = scrollBox.y + scrollBox.height * 0.7;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: sx, y: sy, id: 1 }],
      });
      for (let i = 1; i <= 6; i++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: sx, y: sy - i * 18, id: 1 }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await mobile.waitForTimeout(250);
      assert.ok(
        (await mobile.evaluate(() => scrollY)) > scrollStart + 20,
        "Inactive orbital should allow vertical page scrolling",
      );
      assert.equal((await state(mobile)).yaw, inactive.yaw);
      await mobileSurface.scrollIntoViewIfNeeded();
      await screenshot(mobile, "carbon-phone");
      await mobile.setViewportSize({ width: 844, height: 390 });
      assert.ok(
        await mobile.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await mobileSurface.scrollIntoViewIfNeeded();
      await screenshot(mobile, "carbon-phone-landscape");
      report.measurements.emulatedMobile = await state(mobile);
    } finally {
      await cdp.detach();
    }
    record(currentCheck);

    currentCheck =
      "Reduced motion leaves static orbitals and usable keyboard controls";
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    await mobile
      .getByRole("button", { name: "Reset orbital view", exact: true })
      .click();
    await mobileSurface.scrollIntoViewIfNeeded();
    await mobile.waitForTimeout(300);
    const still = await state(mobile);
    await mobile.waitForTimeout(400);
    assert.equal((await state(mobile)).yaw, still.yaw);
    assert.equal((await state(mobile)).renders, still.renders);
    await tab(mobile, "Shell model").click();
    assert.equal(
      await mobile
        .getByRole("button", {
          name: "Orbit paused · reduced motion",
          exact: true,
        })
        .isDisabled(),
      true,
    );
    record(currentCheck);

    currentCheck =
      "WebGL failure preserves orbital explanations, shell view and HTML details";
    const { page: fallback } = await makePage(
      { viewport: { width: 1200, height: 900 } },
      "simulated WebGL failure",
      true,
    );
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/i.test(type) ? null : original.call(this, type, ...args);
      };
    });
    await loadElement(fallback, "carbon/", "Carbon");
    await tab(fallback, "Orbitals").click();
    await fallback
      .getByRole("status")
      .filter({ hasText: "The 3D orbital view is unavailable" })
      .waitFor();
    await dismissExpectedDevelopmentError(fallback);
    assert.ok(
      await fallback
        .getByRole("heading", { name: "At a glance", exact: true })
        .count(),
    );
    await screenshot(fallback, "webgl-fallback");
    await tab(fallback, "Shell model").click();
    assert.equal(
      await tab(fallback, "Shell model").getAttribute("aria-selected"),
      "true",
    );
    record(currentCheck);

    currentCheck = "Optional orbital chunk failure stays within the card";
    const { page: loadFailure } = await makePage(
      { viewport: { width: 1200, height: 900 } },
      "simulated orbital chunk failure",
      true,
    );
    await loadElement(loadFailure, "carbon/", "Carbon");
    await loadFailure.locator("canvas").waitFor();
    await loadFailure.waitForLoadState("networkidle");
    const blockedChunks = [];
    await loadFailure.route("**/_next/static/**/*.js*", async (route) => {
      if (route.request().resourceType() === "script") {
        blockedChunks.push(route.request().url());
        await route.abort("failed");
      } else await route.continue();
    });
    await tab(loadFailure, "Orbitals").click();
    await loadFailure
      .getByRole("status")
      .filter({ hasText: /The orbital view (could not load|is unavailable)/ })
      .waitFor();
    await dismissExpectedDevelopmentError(loadFailure);
    assert.ok(
      blockedChunks.length,
      "The failure test must abort a lazily requested script",
    );
    assert.equal(await loadFailure.locator("canvas").count(), 1);
    assert.ok(
      await loadFailure
        .getByRole("heading", { name: "At a glance", exact: true })
        .count(),
    );
    await loadFailure.unroute("**/_next/static/**/*.js*");
    await tab(loadFailure, "Shell model").click();
    await loadFailure
      .getByRole("button", { name: "Pause orbit", exact: true })
      .waitFor();
    assert.equal(
      await tab(loadFailure, "Shell model").getAttribute("aria-selected"),
      "true",
    );
    record(currentCheck, { blockedChunks });

    currentCheck = "No unexpected renderer or React errors";
    const unexpected = report.diagnostics.filter((item) => !item.expected);
    assert.deepEqual(unexpected, []);
    record(currentCheck);
  } catch (error) {
    report.checks.push({
      name: currentCheck,
      status: "failed",
      error: error.stack || error.message,
    });
  } finally {
    // Preserve the failed-check report even if the test browser disconnected.
    for (const context of contexts.reverse()) await context.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    report.passed = report.checks.filter(
      (item) => item.status === "passed",
    ).length;
    report.failed = report.checks.filter(
      (item) => item.status === "failed",
    ).length;
    report.reportPath = artifact("browser-checks", "json");
    await writeFile(report.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}
