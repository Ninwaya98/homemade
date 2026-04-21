import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

// Only wrap in Sentry config when we actually have a Sentry project
// configured via env vars — otherwise `withSentryConfig` prints noisy
// warnings in local dev about missing orgs / project keys.
const hasSentry = !!process.env.SENTRY_AUTH_TOKEN
  && !!process.env.SENTRY_ORG
  && !!process.env.SENTRY_PROJECT;

export default hasSentry
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      disableLogger: true,
    })
  : nextConfig;
