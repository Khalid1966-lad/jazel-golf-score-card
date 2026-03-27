import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-c699d31c-d12e-4ad0-898e-8dcce29d6a93.space.z.ai',
    '.space.z.ai',
  ],
};

export default nextConfig;
