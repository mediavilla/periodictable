import assert from "node:assert/strict";

export async function runDetailPreviewChecks(
  browser,
  base = "http://localhost:3018",
  { mobileOnly = false } = {},
) {
  const checks = [];
  const errors = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const ready = async () => {
    await page.waitForFunction(
      () =>
        window.__periodicScene?.count &&
        !window.__periodicScene.cameraMoving &&
        Math.abs(window.__periodicScene.transition) < 0.002,
    );
    await page.waitForTimeout(700);
    await page.waitForFunction(
      () =>
        window.__periodicScene?.count &&
        !window.__periodicScene.cameraMoving &&
        Math.abs(window.__periodicScene.transition) < 0.002,
    );
    return page.evaluate(() => window.__periodicScene);
  };
  const style = (locator) =>
    locator.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        radius: s.borderRadius,
        border: s.borderColor,
        background: s.backgroundColor,
        color: s.color,
        shadow: s.boxShadow,
        transform: s.transform,
      };
    });
  const near = (a, b) =>
    assert.ok(Math.hypot(...a.map((v, i) => v - b[i])) < 0.05, `${a} != ${b}`);
  try {
    if (!mobileOnly) {
      await page.goto(base);
      await ready();
      const about = page.getByRole("button", {
        name: "About this design",
        exact: true,
      });
      assert.equal((await style(about)).radius, "6px");
      assert.notEqual((await style(about)).shadow, "none");
      await about.hover();
      await page.waitForTimeout(200);
      const hover = await style(about);
      assert.equal(hover.border, "rgb(43, 43, 43)");
      assert.equal(hover.background, "rgb(255, 230, 4)");
      assert.equal(hover.shadow, "none");
      await page.mouse.down();
      await page.waitForTimeout(200);
      assert.equal((await style(about)).background, "rgb(43, 43, 43)");
      assert.equal((await style(about)).color, "rgb(255, 255, 255)");
      await page.mouse.move(20, 180);
      await page.mouse.up();
      checks.push("Raised button default, hover and pressed treatments");
      for (const id of ["18", "racetrack"]) {
        await page.goto(`${base}/?design=${id}`);
        await ready();
        await page
          .getByRole("button", { name: "Zoom in", exact: true })
          .click();
        const original = await ready();
        await page
          .getByRole("button", { name: "About this design", exact: true })
          .click();
        await page
          .getByRole("region", { name: "Design history", exact: true })
          .waitFor();
        let scene = await ready();
        assert.equal(await page.locator(".explorerHeading button").count(), 0);
        const panelBox = await page.locator(".explorerPanel").boundingBox();
        const thumbnailBox = await page
          .locator(".explorerTableView")
          .boundingBox();
        assert.ok(
          Math.abs(panelBox.y - thumbnailBox.y) < 1,
          "Content and thumbnail tops must align",
        );
        assert.ok(panelBox.x > thumbnailBox.x + thumbnailBox.width);
        const view = page.locator(".explorerTableView");
        const box = await view.boundingBox();
        const back = page.getByRole("button", {
          name: "Return to table and restore camera",
          exact: true,
        });
        const button = await back.boundingBox();
        assert.ok(button.y >= box.y + box.height);
        assert.equal(await back.locator("svg.lucide-arrow-left").count(), 1);
        const gold = scene.cells.find((c) => c.number === 79 && c.frontFacing);
        await page.mouse.move(gold.x, gold.y);
        await page.waitForFunction(
          (id) => window.__periodicScene.activeSlot === id,
          gold.id,
        );
        await page.mouse.click(gold.x, gold.y);
        await page
          .getByRole("region", { name: "Gold detail", exact: true })
          .waitFor();
        scene = await ready();
        assert.ok(
          (await view.boundingBox()).x < 100,
          "History preview must stay left when opening an element",
        );
        near(scene.camera, (await ready()).camera);
        const beforeGesture = scene.camera;
        const area = await view.boundingBox();
        await page.mouse.move(
          area.x + area.width / 2,
          area.y + area.height / 2,
        );
        await page.mouse.wheel(0, -150);
        await page.mouse.down();
        await page.mouse.move(
          area.x + area.width / 2 + 35,
          area.y + area.height / 2 + 25,
          { steps: 8 },
        );
        await page.mouse.up();
        const afterGesture = await ready();
        assert.ok(
          Math.hypot(
            ...afterGesture.camera.map((v, i) => v - beforeGesture[i]),
          ) > 0.1,
          "Preview camera should respond to wheel and drag",
        );
        await page
          .getByRole("button", { name: "Reset camera", exact: true })
          .click();
        const reset = await ready();
        near(reset.target, [0, 0, 0]);
        await page
          .getByRole("button", { name: "Zoom in", exact: true })
          .click();
        const zoomed = await ready();
        assert.ok(
          Math.hypot(...zoomed.camera.map((v, i) => v - reset.camera[i])) > 0.1,
        );
        await page
          .getByRole("button", { name: "Zoom out", exact: true })
          .click();
        await ready();
        await view.focus();
        await page.keyboard.press("ArrowRight");
        await page
          .getByRole("region", { name: "Mercury detail", exact: true })
          .waitFor();
        assert.equal(
          await view.evaluate((el) => el === document.activeElement),
          true,
        );
        await back.click();
        const restored = await ready();
        near(restored.camera, original.camera);
        near(restored.target, original.target);
        checks.push(
          `${id}: preview hover, click, keyboard, camera gestures and controls, separate return and camera restoration`,
        );
      }
      for (const path of [
        "/?element=carbon",
        "/?panel=history",
        "/timeline/?element=gold",
        "/timeline/?panel=history",
        "/?design=janet&slot=janet-120&panel=entry",
      ]) {
        await page.goto(`${base}${path}`);
        await ready();
        await page.reload();
        await ready();
        const v = await page.locator(".explorerTableView").boundingBox();
        const p = await page.locator(".explorerPanel").boundingBox();
        assert.ok(v.x < p.x && Math.abs(v.y - p.y) < 1, path);
      }
      await page.goto(base);
      await ready();
      await page
        .getByRole("button", { name: "Explore element", exact: true })
        .click();
      await ready();
      assert.ok(
        (await page.locator(".explorerTableView").boundingBox()).x < 100,
      );
      await page.locator(".explorerReturn").click();
      let full = await ready();
      const carbon = full.cells.find((c) => c.number === 6);
      await page.mouse.click(carbon.x, carbon.y);
      await page
        .getByRole("region", { name: "Carbon detail", exact: true })
        .waitFor();
      await ready();
      assert.ok(
        (await page.locator(".explorerTableView").boundingBox()).x < 100,
      );
      checks.push(
        "History, element click, Explore element, historical entry, Timeline and direct-link refresh all use the left preview",
      );
      await page.goto(`${base}/?design=giguere&panel=history`);
      let orbitStart = await ready();
      const orbitBox = await page.locator(".explorerTableView").boundingBox();
      await page.mouse.move(
        orbitBox.x + orbitBox.width / 2,
        orbitBox.y + orbitBox.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        orbitBox.x + orbitBox.width / 2 + 90,
        orbitBox.y + orbitBox.height / 2 + 25,
        { steps: 12 },
      );
      await page.mouse.up();
      const orbited = await ready();
      assert.ok(
        Math.abs(orbited.camera[0] - orbitStart.camera[0]) > 0.1,
        "Giguère preview should orbit",
      );
      assert.equal(orbited.panel, "history", "Dragging must not select a cell");
      await page.mouse.down({ button: "right" });
      await page.mouse.move(
        orbitBox.x + orbitBox.width / 2 + 50,
        orbitBox.y + orbitBox.height / 2 + 45,
        { steps: 8 },
      );
      await page.mouse.up({ button: "right" });
      const panned = await ready();
      assert.ok(
        Math.hypot(...panned.target.map((v, i) => v - orbited.target[i])) > 0.1,
        "Giguère preview should pan",
      );
      checks.push(
        "3D preview supports orbit and pan without accidental element selection",
      );
      await page.goto(`${base}/?design=racetrack&panel=history`);
      let scene = await ready();
      const gold = scene.cells.find((c) => c.number === 79);
      await page.mouse.click(gold.x, gold.y);
      await page
        .getByRole("region", { name: "Gold detail", exact: true })
        .waitFor();
      await page.goBack();
      await page
        .getByRole("region", { name: "Design history", exact: true })
        .waitFor();
      checks.push(
        "Browser Back restores design history after preview selection",
      );
      await page.screenshot({
        path: "artifacts/verification/detail-preview-desktop.png",
      });
    }
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const p = await mobile.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(`${base}/?panel=history`);
      await p.waitForFunction(
        () =>
          window.__periodicScene?.count === 118 &&
          !window.__periodicScene.cameraMoving,
      );
      await p.waitForTimeout(900);
      const state = await p.evaluate(() => window.__periodicScene);
      const gold = state.cells.find((c) => c.number === 79);
      await p.touchscreen.tap(gold.x, gold.y);
      await p
        .getByRole("region", { name: "Gold detail", exact: true })
        .waitFor();
      assert.ok(
        await p.evaluate(() => document.documentElement.scrollWidth <= 390),
      );
      const b = await p.locator(".explorerReturn").boundingBox(),
        v = await p.locator(".explorerTableView").boundingBox();
      assert.ok(b.y >= v.y + v.height);
      await p.screenshot({
        path: "artifacts/verification/detail-preview-mobile.png",
      });
      const beforeZoom = await p.evaluate(() => window.__periodicScene.camera);
      await p.getByRole("button", { name: "Zoom in", exact: true }).tap();
      await p.waitForTimeout(700);
      const afterZoom = await p.evaluate(() => window.__periodicScene.camera);
      assert.ok(
        Math.hypot(...afterZoom.map((v, i) => v - beforeZoom[i])) > 0.1,
      );
      const touch = await mobile.newCDPSession(p);
      const rect = await p.locator(".explorerTableView").boundingBox();
      const x = rect.x + rect.width / 2,
        y = rect.y + rect.height / 2;
      const startPan = await p.evaluate(() => window.__periodicScene.target);
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y, id: 1 }],
      });
      for (let i = 1; i <= 8; i++)
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x + i * 4, y: y + i * 2, id: 1 }],
        });
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await p.waitForTimeout(700);
      const endPan = await p.evaluate(() => window.__periodicScene.target);
      assert.ok(
        Math.hypot(...endPan.map((v, i) => v - startPan[i])) > 0.1,
        "Touch drag pans the preview",
      );
      const distance = () =>
        p.evaluate(() =>
          Math.hypot(
            ...window.__periodicScene.camera.map(
              (v, i) => v - window.__periodicScene.target[i],
            ),
          ),
        );
      const beforePinch = await distance();
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          { x: x - 25, y, id: 1 },
          { x: x + 25, y, id: 2 },
        ],
      });
      for (let i = 1; i <= 6; i++)
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            { x: x - 25 - i * 3, y, id: 1 },
            { x: x + 25 + i * 3, y, id: 2 },
          ],
        });
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await p.waitForTimeout(700);
      assert.ok(
        (await distance()) < beforePinch - 0.1,
        "Pinch zooms the preview",
      );
      await touch.detach();
      await p.locator(".explorerReturn").tap();
      await p
        .getByRole("button", { name: "About this design", exact: true })
        .waitFor();
      checks.push(
        "Mobile preview tap, pan, pinch, zoom buttons and separate return work",
      );
    } finally {
      await mobile.close();
    }
    assert.deepEqual(errors, []);
    return { passed: checks.length, checks, errors };
  } finally {
    await context.close();
  }
}
