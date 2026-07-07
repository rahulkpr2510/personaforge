import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "ik.imagekit.io" }],
  },
  serverExternalPackages: ["playwright", "@sparticuz/chromium"],
  experimental: {
    // Raise the proxy body buffer limit to 50MB.
    // The crawler sends base64-encoded screenshots for up to 20 pages
    // (~500KB each → ~13MB as JSON). The default 10MB causes 400 errors.
    proxyClientMaxBodySize: "50mb",
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
