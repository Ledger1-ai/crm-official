const withNextIntl = require("next-intl/plugin")("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // turbopack: {
  //   root: __dirname,
  // },
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
    NEXT_PUBLIC_APP_VERSION: (() => {
      try {
        const { execSync } = require("child_process");
        // Get latest commit message and extract version (e.g., "v1.0.9 - chore:" or "1.0.9 - feat:")
        const commitMsg = execSync("git log -1 --format=%s", { encoding: "utf-8" }).trim();
        const versionMatch = commitMsg.match(/^v?(\d+\.\d+\.\d+[a-zA-Z0-9-]*)/);
        if (versionMatch) {
          return versionMatch[1];
        }
        // Fallback to package.json version
        return require("./package.json").version;
      } catch {
        return require("./package.json").version;
      }
    })(),
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
