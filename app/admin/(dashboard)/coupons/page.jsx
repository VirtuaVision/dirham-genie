"use client";

import { useEffect, useState } from "react";

const empty = { title: "", code: "", description: "", affiliate_url: "", expires_at: "" };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/coupons");
    const json = await res.json();
    setCoupons(json.coupons || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(coupon) {
    await fetch(`/api/coupons/${coupon.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !coupon.is_active }),
    });
    load();
  }

  async function remove(coupon) {
    if (!confirm(`Delete coupon "${coupon.title}"?`)) return;
    await fetch(`/api/coupons/${coupon.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Coupons</h1>

      {error && <p className="text-red-300 text-sm mb-4">{error}</p>}

      <form onSubmit={handleAdd} className="card-surface rounded-lg p-4 mb-6 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Coupon title, e.g. 20% off Kitchen items"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
          <input
            placeholder="Coupon code (optional)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>
        <textarea
          placeholder="Description / terms"
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <input
          placeholder="Amazon affiliate link this coupon applies to"
          value={form.affiliate_url}
          onChange={(e) => setForm((f) => ({ ...f, affiliate_url: e.target.value }))}
          className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <div>
          <label className="block text-xs text-cream/60 mb-1">Expires on (optional)</label>
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-4 py-2 text-sm disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add Coupon"}
        </button>
      </form>

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {coupons.length === 0 && <p className="text-cream/50 text-sm">No coupons yet.</p>}
          {coupons.map((c) => (
            <div key={c.id} className="card-surface rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cream/90">{c.title}</p>
                <p className="text-xs text-cream/50">
                  {c.code ? `Code: ${c.code}` : "No code"}
                  {c.expires_at ? ` \u00b7 Expires ${new Date(c.expires_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <button
                onClick={() => toggle(c)}
                className={`text-xs px-2 py-1 rounded ${c.is_active ? "bg-deal-green/20 text-deal-green" : "bg-white/5 text-cream/40"}`}
              >
                {c.is_active ? "Active" : "Hidden"}
              </button>
              <button
                onClick={() => remove(c)}
                className="text-xs px-2 py-1 rounded bg-white/5 text-cream/70 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
