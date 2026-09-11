const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow importing shared validation from the monorepo root.
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@submission-types": path.resolve(
        __dirname,
        "../../data/submission-types.js",
      ),
    };
    return config;
  },
};

module.exports = nextConfig;
