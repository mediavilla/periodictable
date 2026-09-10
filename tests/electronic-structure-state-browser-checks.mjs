import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const CARD = '[data-testid="electronic-structure"]';
const SURFACE = '[data-testid="orbital-surface"]';
const STRIP = '[data-testid="configuration-strip"]';
const SCROLL = '[data-testid="configuration-scroll"]';
const elements = JSON.parse(
  await readFile(new URL("../public/elements.json", import.meta.url)),
);
const referenceNumbers = [1, 6, 26, 79, 118];
const pilots = referenceNumbers.map((number) => ({
  ...elements[number - 1],
  ids: [
    ...elements[number - 1].electron_configuration.matchAll(
      /([1-7][spdf])\d+/g,
    ),
  ].map((match) => match[1]),
}));
const hydrogen = pilots[0];
const oganesson = pilots.find((element) => element.number === 118);

/** Run in a caller-owned Playwright Browser; never launches a browser. */
export async function runElectronicStructureStateChecks(
  browser,
  baseURL = "http://localhost:3040",
  { switches = 12 } = {},
) {
  const root = new URL(`${baseURL.replace(/\/+$/, "")}/`);
  const url = (path = "") => new URL(path.replace(/^\//, ""), root).href;
  const tag =
    root.pathname.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "root";
  const report = {
    startedAt: new Date().toISOString(),
    baseURL: root.href,
    checks: [],
    diagnostics: [],
    measurements: {},
    limitations: ["Touch uses Chromium emulation, not a physical device."],
  };
  const contexts = [];
  let current = "Setup",
    activePage;
  await mkdir("artifacts/verification", { recursive: true });
  const record = (detail) =>
    report.checks.push({ name: current, status: "passed", detail });
  const makePage = async (settings = {}) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      ...settings,
    });
    contexts.push(context);
    const page = await context.newPage();
    activePage = page;
    page.setDefaultTimeout(30000);
    page.on("pageerror", (error) => report.diagnostics.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /THREE|WebGL|shader|React|ChunkLoadError/i.test(message.text())
      )
        report.diagnostics.push(message.text());
    });
    return { page, context };
  };
  const card = (page) => page.locator(CARD);
  const tab = (page, name) =>
    card(page).getByRole("tab", { name, exact: true });
  const eye = (page, id) => card(page).getByTestId(`visibility-${id}`);
  const readState = (page) =>
    page
      .locator(SURFACE)
      .evaluate((element) =>
        JSON.parse(element.dataset.orbitalState || "null"),
      );
  const ready = async (page, expected = {}) => {
    await page.locator(SURFACE).evaluate((element) =>
      element.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "instant",
      }),
    );
    await page.waitForFunction(
      ({ selector, expected }) => {
        const state = JSON.parse(
          document.querySelector(selector)?.dataset.orbitalState || "null",
        );
        return (
          state?.renders > 0 &&
          !state.pending &&
          Object.entries(expected).every(
            ([key, value]) =>
              JSON.stringify(state[key]) === JSON.stringify(value),
          )
        );
      },
      { selector: SURFACE, expected },
    );
    return readState(page);
  };
  const orbitals = async (page, expected = {}) => {
    await tab(page, "Orbitals").click();
    return ready(page, expected);
  };
  const chooseElement = async (page, element) => {
    const finder = page
      .locator("details.explorerKeyboard")
      .filter({ has: page.locator('input[aria-label="Search all elements"]') });
    if ((await finder.getAttribute("open")) === null)
      await finder.locator("summary").click();
    await page
      .getByRole("searchbox", { name: "Search all elements", exact: true })
      .fill(String(element.number));
    await page
      .getByRole("button", {
        name: `${element.number}. ${element.name}, ${element.symbol}`,
        exact: true,
      })
      .click();
    await page
      .getByRole("article", { name: `${element.name} details`, exact: true })
      .waitFor();
  };
  const assertDefaults = async (page, element) => {
    assert.equal(
      await tab(page, "Shell model").getAttribute("aria-selected"),
      "true",
    );
    assert.equal(
      await card(page).locator(STRIP).getAttribute("data-expanded"),
      "false",
    );
    assert.equal(await page.locator(SURFACE).count(), 0);
    await card(page)
      .getByRole("button", { name: "Pause orbit", exact: true })
      .waitFor();
    const value = await orbitals(page, {
      visibleSubshells: element.ids,
      sizeMode: "normalized",
      cutaway: false,
    });
    assert.equal(
      await page
        .getByRole("checkbox", {
          name: "Preserve model size ratios",
          exact: true,
        })
        .isChecked(),
      false,
    );
    assert.equal(
      await page
        .getByRole("checkbox", { name: "Show cross-section", exact: true })
        .isChecked(),
      false,
    );
    for (const [id, axis] of Object.entries(value.orientations))
      if (id.endsWith("p")) assert.equal(axis, "z");
    assert.ok(
      Math.abs(value.yaw - 0.85) < 0.0001 &&
        Math.abs(value.pitch - 0.32) < 0.0001,
      "New elements must receive their default orbital camera",
    );
    return value;
  };
  const dirtyCurrent = async (page, element) => {
    const firstP = element.ids.find((id) => id.endsWith("p"));
    const core = card(page).getByTestId("core-toggle");
    if (await core.count()) await core.click();
    if (firstP)
      await card(page)
        .getByRole("button", { name: `${firstP} x orbital`, exact: true })
        .click();
    await page
      .getByRole("checkbox", {
        name: "Preserve model size ratios",
        exact: true,
      })
      .check();
    await page
      .getByRole("checkbox", { name: "Show cross-section", exact: true })
      .check();
    await page
      .getByRole("button", { name: "Rotate orbital right", exact: true })
      .click();
    await ready(page, { sizeMode: "ratios", cutaway: true });
    if (element.number !== 1) {
      await eye(page, "1s").click();
      await ready(page, {
        visibleSubshells: element.ids.filter((id) => id !== "1s"),
      });
    }
    await tab(page, "Shell model").click();
    await card(page)
      .getByRole("button", { name: "Pause orbit", exact: true })
      .click();
    await orbitals(page, { sizeMode: "ratios", cutaway: true });
  };
  const alignment = async (page) =>
    card(page).evaluate((element) => {
      return [...element.querySelectorAll("[data-config-group]")].map(
        (group) => {
          const count = [...element.querySelectorAll("[data-count]")].find(
            (item) => item.dataset.groupId === group.dataset.groupId,
          );
          const a = count.getBoundingClientRect(),
            b = group.getBoundingClientRect();
          return {
            id: group.dataset.groupId,
            count: { x: a.x, width: a.width },
            configuration: { x: b.x, width: b.width },
          };
        },
      );
    });

  try {
    const { page } = await makePage();
    current =
      "SPA element changes reset structure state and retain one renderer";
    await page.goto(url("?element=hydrogen"), {
      waitUntil: "domcontentloaded",
    });
    await card(page).waitFor();
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.locator("canvas").waitFor();
    const canvas = await page.locator("canvas").elementHandle();
    const resourceSamples = [];
    await assertDefaults(page, hydrogen);
    await dirtyCurrent(page, hydrogen);
    for (let index = 0; index < switches; index++) {
      const element = pilots[(index + 1) % pilots.length];
      await chooseElement(page, element);
      assert.equal(
        await page.evaluate(() => performance.timeOrigin),
        timeOrigin,
        "Element choice caused a full-page navigation",
      );
      assert.equal(await page.locator("canvas").count(), 1);
      assert.equal(
        await page
          .locator("canvas")
          .evaluate((current, original) => current === original, canvas),
        true,
        "SPA element selection replaced the shared Canvas",
      );
      const value = await assertDefaults(page, element);
      resourceSamples.push({
        index,
        element: element.symbol,
        textures: value.textures,
        geometries: value.geometries,
        fieldBytes: value.fieldBytes,
        generationMs: value.fieldGenerationMs,
      });
      await dirtyCurrent(page, element);
    }
    for (const element of pilots) {
      const samples = resourceSamples.filter(
        (item) => item.element === element.symbol,
      );
      if (samples.length < 3) continue;
      const warm = samples[1],
        last = samples[samples.length - 1];
      assert.ok(
        last.textures <= warm.textures + 4,
        `${element.symbol}: textures grew across repeated SPA mounts`,
      );
      assert.ok(
        last.geometries <= warm.geometries + 4,
        `${element.symbol}: geometries grew across repeated SPA mounts`,
      );
      assert.equal(
        last.fieldBytes,
        warm.fieldBytes,
        `${element.symbol}: equivalent default fields must have the same storage size`,
      );
    }
    report.measurements.spaResources = resourceSamples;
    record({ switches, sameDocument: true, sameCanvas: true });

    current =
      "Rapid visibility, orientation and size requests resolve to the last UI state";
    await chooseElement(page, oganesson);
    const ogDefault = await assertDefaults(page, oganesson);
    await card(page).getByTestId("core-toggle").click();
    await eye(page, "1s").click({ force: true });
    await eye(page, "1s").click({ force: true });
    await card(page)
      .getByRole("button", { name: "2p x orbital", exact: true })
      .click({ force: true });
    await card(page)
      .getByRole("button", { name: "2p y orbital", exact: true })
      .click({ force: true });
    await card(page)
      .getByRole("button", { name: "2p z orbital", exact: true })
      .click({ force: true });
    await page
      .getByRole("checkbox", {
        name: "Preserve model size ratios",
        exact: true,
      })
      .check({ force: true });
    await page
      .getByRole("checkbox", {
        name: "Preserve model size ratios",
        exact: true,
      })
      .uncheck({ force: true });
    const latest = await ready(page, {
      visibleSubshells: oganesson.ids,
      sizeMode: "normalized",
      orientations: ogDefault.orientations,
    });
    await page.waitForTimeout(600);
    const settled = await readState(page);
    assert.equal(settled.pending, false);
    assert.deepEqual(settled.visibleSubshells, oganesson.ids);
    assert.deepEqual(settled.orientations, ogDefault.orientations);
    assert.equal(settled.sizeMode, "normalized");
    record({ generation: latest.fieldGeneration });

    current =
      "A→B→A cancels pending work without a stuck loader or late stale field";
    const stateA = await ready(page, { sizeMode: "normalized" });
    const ratio = page.getByRole("checkbox", {
      name: "Preserve model size ratios",
      exact: true,
    });
    await ratio.check({ force: true });
    await page.waitForFunction(
      (selector) =>
        JSON.parse(
          document.querySelector(selector)?.dataset.orbitalState || "null",
        )?.pending,
      SURFACE,
    );
    await ratio.uncheck({ force: true });
    const restoredA = await ready(page, {
      visibleSubshells: stateA.visibleSubshells,
      orientations: stateA.orientations,
      sizeMode: "normalized",
    });
    await page.waitForTimeout(700);
    const afterCancellation = await readState(page);
    assert.equal(afterCancellation.pending, false);
    assert.equal(afterCancellation.sizeMode, "normalized");
    assert.deepEqual(afterCancellation.orientations, stateA.orientations);
    assert.deepEqual(
      afterCancellation.visibleSubshells,
      stateA.visibleSubshells,
    );
    record({
      generationBefore: stateA.fieldGeneration,
      generationAfter: restoredA.fieldGeneration,
      reusedAcceptedA: restoredA.fieldGeneration === stateA.fieldGeneration,
    });

    current = "Show all restores visibility without resetting other card state";
    await card(page)
      .getByRole("button", { name: "2p y orbital", exact: true })
      .click();
    await ratio.check();
    await page
      .getByRole("checkbox", { name: "Show cross-section", exact: true })
      .check();
    await page
      .getByRole("button", { name: "Rotate orbital right", exact: true })
      .click();
    const configured = await ready(page, {
      sizeMode: "ratios",
      cutaway: true,
    });
    await card(page)
      .getByRole("button", { name: "Hide all", exact: true })
      .click();
    await ready(page, { visibleSubshells: [] });
    assert.equal(
      await card(page)
        .getByRole("button", { name: "Hide all", exact: true })
        .isDisabled(),
      true,
    );
    await card(page)
      .getByRole("button", { name: "Show all", exact: true })
      .click();
    const shown = await ready(page, {
      visibleSubshells: oganesson.ids,
      orientations: configured.orientations,
      sizeMode: "ratios",
      cutaway: true,
    });
    assert.equal(
      await card(page).locator(STRIP).getAttribute("data-expanded"),
      "true",
    );
    assert.equal(
      await card(page)
        .getByRole("button", { name: "Show all", exact: true })
        .isDisabled(),
      true,
    );
    for (const key of ["yaw", "pitch", "zoom"])
      assert.ok(
        Math.abs(shown[key] - configured[key]) < 0.0001,
        `Show all must preserve the orbital camera ${key}`,
      );
    record({
      visibleSubshells: shown.visibleSubshells.length,
      retainedAxis: shown.orientations["2p"],
    });

    current =
      "Count buttons and passive counts span their matching configuration groups";
    for (const mode of ["Shell model", "Orbitals"]) {
      await tab(page, mode).click();
      for (const width of [1440, 768, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.waitForTimeout(150);
        const measured = await alignment(page);
        assert.equal(measured.length, 7);
        for (const group of measured) {
          assert.ok(
            Math.abs(group.count.x - group.configuration.x) <= 1,
            `${mode} ${width}px: ${group.id} is misaligned`,
          );
          assert.ok(
            Math.abs(group.count.width - group.configuration.width) <= 1,
            `${mode} ${width}px: ${group.id} count does not span the group`,
          );
        }
      }
    }
    record();

    current = "Keyboard navigation brings clipped XYZ controls into view";
    await page.setViewportSize({ width: 390, height: 844 });
    const scroll = card(page).locator(SCROLL);
    await scroll.evaluate((element) =>
      element.scrollTo({ left: 0, behavior: "instant" }),
    );
    const firstX = card(page).getByRole("button", {
      name: "2p x orbital",
      exact: true,
    });
    const lastX = card(page).getByRole("button", {
      name: "7p x orbital",
      exact: true,
    });
    await firstX.focus();
    let reached = false;
    for (let index = 0; index < 100; index++) {
      if (
        await lastX.evaluate((element) => element === document.activeElement)
      ) {
        reached = true;
        break;
      }
      await page.keyboard.press("Tab");
    }
    assert.ok(
      reached,
      "XYZ controls must be reachable in natural keyboard order",
    );
    assert.ok((await scroll.evaluate((element) => element.scrollLeft)) > 0);
    const outer = await scroll.boundingBox(),
      target = await lastX.boundingBox();
    assert.ok(
      target.x >= outer.x - 1 &&
        target.x + target.width <= outer.x + outer.width + 1,
      "Focused XYZ control remains horizontally clipped",
    );
    await page.keyboard.press("Space");
    await ready(page);
    assert.equal((await readState(page)).orientations["7p"], "x");
    await page.screenshot({
      path: `artifacts/verification/structure-state-${tag}-keyboard.png`,
    });
    record();

    current =
      "Touch swipes over shell counts scroll without activating a shell preview";
    const { page: phone, context: mobile } = await makePage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await phone.goto(url("carbon/"), { waitUntil: "domcontentloaded" });
    await card(phone).waitFor();
    const count = card(phone).locator('[data-count="4"]');
    await count.scrollIntoViewIfNeeded();
    await phone.waitForTimeout(150);
    const highlight = () =>
      card(phone)
        .getByTestId("bohr-viewport")
        .getAttribute("data-highlighted-shells");
    assert.equal(await highlight(), "");
    const cdp = await mobile.newCDPSession(phone);
    try {
      const box = await count.boundingBox();
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2;
      const initialScroll = await phone.evaluate(() => scrollY);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y, id: 1 }],
      });
      for (let index = 1; index <= 7; index++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: y - index * 12, id: 1 }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await phone.waitForTimeout(250);
      assert.equal(
        await highlight(),
        "",
        "A vertical swipe must not be interpreted as a preview tap",
      );
      assert.ok(
        (await phone.evaluate(() => scrollY)) > initialScroll + 10,
        "Touch gesture should allow normal page scrolling",
      );
      await count.scrollIntoViewIfNeeded();
      await count.tap();
      await phone.waitForFunction(
        () =>
          document.querySelector('[data-testid="bohr-viewport"]')?.dataset
            .highlightedShells === "1",
      );
      await count.tap();
      await phone.waitForFunction(
        () =>
          document.querySelector('[data-testid="bohr-viewport"]')?.dataset
            .highlightedShells === "",
      );
      assert.equal(
        await highlight(),
        "",
        "Second genuine tap should dismiss the preview",
      );
    } finally {
      await cdp.detach();
    }
    record();

    current = "No unexpected errors during sustained state changes";
    assert.deepEqual(report.diagnostics, []);
    record();
  } catch (error) {
    report.checks.push({
      name: current,
      status: "failed",
      error: error.stack || error.message,
    });
    await activePage
      ?.screenshot({
        path: `artifacts/verification/structure-state-${tag}-failure.png`,
      })
      .catch(() => {});
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    report.finishedAt = new Date().toISOString();
    report.passed = report.checks.filter(
      (check) => check.status === "passed",
    ).length;
    report.failed = report.checks.filter(
      (check) => check.status === "failed",
    ).length;
    report.reportPath = `artifacts/verification/structure-state-${tag}-browser.json`;
    await writeFile(report.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}
