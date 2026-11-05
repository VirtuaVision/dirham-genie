"use client";

import { useEffect, useState } from "react";

// The site-wide codes are the same for every product, so fetch them once and
// reuse the result across cards instead of hitting the API on every tap.
let cachedCodes = null;
let cachedAt = 0;
const CACHE_MS = 60 * 1000;

async function loadCodes() {
  if (cachedCodes && Date.now() - cachedAt < CACHE_MS) return cachedCodes;
  const res = await fetch("/api/popup-coupons");
  const json = await res.json();
  cachedCodes = json.codes || [];
  cachedAt = Date.now();
  return cachedCodes;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

function CodeRow({ code, label, copied, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/25 bg-gold/5 px-3 py-2.5">
      <div className="min-w-0">
        {label && <p className="text-xs text-cream/60 mb-0.5">{label}</p>}
        <p className="font-mono font-bold tracking-widest text-base text-gold break-all">{code}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(code)}
        className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          copied === code ? "bg-deal-green text-white" : "bg-gold text-ink hover:bg-gold-bright"
        }`}
      >
        {copied === code ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

export default function CouponPopup({ product, onClose, onBuyClick }) {
  const [codes, setCodes] = useState(null); // null = still loading
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    loadCodes()
      .then(setCodes)
      .catch(() => setCodes([]));
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCopy(code) {
    await copyText(code);
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
  }

  // The product's own code (if it has one) goes first, then the site-wide
  // ones — skipping any site-wide code that's identical to it.
  const productCode = product.coupon_code?.trim();
  const siteCodes = (codes || []).filter((c) => c.code !== productCode);
  const nothingToShow = codes !== null && !productCode && siteCodes.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card-surface rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="font-display text-xl text-gold">🪔 Coupon Codes</h3>
            <p className="text-xs text-cream/55 mt-1">
              Copy a code, then apply it at checkout on Amazon.ae.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-cream/50 hover:text-cream text-2xl leading-none px-1"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {codes === null && <p className="text-sm text-cream/50 py-4 text-center">Loading codes…</p>}

          {productCode && <CodeRow code={productCode} label="For this product" copied={copied} onCopy={handleCopy} />}

          {siteCodes.map((c) => (
            <CodeRow key={c.id} code={c.code} label={c.label} copied={copied} onCopy={handleCopy} />
          ))}

          {nothingToShow && (
            <p className="text-sm text-cream/50 py-4 text-center">
              No coupon codes available right now — check back soon!
            </p>
          )}
        </div>

        {product.affiliate_url && (
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={onBuyClick}
            className="mt-5 block w-full text-center rounded-md bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-sm py-2.5 transition-colors"
          >
            Buy on Amazon →
          </a>
        )}
        <p className="mt-3 text-[10px] text-cream/35 text-center">
          Codes may not apply to every item — final eligibility is confirmed by Amazon at checkout.
        </p>
      </div>
    </div>
  );
}
