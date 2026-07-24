// Save as: components/CouponBanner.jsx

"use client";

import { useState } from "react";
import Link from "next/link";

export default function CouponBanner({ config = {}, priority = false }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const useImageStyle = config.image && config.style !== "gradient";

  const codes = (config.couponCode || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  function copyCode(code) {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 2000);
  }

  if (useImageStyle) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-4">
        <Link href={config.link || "/deals/latest"} className="block rounded-xl overflow-hidden border border-gold/20">
          <img
            src={config.image}
            alt={config.heading || "Coupon"}
            className="w-full h-auto"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 md:p-8 text-white flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h3 className="font-display text-2xl md:text-3xl mb-2">{config.heading || "Extra Savings Unlocked"}</h3>
          <p className="text-teal-50 text-sm mb-4 max-w-md">
            {config.subheading || "Use this code at checkout on Amazon.ae"}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {codes.map((code) => (
              <button
                key={code}
                onClick={() => copyCode(code)}
                className="bg-white/15 border-2 border-dashed border-white/60 rounded-md px-4 py-2 font-mono font-bold tracking-widest text-lg hover:bg-white/25 transition-colors"
              >
                {copiedCode === code ? "Copied!" : code}
              </button>
            ))}
            <Link
              href={config.link || "/deals/latest"}
              className="inline-flex items-center gap-2 bg-white text-teal-700 font-semibold text-sm px-4 py-2 rounded-md hover:bg-teal-50 transition-colors"
            >
              {config.buttonText || "Shop Now"} →
            </Link>
          </div>
        </div>
        <span className="hidden md:block text-6xl opacity-90 shrink-0">🎟️</span>
      </div>
    </section>
  );
}