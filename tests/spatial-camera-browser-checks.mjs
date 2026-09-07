import assert from "node:assert/strict";

export async function runSpatialCameraChecks(
  browser,
  baseURL = "http://localhost:3018",
) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const results = [];
  const wait = async (id) => {
    await page.waitForFunction(
      (id) =>
        window.__periodicScene?.design === id &&
        window.__periodicScene.count > 0 &&
        !window.__periodicScene.cameraMoving &&
        Math.abs(window.__periodicScene.transition) < 0.002,
      id,
    );
    return page.evaluate(() => window.__periodicScene);
  };
  const command = async (id, name) => {
    const serial = (await wait(id)).commandSerial;
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForFunction(
      (serial) =>
        window.__periodicScene?.commandSerial > serial &&
        !window.__periodicScene.cameraMoving,
      serial,
    );
    return wait(id);
  };
  const zoom = async (id, n) => {
    for (let i = 0; i < n; i++) {
      await command(id, "Zoom in");
    }
  };
  try {
    await page.goto(`${baseURL}/?design=stowe`);
    const original = await wait("stowe");
    await zoom("stowe", 12);
    let scene = await wait("stowe");
    assert.ok(
      Math.hypot(...scene.camera.map((v, i) => v - scene.target[i])) < 2.1,
      `Stowe cannot zoom close enough: ${JSON.stringify({ camera: scene.camera, target: scene.target, limits: scene.limits })}`,
    );
    assert.ok(
      scene.target[1] > 10,
      "Zoom must focus the selected top-layer hydrogen",
    );
    await page.screenshot({ path: "artifacts/verification/stowe-close.png" });
    const savedCamera = scene.camera;
    const h = scene.cells.find((c) => c.number === 1 && c.frontFacing);
    assert.ok(h);
    await page.mouse.click(h.x, h.y);
    await page.locator(".explorerPanel").waitFor();
    await page.waitForFunction(
      () =>
        window.__periodicScene?.panel === "element" &&
        !window.__periodicScene.cameraMoving,
    );
    await page.locator(".explorerReturn").click();
    await page.waitForFunction(
      () =>
        window.__periodicScene?.panel === null &&
        !window.__periodicScene.cameraMoving,
    );
    await wait("stowe");
    scene = await wait("stowe");
    assert.ok(
      Math.hypot(...scene.camera.map((v, i) => v - savedCamera[i])) < 0.001,
    );
    scene = await command("stowe", "Reset camera");
    assert.ok(
      Math.hypot(...scene.camera.map((v, i) => v - original.camera[i])) < 0.05,
    );
    results.push(
      "Stowe close zoom, focused top layer, detail return and reset",
    );
    await page.goto(`${baseURL}/timeline/?design=telluric`);
    await wait("telluric");
    await zoom("telluric", 12);
    const box = await page.locator(".explorerTableView").boundingBox();
    for (const [dx, dy] of [
      [220, 180],
      [-390, -300],
      [200, 300],
    ]) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width / 2 + dx,
        box.y + box.height / 2 + dy,
        { steps: 24 },
      );
      await page.mouse.up();
      await page.waitForTimeout(600);
      scene = await wait("telluric");
      assert.ok(
        Math.hypot(scene.camera[0], scene.camera[2]) >= 5.69 ||
          Math.abs(scene.camera[1]) >= 15.69,
        `Camera entered the cylinder: ${scene.camera}`,
      );
    }
    await page.screenshot({
      path: "artifacts/verification/telluric-close-orbit.png",
    });
    results.push(
      "Telluric remains outside its padded cylinder at steep close-zoom orbits",
    );
    await page.goto(`${baseURL}/?design=benfey`);
    await wait("benfey");
    await zoom("benfey", 15);
    scene = await wait("benfey");
    assert.ok(
      Math.abs(scene.camera[2] - 0.45) < 0.02,
      "Benfey core cannot be magnified",
    );
    await page.screenshot({ path: "artifacts/verification/benfey-core.png" });
    await command("benfey", "Reset camera");
    await page.screenshot({
      path: "artifacts/verification/model-benfey-final.png",
    });
    results.push("Benfey source core close zoom and fitted reset");
    assert.deepEqual(errors, []);
    return { passed: true, results };
  } finally {
    await context.close();
  }
}
