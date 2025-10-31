import type { NextConfig } from "next";

/**
 * Next.js configuration
 *
 * Remote image patterns allow <Image /> to optimize external assets used
 * for seeded drink images. Add more host entries here as needed.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i5.walmartimages.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "camperdowncellars.com.au",
        pathname: "/**",
      },
      { protocol: "https", hostname: "magicdrinks.de", pathname: "/**" },
      { protocol: "https", hostname: "www.worldofsweets.de", pathname: "/**" },
      {
        protocol: "https",
        hostname: "www.getraenke-lewandowsky.de",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dosenmatrosen.imgbolt.de",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "getraenkeservice-muenchen.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
