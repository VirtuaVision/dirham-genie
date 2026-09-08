"use client";

import { useState } from "react";

export default function CouponCode({ code, details }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for browsers/contexts where the Clipboard API is blocked.
      const el = document.createElement("textarea");
      el.value = code;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <p className="mt-2 text-sm">
      <button
        type="button"
        onClick={handleCopy}
        className="font-mono bg-gold/15 text-gold px-2 py-1 rounded border border-dashed border-gold/40 hover:bg-gold/25 active:scale-95 transition cursor-pointer"
        title="Tap to copy"
      >
        {copied ? "Copied ✓" : code}
      </button>
      {details && <span className="text-cream/50 text-xs ml-2">{details}</span>}
    </p>
  );
}
