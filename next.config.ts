import type { NextConfig } from "next";

const neonStorageUrl = process.env.NEON_OBJECT_STORAGE_PUBLIC_URL;
const neonStoragePattern = neonStorageUrl
  ? (() => {
      const url = new URL(neonStorageUrl);
      return { protocol: url.protocol.replace(":", "") as "https", hostname: url.hostname, pathname: `${url.pathname}/**` };
    })()
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      ...(neonStoragePattern ? [neonStoragePattern] : []),
    ],
  },
};

export default nextConfig;
