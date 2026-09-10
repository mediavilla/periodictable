import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const S = '[data-testid="orbital-surface"]';
const C = '[data-testid="electronic-structure"]';
const Q = '[data-testid="configuration-scroll"]';

export async function runOrbitalChecks(
  browser,
  baseURL = "http://localhost:3040",
  { stressSwitches = 30 } = {},
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
    limitations: [
      "Mobile checks use viewport/touch emulation, not a physical phone.",
    ],
  };
  await mkdir("artifacts/verification", { recursive: true });
  const contexts = [];
  let current = "Setup",
    activePage;
  const record = (detail) =>
    report.checks.push({ name: current, status: "passed", detail });
  const makePage = async (settings = {}, expectedErrors = false) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      ...settings,
    });
    contexts.push(context);
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.on("pageerror", (e) =>
      report.diagnostics.push({ expected: expectedErrors, message: e.message }),
    );
    page.on("console", (m) => {
      if (
        m.type() === "error" &&
        /THREE|WebGL|shader|React|ChunkLoadError/i.test(m.text())
      )
        report.diagnostics.push({
          expected: expectedErrors,
          message: m.text(),
        });
    });
    activePage = page;
    return page;
  };
  const card = (p) => p.locator(C);
  const tab = (p, name) => card(p).getByRole("tab", { name, exact: true });
  const core = (p) => card(p).getByTestId("core-toggle");
  const chip = (p, id) => card(p).locator(`[data-subshell-id="${id}"]`);
  const eye = (p, id) => card(p).getByTestId(`visibility-${id}`);
  const counts = (p) =>
    card(p)
      .locator("[data-group-id][data-count]")
      .evaluateAll((es) => es.map((e) => Number(e.dataset.count)));
  const highlight = (p) =>
    card(p)
      .locator("[data-highlighted-shells]")
      .getAttribute("data-highlighted-shells");
  const state = (p) =>
    p.locator(S).evaluate((e) => JSON.parse(e.dataset.orbitalState || "null"));
  const ready = async (p, expected = {}) => {
    await p.locator(S).scrollIntoViewIfNeeded();
    await p.waitForFunction(
      ({ S, expected }) => {
        const v = JSON.parse(
          document.querySelector(S)?.dataset.orbitalState || "null",
        );
        return (
          v?.renders > 0 &&
          !v.pending &&
          Object.entries(expected).every(([k, val]) =>
            k === "visibleCount"
              ? v.visibleSubshells.length === val
              : JSON.stringify(v[k]) === JSON.stringify(val),
          )
        );
      },
      { S, expected },
    );
    return state(p);
  };
  const open = async (p, slug, name) => {
    await p.goto(url(`${slug}/`), { waitUntil: "domcontentloaded" });
    await p
      .getByRole("article", { name: `${name} details`, exact: true })
      .waitFor();
    await card(p).waitFor();
    assert.equal(
      await tab(p, "Shell model").getAttribute("aria-selected"),
      "true",
    );
    assert.equal(await p.locator(S).count(), 0);
    assert.equal(
      await card(p)
        .getByRole("heading", { name: "Inside a neutral atom" })
        .count(),
      0,
    );
  };
  const orbitals = async (p) => {
    await tab(p, "Orbitals").click();
    return ready(p);
  };
  const shot = async (p, name) => {
    await card(p).scrollIntoViewIfNeeded();
    await p.waitForTimeout(300);
    return card(p).screenshot({
      path: `artifacts/verification/structure-${tag}-${name}.png`,
    });
  };
  try {
    const p = await makePage();
    current = "H defaults, lazy mounting, no nested buttons and keyboard tabs";
    await open(p, "hydrogen", "Hydrogen");
    assert.deepEqual(await counts(p), [1]);
    assert.equal(await core(p).count(), 0);
    await tab(p, "Shell model").focus();
    await p.keyboard.press("ArrowRight");
    assert.deepEqual((await ready(p)).visibleSubshells, ["1s"]);
    assert.equal(await card(p).getByRole("combobox").count(), 0);
    assert.equal(await p.locator("canvas").count(), 1);
    assert.equal(await card(p).locator("button button").count(), 0);
    await tab(p, "Orbitals").focus();
    await p.keyboard.press("Home");
    assert.equal(
      await tab(p, "Shell model").getAttribute("aria-selected"),
      "true",
    );
    record();

    current = "Carbon hover/focus preview; mouse clicks never pin";
    await open(p, "carbon", "Carbon");
    assert.deepEqual(await counts(p), [2, 4]);
    const four = card(p).locator('[data-group-id][data-count="4"]');
    await four.hover();
    await p.waitForTimeout(150);
    assert.notEqual(await highlight(p), "");
    await four.click();
    await p.mouse.move(5, 5);
    await p.waitForTimeout(150);
    assert.equal(await highlight(p), "", "Mouse click must not pin preview");
    await tab(p, "Shell model").focus();
    for (let i = 0; i < 6; i++) {
      await p.keyboard.press("Tab");
      if (await four.evaluate((e) => e === document.activeElement)) break;
    }
    await p.waitForFunction(
      () =>
        document.querySelector("[data-highlighted-shells]")?.dataset
          .highlightedShells !== "",
    );
    assert.notEqual(await highlight(p), "");
    await tab(p, "Shell model").focus();
    assert.equal(await highlight(p), "");
    assert.equal(
      await card(p).locator('[data-testid^="visibility-"]').count(),
      0,
    );
    await shot(p, "carbon-shell");
    record();

    current = "Whole core button expansion/collapse";
    await core(p).click();
    assert.equal(await core(p).locator("sup").innerText(), "2");
    assert.match(await core(p).innerText(), /\[He\]/);
    assert.equal(await chip(p, "1s").count(), 1);
    await core(p).click();
    assert.equal(await chip(p, "1s").count(), 0);
    record();

    current =
      "Carbon core/subshell eyes, always-visible XYZ and state across tabs";
    assert.deepEqual((await orbitals(p)).visibleSubshells, ["1s", "2s", "2p"]);
    assert.equal(
      await chip(p, "2p").getByRole("button", { name: /2p.*x/i }).count(),
      1,
    );
    await eye(p, "core").click();
    await ready(p, { visibleSubshells: ["2s", "2p"] });
    await core(p).click();
    assert.equal(await eye(p, "1s").getAttribute("aria-pressed"), "false");
    await eye(p, "1s").click();
    await ready(p, { visibleSubshells: ["1s", "2s", "2p"] });
    await chip(p, "2p").getByRole("button", { name: /2p.*x/i }).click();
    await p.waitForFunction(
      (S) =>
        JSON.parse(document.querySelector(S)?.dataset.orbitalState || "null")
          ?.orientations?.["2p"] === "x",
      S,
    );
    await core(p).click();
    const beforeTab = await ready(p);
    await tab(p, "Shell model").click();
    await tab(p, "Orbitals").click();
    const afterTab = await ready(p);
    assert.deepEqual(afterTab.visibleSubshells, beforeTab.visibleSubshells);
    assert.equal(afterTab.orientations["2p"], "x");
    assert.equal(await card(p).locator("button button").count(), 0);
    await shot(p, "carbon-orbitals");
    record();

    current =
      "Size ratio checkbox, cutaway, empty state and camera persistence";
    await p
      .getByRole("button", { name: "Rotate orbital right", exact: true })
      .click();
    const beforeSize = await ready(p);
    await p
      .getByRole("checkbox", {
        name: "Preserve model size ratios",
        exact: true,
      })
      .check();
    const ratio = await ready(p, { sizeMode: "ratios" });
    assert.ok(Math.abs(ratio.yaw - beforeSize.yaw) < 1e-6);
    assert.ok(Math.abs(ratio.pitch - beforeSize.pitch) < 1e-6);
    await p
      .getByRole("checkbox", { name: "Show cross-section", exact: true })
      .check();
    await ready(p, { cutaway: true });
    await p.getByRole("button", { name: "Hide all", exact: true }).click();
    await card(p)
      .getByText(
        "All orbital shapes are hidden. Show all or select a subshell above.",
        { exact: true },
      )
      .waitFor();
    await card(p)
      .getByRole("button", { name: "Show all", exact: true })
      .first()
      .click();
    await ready(p, { visibleSubshells: ["1s", "2s", "2p"] });
    record();

    current =
      "Og abbreviated/expanded counts, 19 subshells and mixed core visibility";
    await open(p, "oganesson", "Oganesson");
    assert.deepEqual(await counts(p), [86, 14, 10, 8]);
    await card(p)
      .getByText("86 is the [Rn] core total across six shells.", {
        exact: true,
      })
      .waitFor();
    await core(p).click();
    assert.deepEqual(await counts(p), [2, 8, 18, 32, 32, 18, 8]);
    assert.equal(await card(p).locator("[data-subshell-id]").count(), 19);
    await shot(p, "oganesson-shell-expanded");
    await core(p).click();
    assert.equal((await orbitals(p)).visibleSubshells.length, 19);
    await eye(p, "core").click();
    await ready(p, { visibleSubshells: ["5f", "6d", "7s", "7p"] });
    await core(p).click();
    assert.equal(
      await card(p).locator('[data-testid^="visibility-"]').count(),
      19,
    );
    await eye(p, "1s").click();
    await core(p).click();
    assert.equal(await eye(p, "core").getAttribute("aria-pressed"), "mixed");
    await eye(p, "core").click();
    assert.equal(
      (await ready(p, { visibleCount: 19 })).visibleSubshells.length,
      19,
    );
    await core(p).click();
    record();

    current =
      "Horizontal pagination at desktop, tablet, portrait and landscape widths";
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await p.setViewportSize(viewport);
      await p.waitForTimeout(250);
      const scroller = card(p).locator(Q),
        next = card(p).getByRole("button", {
          name: /next configuration page/i,
        });
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
      await scroller.evaluate((e) =>
        e.scrollTo({ left: 0, behavior: "instant" }),
      );
      await p.waitForTimeout(150);
      await next.click();
      await p.waitForFunction(
        (Q) => document.querySelector(Q).scrollLeft > 0,
        Q,
      );
      const pages = card(p).getByRole("button", {
        name: /configuration page \d/i,
      });
      assert.ok((await pages.count()) > 1);
      await pages.last().click();
      await p.waitForFunction(
        (C) =>
          document.querySelector(`${C} [aria-label="Next configuration page"]`)
            ?.disabled,
        C,
        { timeout: 5000 },
      );
      await pages.first().click();
      await p.waitForFunction(
        (C) =>
          document.querySelector(
            `${C} [aria-label="Previous configuration page"]`,
          )?.disabled,
        C,
        { timeout: 5000 },
      );
      assert.equal(
        await card(p)
          .getByRole("button", { name: /previous configuration page/i })
          .isDisabled(),
        true,
      );
      await shot(p, `oganesson-${viewport.width}x${viewport.height}`);
    }
    record();

    current = "Stationary/offscreen cache and bounded repeated element changes";
    await p.setViewportSize({ width: 1440, height: 1000 });
    const resources = [];
    for (let i = 0; i < stressSwitches; i++) {
      const [slug, name] = [
        ["hydrogen", "Hydrogen"],
        ["carbon", "Carbon"],
        ["oganesson", "Oganesson"],
      ][i % 3];
      await open(p, slug, name);
      resources.push(await orbitals(p));
    }
    await p.waitForTimeout(700);
    const still = await state(p);
    await p.waitForTimeout(600);
    assert.equal((await state(p)).renders, still.renders);
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await p.waitForTimeout(300);
    const offscreen = await state(p);
    await p.waitForTimeout(500);
    assert.equal((await state(p)).renders, offscreen.renders);
    report.measurements.resources = resources;
    assert.ok(Math.max(...resources.map((r) => r.textures)) < 35);
    record({ switches: stressSwitches });

    current =
      "Designs/Timeline panels, refresh, local UI history and camera isolation";
    for (const route of [
      "?element=carbon",
      "?design=racetrack&element=oganesson",
      "?design=giguere&element=hydrogen",
      "timeline/?design=racetrack&element=carbon",
    ]) {
      await p.goto(url(route), { waitUntil: "domcontentloaded" });
      await card(p).waitFor();
      await orbitals(p);
      const beforeURL = p.url(),
        beforeCamera = await p.evaluate(() => window.__periodicScene?.camera);
      await p
        .getByRole("button", { name: "Rotate orbital left", exact: true })
        .click();
      await ready(p);
      assert.equal(p.url(), beforeURL);
      const afterCamera = await p.evaluate(
        () => window.__periodicScene?.camera,
      );
      if (beforeCamera && afterCamera)
        assert.ok(
          Math.hypot(...beforeCamera.map((v, i) => v - afterCamera[i])) < 0.01,
        );
      await p.reload({ waitUntil: "domcontentloaded" });
      await card(p).waitFor();
      assert.equal(
        await tab(p, "Shell model").getAttribute("aria-selected"),
        "true",
      );
    }
    record();

    current =
      "Touch previews, scroll escape, reduced motion and universal availability";
    const phone = await makePage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    await open(phone, "carbon", "Carbon");
    const touchFour = card(phone).locator('[data-group-id][data-count="4"]');
    await touchFour.tap();
    await phone.waitForFunction(
      () =>
        document.querySelector('[data-testid="bohr-viewport"]')?.dataset
          .highlightedShells === "1",
    );
    assert.notEqual(await highlight(phone), "");
    await touchFour.tap();
    await phone.waitForFunction(
      () =>
        document.querySelector('[data-testid="bohr-viewport"]')?.dataset
          .highlightedShells === "",
    );
    assert.equal(await highlight(phone), "");
    assert.equal(
      await card(phone)
        .getByRole("button", { name: /reduced motion/i })
        .isDisabled(),
      true,
    );
    await orbitals(phone);
    assert.equal(
      await phone.locator(S).evaluate((e) => getComputedStyle(e).touchAction),
      "pan-y",
    );
    await phone
      .getByRole("button", { name: "Interact with orbital", exact: true })
      .tap();
    await phone.waitForFunction(
      (S) => document.querySelector(S)?.dataset.touchActive === "true",
      S,
    );
    assert.equal(
      await phone.locator(S).getAttribute("data-touch-active"),
      "true",
    );
    await phone
      .getByRole("button", { name: "Done interacting", exact: true })
      .tap();
    await phone.waitForFunction(
      (S) => document.querySelector(S)?.dataset.touchActive === "false",
      S,
    );
    assert.equal(
      await phone.locator(S).getAttribute("data-touch-active"),
      "false",
    );
    for (const [slug, name] of [
      ["gold", "Gold"],
      ["iron", "Iron"],
      ["uranium", "Uranium"],
      ["neon", "Neon"],
    ]) {
      await open(phone, slug, name);
      assert.equal(
        await tab(phone, "Orbitals").count(),
        1,
        `${name} must expose the Orbitals tab`,
      );
      assert.equal(
        await tab(phone, "Shell model").getAttribute("aria-selected"),
        "true",
      );
      assert.ok(
        (await counts(phone)).reduce((sum, value) => sum + value, 0) > 0,
        `${name} must show electrons-by-shell counts`,
      );
      await orbitals(phone);
      assert.ok((await state(phone)).visibleSubshells.length > 0);
    }
    record();

    current = "WebGL failure leaves element content and configuration usable";
    const fallback = await makePage({}, true);
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        return /webgl/.test(kind) ? null : original.call(this, kind, ...args);
      };
    });
    await open(fallback, "oganesson", "Oganesson");
    await tab(fallback, "Orbitals").click();
    await card(fallback)
      .getByText(/unavailable|could not|cannot/i)
      .first()
      .waitFor();
    assert.deepEqual(await counts(fallback), [86, 14, 10, 8]);
    await core(fallback).click();
    assert.equal(
      await card(fallback).locator("[data-subshell-id]").count(),
      19,
    );
    record();
    current = "No unexpected browser errors";
    assert.deepEqual(
      report.diagnostics.filter((d) => !d.expected),
      [],
    );
    record();
  } catch (error) {
    report.checks.push({
      name: current,
      status: "failed",
      error: error.stack || error.message,
    });
    await activePage
      ?.screenshot({
        path: `artifacts/verification/structure-${tag}-failure.png`,
      })
      .catch(() => {});
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
    report.finishedAt = new Date().toISOString();
    report.reportPath = `artifacts/verification/structure-${tag}-browser.json`;
    await writeFile(report.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}
