import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "ik.imagekit.io" }],
  },
  serverExternalPackages: ["playwright", "@sparticuz/chromium"],
};

export default nextConfig;
