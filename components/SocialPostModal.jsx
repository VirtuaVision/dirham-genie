"use client";

import { useState } from "react";
import { buildSingleProductCaption } from "@/lib/socialCaption";

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

        <p className="text-xs text-cream/50 mb-2 line-clamp-1">{product.title}</p>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={9}
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
