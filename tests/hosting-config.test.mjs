import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

function config(overrides) {
  const env = { ...process.env, NODE_ENV: "production" };
  delete env.VERCEL;
  delete env.SITE_BASE_PATH;
  return JSON.parse(
    execFileSync(
      process.execPath,
      [
        "-e",
        'console.log(JSON.stringify(require("./next.config.js")("phase-production-build")))',
      ],
      {
        env: { ...env, ...overrides },
        encoding: "utf8",
      },
    ),
  );
}

test("Vercel exports use domain-root URLs and the standard build directory", () => {
  const result = config({ VERCEL: "1" });
  assert.equal(result.basePath, "");
  assert.equal(result.distDir, ".next");
  assert.equal(result.assetPrefix, undefined);
});

test("Subdirectory exports remain available outside Vercel", () => {
  assert.equal(config({}).basePath, "/periodictable");
  assert.equal(config({ SITE_BASE_PATH: "/museum" }).basePath, "/museum");
  assert.equal(config({ SITE_BASE_PATH: "" }).basePath, "");
});
