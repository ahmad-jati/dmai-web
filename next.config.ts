import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zgvybfxgvexsuutrekpq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { hostname: 'img.youtube.com' }
    ],
  },
};

export default nextConfig;
