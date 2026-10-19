import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // invitation photos live in Supabase Storage; let Vercel resize them
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  experimental: {
    // Media goes straight to Supabase Storage; this only needs to fit a large bulk guest import.
    // (Vercel caps request bodies at 4.5 MB regardless.)
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
