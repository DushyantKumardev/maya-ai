import type { NextConfig } from "next";
import os from "os";

// Dynamically detect local IP for allowedDevOrigins
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};

const localIP = getLocalIP();

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  transpilePackages: ["zod"],
  experimental: {
    serverActions: {
      allowedOrigins: [localIP, "localhost", "*.localhost", "127.0.0.1"],
    },
  },
};

export default nextConfig;
