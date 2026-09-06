const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
module.exports = {
  output: "export",
  distDir: isProd ? ".next-production" : ".next-development",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? "/periodictable" : "",
  assetPrefix: isProd ? "/periodictable/" : "",
};
