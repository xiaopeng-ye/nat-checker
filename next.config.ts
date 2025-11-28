import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Disable image optimization for static export (requires custom loader)
  images: {
    unoptimized: true,
  },
  // Note: output: "standalone" cannot be used with custom server
  // Using custom server to integrate STUN UDP servers
};

export default withNextIntl(nextConfig);
