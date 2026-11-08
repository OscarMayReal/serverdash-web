import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@workspace/ui", "@workspace/backend", "@wterm/dom", "@wterm/react"],
  serverExternalPackages: ["node-linux-pam"],
  allowedDevOrigins: ['192.168.5.213'],
}

export default nextConfig
