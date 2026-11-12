"use client";

import { useEffect, useState } from "react";

const PLATFORMS = [
  { key: "auto_share_whatsapp", label: "WhatsApp Channel", icon: "💬" },
  { key: "auto_share_facebook", label: "Facebook Page", icon: "📘" },
  { key: "auto_share_instagram", label: "Instagram", icon: "📸" },
];

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-gold" : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-cream transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// On/off switches for each platform that AUTOMATIC posts go to. Saved
// instantly. Only admins can change them (editors see a note instead).
export default function AutoShareSwitches() {
  const [values, setValues] = useState(null); // null = loading
  const [canEdit, setCanEdit] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then(async (res) => {
        if (res.status === 401) {
          setCanEdit(false);
          setValues({});
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        const next = {};
        PLATFORMS.forEach((p) => {
          next[p.key] = String(json.settings?.[p.key]) !== "false"; // on unless switched off
        });
        setValues(next);
      })
      .catch((err) => {
        setError(err.message);
        setValues({});
      });
  }, []);

  async function toggle(key) {
    const next = !(values[key] ?? true);
    setValues((v) => ({ ...v, [key]: next }));
    setError(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: String(next) }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Couldn't save that change.");
      }
    } catch (err) {
      setValues((v) => ({ ...v, [key]: !next }));
      setError(err.message);
    }
  }

  const allOff = values && PLATFORMS.every((p) => (values[p.key] ?? true) === false);

  return (
    <div className="card-surface rounded-lg p-4 mb-6">
      <h2 className="font-display text-lg text-gold mb-1">Auto-sharing to social media</h2>
      <p className="text-xs text-cream/55 mb-3">
        Choose where automatic posts go — new products you tick &ldquo;Also post&rdquo; for, the daily deal,
        category spotlight and coupon posts. The manual &ldquo;Post to Social Media&rdquo; buttons always
        work, whatever is set here.
      </p>

      {values === null ? (
        <p className="text-sm text-cream/50">Loading…</p>
      ) : (
        <div className="space-y-2">
          {PLATFORMS.map((p) => {
            const on = values[p.key] ?? true;
            return (
              <div
                key={p.key}
                className="flex items-center justify-between gap-3 rounded-md border border-gold/20 bg-ink-lighter px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm text-cream/90">{p.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold ${on ? "text-deal-green" : "text-cream/40"}`}>
                    {on ? "On" : "Off"}
                  </span>
                  <Switch
                    checked={on}
                    disabled={!canEdit}
                    onChange={() => toggle(p.key)}
                    label={`Auto-share to ${p.label}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!canEdit && (
        <p className="text-xs text-cream/50 mt-2">Only admins can change these switches.</p>
      )}
      {allOff && <p className="text-xs text-red-400/90 mt-2">All platforms are off — nothing will be posted automatically.</p>}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
