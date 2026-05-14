import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// unsafe-eval is only needed in Next.js dev mode (hot reload), not production.
const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "'self' 'unsafe-inline' https://js.stripe.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com";

const securityHeaders = [
  // Prevent the page from being loaded in an iframe (clickjacking protection).
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing responses away from the declared content-type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send origin on same-origin requests; send only the origin on cross-origin requests.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS for 2 years once deployed behind TLS (Vercel sets this automatically,
  // but belt-and-suspenders never hurts).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable access to sensitive browser APIs that this app does not use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",         // Tailwind inlines styles
      "img-src 'self' data: blob: https:",         // allow remote OG images
      "font-src 'self' data:",                     // Geist is self-hosted via next/font
      [
        "connect-src 'self'",
        "https://*.supabase.co",                   // Supabase REST + Auth
        "wss://*.supabase.co",                     // Supabase Realtime
        "https://api.stripe.com",                  // Stripe.js confirmations
        "https://*.sentry.io",                     // Sentry error reporting
        "https://*.ingest.sentry.io",              // Sentry DSN ingestion endpoint
      ].join(" "),
      // Stripe Checkout opens in a top-level redirect, not an iframe, but allow their
      // script frame for Stripe.js payment elements if added in future.
      "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
      "frame-ancestors 'none'",                    // redundant with X-Frame-Options but belt-and-suspenders
      "base-uri 'self'",                           // prevent base-tag injection attacks
      "form-action 'self'",                        // forms must post to same origin
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Emit source maps in production so Sentry can show real TypeScript line numbers.
  // They are uploaded to Sentry and hidden from public browsers by the Sentry plugin.
  productionBrowserSourceMaps: true,

  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry build output unless CI is set (keeps local builds quiet).
  silent: !process.env.CI,

  // Upload source maps only when SENTRY_AUTH_TOKEN is present (set in Vercel env vars).
  // Without it, sourcemap upload is silently skipped — local dev is unaffected.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Webpack-specific Sentry options.
  webpack: {
    // Auto-wrap App Router route handlers and server components with error monitoring.
    autoInstrumentServerFunctions: true,
    autoInstrumentAppDirectory: true,

    // Remove Sentry's own debug logging from the production bundle.
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
