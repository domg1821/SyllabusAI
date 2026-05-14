import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of page loads for performance; all errors are always sent.
  tracesSampleRate: 0.1,

  debug: false,
});

// Required by @sentry/nextjs to instrument App Router client-side navigations.
// Without this export Sentry cannot attach navigation spans to route transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
