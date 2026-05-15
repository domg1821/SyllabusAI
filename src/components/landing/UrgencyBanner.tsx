"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DISMISS_KEY = "sai_urgency_banner_dismissed";

export default function UrgencyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
    } catch { /* ignore */ }
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  }

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-center text-sm font-medium text-white">
      <span className="mr-2">🎓 Finals season is here —</span>
      <Link href="/dashboard" className="underline underline-offset-2 hover:text-indigo-100 transition-colors">
        get your study plan in 60 seconds
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
