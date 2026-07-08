"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("dg_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("dg_cookie_consent", "accepted");
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem("dg_cookie_consent", "dismissed");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-ink border-t border-gold/30 px-4 py-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 text-sm">
        <p className="text-cream/70 flex-1">
          We use cookies to keep the site working and, if enabled, to
          understand how it's used. Amazon also sets its own cookies once you
          click through to a deal. See our{" "}
          <Link href="/cookie-policy" className="text-gold underline underline-offset-2">
            Cookie Policy
          </Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={dismiss}
            className="text-cream/50 hover:text-cream/80 text-xs px-3 py-2"
          >
            Dismiss
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold text-xs px-4 py-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
