const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
module.exports = (phase) => ({
  output: "export",
  // Vercel expects the standard production directory; isolate only dev builds.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-development" : ".next",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? "/periodictable" : "",
  assetPrefix: isProd ? "/periodictable/" : "",
});
