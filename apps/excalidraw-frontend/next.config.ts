/** @type {import('next').NextConfig} */
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
    reactStrictMode: false, // causes useEffect to run twice if set to true // by default -> true,
};

export default nextConfig;
