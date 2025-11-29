import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* Invalid src prop (https://lh3.googleusercontent.com/a/ACg8ocLDQcYN8WtABLAH51RWR8MFfDTkaKrBd7CA9vLT28-aX4ydf5Mf=s96-c) on `next/image`, hostname "lh3.googleusercontent.com" is not configured under images in your `next.config.js */
  images: { domains: ["lh3.googleusercontent.com"] },
};

export default nextConfig;
