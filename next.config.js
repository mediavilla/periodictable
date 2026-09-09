const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const isProd = process.env.NODE_ENV === "production";
// Vercel serves this export at the domain root. Keep the existing subdirectory
// export for other hosts, with an explicit override for custom hosting paths.
const basePath = isProd
  ? (process.env.SITE_BASE_PATH ??
    (process.env.VERCEL === "1" ? "" : "/periodictable"))
  : "";

function developmentDistDir() {
  if (process.env.NEXT_DEV_DIST_DIR) return process.env.NEXT_DEV_DIST_DIR;
  const args = process.argv;
  const portFlag = args.findIndex((flag) => flag === "--port" || flag === "-p");
  const port = process.env.PORT || (portFlag >= 0 ? args[portFlag + 1] : "3000");
  const distDir = `.next-development-${port}-${process.pid}`;
  process.env.NEXT_DEV_DIST_DIR = distDir;
  return distDir;
}

/** @type {import('next').NextConfig} */
module.exports = (phase) => ({
  output: "export",
  // Vercel expects the standard production directory; isolate only dev builds.
  // Give each `next dev` process its own cache so they cannot clobber the
  // compiled `[element]` page.
  distDir:
    phase === PHASE_DEVELOPMENT_SERVER ? developmentDistDir() : ".next",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
});
