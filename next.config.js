const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const isProd = process.env.NODE_ENV === "production";
// Vercel serves this export at the domain root. Keep the existing subdirectory
// export for other hosts, with an explicit override for custom hosting paths.
const basePath = isProd
  ? (process.env.SITE_BASE_PATH ??
    (process.env.VERCEL === "1" ? "" : "/periodictable"))
  : "";

/** @type {import('next').NextConfig} */
module.exports = (phase) => ({
  output: "export",
  // Vercel expects the standard production directory; isolate only dev builds.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-development" : ".next",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
});
