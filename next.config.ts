import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  // Allow requests from dev tunnels (cloudflared quick tunnels, ngrok, etc.)
  // so Polar webhooks can reach the route handler during local development.
  // Wildcards keep this working across cloudflared's rotating subdomains.
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.io"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
