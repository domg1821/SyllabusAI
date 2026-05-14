import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of page loads for performance; all errors are always sent.
  tracesSampleRate: 0.1,

  debug: false,
});
