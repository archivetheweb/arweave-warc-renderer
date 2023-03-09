/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  exportPathMap: function () {
    return {
      "/": { page: "/" },
    };
  },
  assetPrefix: ".",
  images: {
    loader: "custom",
  },
};

module.exports = nextConfig;
