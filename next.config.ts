import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  experimental: { agentUpgrade: "security" },
};
export default config;
