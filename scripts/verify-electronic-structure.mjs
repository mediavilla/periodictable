import { chromium } from "playwright-core";
import { runOrbitalChecks } from "../tests/electronic-structure-browser-checks.mjs";
import { runElectronicStructureStateChecks } from "../tests/electronic-structure-state-browser-checks.mjs";
import { runOrbitalGPUChecks } from "../tests/orbital-gpu-checks.mjs";
import { runOrbitalPerformanceChecks } from "../tests/orbital-performance-checks.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const cdp = option("--cdp", process.env.PERIODIC_TEST_CDP);
const baseURL = option("--base", "http://localhost:3040");
const suite = option("--suite", "all");
const suites = {
  interactions: runOrbitalChecks,
  state: runElectronicStructureStateChecks,
  gpu: runOrbitalGPUChecks,
  performance: runOrbitalPerformanceChecks,
};
if (!cdp || (suite !== "all" && !suites[suite])) {
  console.error(
    "Usage: node scripts/verify-electronic-structure.mjs --cdp <dedicated browser CDP endpoint> --base <site URL> --suite <all|interactions|state|gpu|performance>",
  );
  process.exit(2);
}

// Connect only to an explicitly supplied browser; suites own/close their fresh
// contexts. Disconnecting here leaves the user's other browser tabs intact.
const browser = await chromium.connectOverCDP(cdp);
try {
  for (const [name, run] of Object.entries(suites)) {
    if (suite !== "all" && suite !== name) continue;
    const report = await run(browser, baseURL);
    const failed =
      report.failed ||
      report.checks?.filter((check) => check.status === "failed").length ||
      0;
    console.log(
      JSON.stringify(
        { suite: name, failed, report: report.reportPath },
        null,
        2,
      ),
    );
    if (failed) process.exitCode = 1;
  }
} finally {
  await browser.close();
}
