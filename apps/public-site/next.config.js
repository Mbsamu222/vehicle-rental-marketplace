const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vrm/ui", "@vrm/api-client"],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

module.exports = nextConfig;
