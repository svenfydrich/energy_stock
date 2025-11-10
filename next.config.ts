import type { NextConfig } from "next";

/**
 * Next.js configuration
 *
 * Remote image patterns allow <Image /> to optimize external assets.
 * Using wildcards to allow images from any HTTPS source to support
 * user-generated drink and wishlist images.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow all HTTPS images for user-generated content
      { protocol: "https", hostname: "**" },
      // Allow HTTP images as well (less secure, but more flexible)
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
