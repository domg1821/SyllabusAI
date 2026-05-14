import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture 10% of traces for performance monitoring; 100% of errors are always sent.
  tracesSampleRate: 0.1,

  // Automatically instrument every Anthropic SDK call with spans + error capture.
  integrations: [Sentry.anthropicAIIntegration()],

  // Only log errors to console in development.
  debug: false,
});
