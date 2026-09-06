import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
export async function runExportBrowserChecks(
  browser,
  base = "http://localhost:3019/periodictable",
) {
  const contexts = [];
  const failures = [];
  const checks = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  contexts.push(context);
  const page = await context.newPage();
  const monitor = (p) => {
    p.on("pageerror", (e) => failures.push(e.message));
    p.on("response", (r) => {
      if (r.url().startsWith(base) && r.status() >= 400)
        failures.push(`${r.status()} ${r.url()}`);
    });
    p.on("console", (m) => {
      if (
        m.type() === "error" &&
        /THREE|WebGL|shader|minified React/i.test(m.text())
      )
        failures.push(m.text());
    });
  };
  monitor(page);
  try {
    await page.goto(`${base}/?design=giguere&element=gold`);
    await page
      .getByRole("region", { name: "Gold detail", exact: true })
      .waitFor();
    assert.equal(await page.locator("canvas").count(), 1);
    await page.waitForTimeout(700);
    await page.screenshot({
      path: "artifacts/verification/static-giguere-gold.png",
    });
    await page
      .getByRole("button", {
        name: "Return to table and restore camera",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Race Track", exact: true }).click();
    await page.waitForTimeout(1000);
    assert.match(
      await page.locator(".explorerHeading h1").innerText(),
      /Racetrack/,
    );
    checks.push("Exported query state and design controls");
    for (const photo of ["hydrogen-sun", "carbon-earth", "gold-webb"]) {
      const response = await page.request.get(
        `${base}/images/stories/${photo}.jpg`,
      );
      assert.equal(response.status(), 200);
      assert.ok((await response.body()).length > 10000);
    }
    checks.push("Three local NASA images served under the production prefix");
    await page.goto(`${base}/carbon/`);
    await page
      .getByRole("article", { name: "Carbon details", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Diamond", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Diamond", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    const carbonImage = page.locator("article img").first();
    await carbonImage.scrollIntoViewIfNeeded();
    await carbonImage.evaluate(
      (img) =>
        new Promise((resolve, reject) => {
          if (img.complete)
            return img.naturalWidth
              ? resolve()
              : reject(new Error("Image failed"));
          img.onload = resolve;
          img.onerror = () => reject(new Error("Image failed"));
        }),
    );
    await page.screenshot({ path: "artifacts/verification/static-carbon.png" });
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => document.querySelector("footer img")?.naturalWidth > 0,
    );
    checks.push(
      "Carbon structure control, story image, and unchanged footer logo",
    );
    await page.goto(`${base}/elements/`);
    await page
      .getByRole("searchbox", { name: "Search all elements" })
      .fill("79");
    assert.equal(await page.locator(".explorerElementLink").count(), 1);
    await page.locator(".explorerElementLink").click();
    await page.reload();
    await page
      .getByRole("article", { name: "Gold details", exact: true })
      .waitFor();
    assert.ok(page.url().endsWith("/gold/"));
    checks.push("Exported discovery search and standalone refresh");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    contexts.push(mobileContext);
    const mobile = await mobileContext.newPage();
    monitor(mobile);
    await mobile.goto(`${base}/`);
    await mobile.locator("canvas").waitFor();
    await mobile.waitForTimeout(700);
    assert.ok(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= 390),
    );
    await mobile.getByRole("button", { name: /Explore element/ }).tap();
    await mobile
      .getByRole("region", { name: "Hydrogen detail", exact: true })
      .waitFor();
    await mobile
      .getByRole("button", {
        name: "Return to table and restore camera",
        exact: true,
      })
      .tap();
    await mobile.waitForTimeout(800);
    await mobile.screenshot({
      path: "artifacts/verification/static-mobile.png",
    });
    assert.ok(
      Math.abs(
        (await mobile.locator(".explorerTableView").boundingBox()).width - 390,
      ) < 1,
    );
    checks.push("Exported mobile panel return and full-width layout");
    await mobile.goto(`${base}/?design=racetrack&element=carbon`);
    await mobile.reload();
    await mobile
      .getByRole("region", { name: "Carbon detail", exact: true })
      .waitFor();
    assert.equal(await mobile.locator("canvas").count(), 1);
    checks.push("Exported mobile direct query survives refresh");
    assert.deepEqual(failures, []);
    checks.push("No production runtime errors or missing local resources");
  } finally {
    for (const c of contexts) await c.close();
  }
  const report = {
    date: new Date().toISOString(),
    base,
    passed: checks.length,
    checks,
    failures,
  };
  await writeFile(
    "artifacts/verification/export-browser-checks.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  return report;
}
