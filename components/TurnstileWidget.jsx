"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export default function TurnstileWidget({ onToken }) {
  const containerRef = useRef(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;

    function render() {
      if (window.turnstile && containerRef.current && !containerRef.current.hasChildNodes()) {
        window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
        });
      }
    }

    if (window.turnstile) render();
    else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          render();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [siteKey, onToken]);

  if (!siteKey) return null; // not configured yet — forms just skip verification

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div ref={containerRef} className="my-2" />
    </>
  );
}
