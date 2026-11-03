import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001"

    return [
      {
        source: "/api/trpc/:path*",
        destination: `${backendUrl}/api/trpc/:path*`,
      },
    ]
  },
  allowedDevOrigins: ['192.168.5.213'],
}

export default nextConfig
