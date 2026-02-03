const withNextIntl = require("next-intl/plugin")("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "echo.basalthq.com",
      },
      {
        protocol: "https",
        hostname: "engram1.blob.core.windows.net",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: require("./package.json").version,
  },
  async redirects() {
    return [
      {
        source: "/voicehub",
        destination: "/echo",
        permanent: true,
      },
    ];
  },
  output: "standalone",
};

module.exports = withNextIntl(nextConfig);
