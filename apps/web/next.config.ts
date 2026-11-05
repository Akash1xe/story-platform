import type { NextConfig } from "next";

const apiServerUrl =
  (process.env.API_SERVER_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiServerUrl}/api/auth/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${apiServerUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
