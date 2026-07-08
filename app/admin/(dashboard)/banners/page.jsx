"use client";

import { useEffect, useState } from "react";

const empty = { title: "", subtitle: "", image_url: "", link_url: "", sort_order: 0 };

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/banners");
    const json = await res.json();
    setBanners(json.banners || []);
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
      const res = await fetch("/api/banners", {
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

  async function toggle(banner) {
    await fetch(`/api/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !banner.is_active }),
    });
    load();
  }

  async function remove(banner) {
    if (!confirm(`Delete banner "${banner.title}"?`)) return;
    await fetch(`/api/banners/${banner.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Homepage Banners</h1>

      {error && <p className="text-red-300 text-sm mb-4">{error}</p>}

      <form onSubmit={handleAdd} className="card-surface rounded-lg p-4 mb-6 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
          <input
            placeholder="Subtitle (optional)"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>
        <input
          required
          placeholder="Banner image URL"
          value={form.image_url}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <input
          placeholder="Link URL (where clicking the banner goes, e.g. /category/electronics)"
          value={form.link_url}
          onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
          className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-4 py-2 text-sm disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add Banner"}
        </button>
      </form>

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {banners.length === 0 && <p className="text-cream/50 text-sm">No banners yet.</p>}
          {banners.map((b) => (
            <div key={b.id} className="card-surface rounded-lg p-3 flex items-center gap-3">
              <img src={b.image_url} alt="" className="w-20 h-12 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cream/90 truncate">{b.title}</p>
                <p className="text-xs text-cream/50 truncate">{b.link_url}</p>
              </div>
              <button
                onClick={() => toggle(b)}
                className={`text-xs px-2 py-1 rounded ${b.is_active ? "bg-deal-green/20 text-deal-green" : "bg-white/5 text-cream/40"}`}
              >
                {b.is_active ? "Active" : "Hidden"}
              </button>
              <button
                onClick={() => remove(b)}
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
