import assert from "node:assert/strict";
export async function runInterfaceFeedbackChecks(
  browser,
  baseURL = "http://localhost:3018",
) {
  const c = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const wait = async (id = "18") => {
    await p.waitForFunction(
      (id) =>
        window.__periodicScene?.design === id &&
        !window.__periodicScene?.cameraMoving &&
        Math.abs(window.__periodicScene?.transition) < 0.001,
      id,
    );
    await p.waitForTimeout(200);
    return p.evaluate(() => window.__periodicScene);
  };
  try {
    await p.goto(baseURL);
    await wait();
    await p.evaluate(() => document.fonts.ready);
    assert.equal(
      await p.evaluate(() => document.fonts.check("500 18px Geist")),
      true,
    );
    assert.equal(
      await p
        .locator(".explorerNav")
        .evaluate((e) => Math.round(e.getBoundingClientRect().width)),
      1440,
    );
    assert.equal(
      await p
        .locator(".explorerDesigns")
        .evaluate((e) => e.scrollWidth > e.clientWidth),
      true,
    );
    assert.equal(
      await p
        .getByRole("button", { name: "18 columns", exact: true })
        .evaluate((e) => getComputedStyle(e).backgroundColor),
      "rgb(41, 41, 43)",
    );
    await p.screenshot({ path: "artifacts/verification/feedback-main.png" });
    for (const [id, name] of [
      ["18", "18 columns"],
      ["racetrack", "Race Track"],
    ]) {
      await p.getByRole("button", { name, exact: true }).click();
      const initial = await wait(id);
      await p.getByRole("button", { name: "Zoom in", exact: true }).click();
      await wait(id);
      const before = await wait(id);
      const box = await p.locator(".explorerTableView").boundingBox();
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await p.mouse.down();
      await p.mouse.move(
        box.x + box.width / 2 + 100,
        box.y + box.height / 2 + 50,
        { steps: 10 },
      );
      await p.mouse.up();
      await p.waitForTimeout(400);
      const after = await wait(id);
      assert.ok(
        Math.abs(after.target[0] - before.target[0]) > 0.1,
        "Drag did not pan",
      );
      assert.ok(
        Math.abs(after.camera[0] - after.target[0]) < 0.001,
        "Flat view tilted",
      );
      for (let i = 0; i < 7; i++) {
        await p.getByRole("button", { name: "Zoom out", exact: true }).click();
        await wait(id);
      }
      const out = await wait(id);
      assert.ok(
        Math.abs(out.camera[2] - initial.camera[2]) < 0.05,
        "Exceeded fit zoom",
      );
    }
    await p
      .getByRole("button", { name: "About this design", exact: true })
      .click();
    await p.getByRole("region", { name: "Design history" }).waitFor();
    await p.waitForTimeout(800);
    const table = await p.locator(".explorerTableView").boundingBox();
    const panel = await p.locator(".explorerPanel").boundingBox();
    assert.ok(table.x + table.width < panel.x);
    assert.equal(
      await p
        .getByRole("button", { name: "About this design", exact: true })
        .count(),
      0,
    );
    await p.screenshot({ path: "artifacts/verification/feedback-history.png" });
    await p
      .getByRole("button", { name: "← Back to table", exact: true })
      .click();
    await wait("racetrack");
    await p
      .getByRole("link", { name: "Elements", exact: true })
      .first()
      .click();
    await p.locator(".explorerElementNav a").first().waitFor();
    assert.equal(await p.locator(".explorerElementNav a").count(), 118);
    assert.equal(await p.locator(".explorerKeyboard").getAttribute("open"), "");
    await p.getByRole("searchbox", { name: "Search all elements" }).fill("79");
    assert.equal(await p.locator(".explorerFinderCell").count(), 1);
    await p.screenshot({
      path: "artifacts/verification/feedback-elements.png",
    });
    await p.locator(".explorerFinderCell").click();
    await p.getByRole("article", { name: "Gold details" }).waitFor();
    assert.match(
      await p
        .locator("dd")
        .first()
        .evaluate((e) => getComputedStyle(e).fontFamily),
      /Geist Mono/,
    );
    await p.setViewportSize({ width: 390, height: 844 });
    await p.goto(`${baseURL}/elements`);
    await p.waitForTimeout(800);
    assert.ok(
      await p.evaluate(() => document.documentElement.scrollWidth <= 390),
    );
    await p.screenshot({ path: "artifacts/verification/feedback-mobile.png" });
    assert.deepEqual(errors, []);
    return { passed: true, errors };
  } finally {
    await c.close();
  }
}
