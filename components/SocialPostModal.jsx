"use client";

import { useEffect, useState } from "react";
import { buildSingleProductCaption, buildCouponLine, applyCouponLine } from "@/lib/socialCaption";

const PLATFORM_BUTTONS = [
  { key: "all", label: "Post to All", platforms: null },
  { key: "facebook", label: "Facebook Only", platforms: ["facebook"] },
  { key: "instagram", label: "Instagram Only", platforms: ["instagram"] },
  { key: "whatsapp", label: "WhatsApp Only", platforms: ["whatsapp"] },
];

export default function SocialPostModal({ product, onClose }) {
  const [caption, setCaption] = useState(() => buildSingleProductCaption(product, false));
  const [postingKey, setPostingKey] = useState(null);
  const [result, setResult] = useState(null);

  // Coupon codes you can add to the post text.
  const productCode = product.coupon_code?.trim() || "";
  const [siteCodes, setSiteCodes] = useState([]); // from Admin -> Coupon Popup
  const [customCodes, setCustomCodes] = useState([]); // typed in here
  const [selected, setSelected] = useState([]); // codes added to the caption
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    fetch("/api/popup-coupons")
      .then((res) => res.json())
      .then((json) => setSiteCodes(json.codes || []))
      .catch(() => setSiteCodes([]));
  }, []);

  // Every code you can pick, without repeats.
  const options = [];
  const seen = new Set();
  function addOption(code, label) {
    if (!code || seen.has(code)) return;
    seen.add(code);
    options.push({ code, label });
  }
  addOption(productCode, "This product");
  siteCodes.forEach((c) => addOption(c.code, c.label));
  customCodes.forEach((c) => addOption(c, "Your code"));

  function updateSelected(next) {
    setSelected(next);
    setCaption((current) => applyCouponLine(current, buildCouponLine(next)));
  }

  function toggleCode(code) {
    updateSelected(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  }

  function addCustomCode() {
    const code = customInput.trim();
    if (!code) return;
    setCustomInput("");
    if (!customCodes.includes(code) && !options.some((o) => o.code === code)) {
      setCustomCodes((prev) => [...prev, code]);
    }
    if (!selected.includes(code)) updateSelected([...selected, code]);
  }

  function removeCustomCode(code) {
    setCustomCodes((prev) => prev.filter((c) => c !== code));
    if (selected.includes(code)) updateSelected(selected.filter((c) => c !== code));
  }

  async function handlePost(button) {
    setPostingKey(button.key);
    setResult(null);
    try {
      const res = await fetch("/api/social/quick-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          caption,
          platforms: button.platforms,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const posted = [];
      const failed = [];
      for (const [platform, r] of Object.entries(json.results || {})) {
        if (r.skipped) continue;
        if (r.ok) posted.push(platform);
        else failed.push(`${platform} (${r.error || "unknown error"})`);
      }

      if (posted.length === 0 && failed.length === 0) {
        setResult({ ok: false, text: "Nothing posted — check platform setup in admin." });
      } else if (failed.length === 0) {
        setResult({ ok: true, text: `Posted to ${posted.join(", ")} ✅` });
      } else {
        setResult({ ok: posted.length > 0, text: `${posted.length > 0 ? `Posted to ${posted.join(", ")}. ` : ""}Failed: ${failed.join("; ")}` });
      }
    } catch (err) {
      setResult({ ok: false, text: err.message });
    } finally {
      setPostingKey(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card-surface rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-gold">Post to Social Media</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-cream/50 hover:text-cream text-xl leading-none px-1"
          >
            ×
          </button>
        </div>

        <p className="text-xs text-cream/50 mb-3 line-clamp-1">{product.title}</p>

        <div className="rounded-md border border-gold/25 bg-gold/5 p-3 mb-3">
          <p className="text-xs font-semibold text-gold mb-0.5">🎟️ Add a coupon code to this post?</p>
          <p className="text-[11px] text-cream/50 mb-2">
            Tap the codes to include. Tap again to remove. Leave all unselected to post without a code.
          </p>

          {options.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {options.map((o) => {
                const on = selected.includes(o.code);
                const isCustom = customCodes.includes(o.code);
                return (
                  <span
                    key={o.code}
                    className={`inline-flex items-center rounded-full border text-xs transition-colors ${
                      on ? "bg-gold text-ink border-gold" : "border-gold/40 text-cream/85"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCode(o.code)}
                      className="px-3 py-1.5 text-left"
                      aria-pressed={on}
                    >
                      <span className="font-mono font-bold tracking-wider">{on ? "✓ " : ""}{o.code}</span>
                      {o.label && (
                        <span className={`ml-1.5 text-[10px] ${on ? "text-ink/70" : "text-cream/45"}`}>
                          {o.label}
                        </span>
                      )}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => removeCustomCode(o.code)}
                        aria-label={`Remove ${o.code}`}
                        className="pr-2.5 pl-0.5 text-base leading-none opacity-70 hover:opacity-100"
                      >
                        ×
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomCode();
                }
              }}
              placeholder="Or type your own code"
              className="flex-1 min-w-0 rounded-md bg-ink border border-gold/30 px-3 py-1.5 text-xs text-cream font-mono tracking-wider focus:outline-none focus:border-gold/60"
            />
            <button
              type="button"
              onClick={addCustomCode}
              disabled={!customInput.trim()}
              className="shrink-0 rounded-md border border-gold/40 text-gold hover:bg-gold/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={10}
          className="w-full rounded-md bg-ink border border-gold/30 text-cream text-sm p-3 font-mono leading-relaxed focus:outline-none focus:border-gold/60"
        />

        <div className="grid grid-cols-2 gap-2 mt-4">
          {PLATFORM_BUTTONS.map((button) => (
            <button
              key={button.key}
              onClick={() => handlePost(button)}
              disabled={postingKey !== null}
              className={`rounded-md border text-xs font-semibold py-2 transition-colors disabled:opacity-50 ${
                button.key === "all"
                  ? "col-span-2 bg-gold hover:bg-gold-bright text-ink border-gold"
                  : "border-gold/40 text-gold hover:bg-gold/10"
              }`}
            >
              {postingKey === button.key ? "Posting..." : button.label}
            </button>
          ))}
        </div>

        {result && (
          <p className={`text-xs text-center font-medium mt-3 ${result.ok ? "text-deal-green" : "text-red-400"}`}>
            {result.text}
          </p>
        )}
      </div>
    </div>
  );
}
