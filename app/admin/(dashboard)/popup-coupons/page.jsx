"use client";

import { useEffect, useState } from "react";

const empty = { code: "", label: "" };

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-gold" : "bg-white/15"
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

export default function PopupCouponsPage() {
  const [codes, setCodes] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/popup-coupons");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCodes(json.codes || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        editingId ? `/api/admin/popup-coupons/${editingId}` : "/api/admin/popup-coupons",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: form.code, label: form.label }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({ code: c.code, label: c.label || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
    setError(null);
  }

  async function toggleActive(c) {
    setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)));
    await fetch(`/api/admin/popup-coupons/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
  }

  async function handleDelete(c) {
    if (!confirm(`Delete the code "${c.code}"? It will disappear from every product popup.`)) return;
    await fetch(`/api/admin/popup-coupons/${c.id}`, { method: "DELETE" });
    if (editingId === c.id) cancelEdit();
    load();
  }

  const activeCount = codes.filter((c) => c.is_active).length;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-gold mb-1">Coupon Popup</h1>
      <p className="text-cream/50 text-sm mb-6">
        These codes show up in the popup that opens when someone taps the lamp on <strong>any</strong>{" "}
        product. Add as many as you like, switch one off to hide it, or edit a code any time — changes
        appear on the site within about a minute.
      </p>

      <form onSubmit={handleSubmit} className="card-surface rounded-lg p-4 mb-6 space-y-3">
        {editingId && (
          <p className="text-xs font-semibold text-gold">Editing code — make your changes and tap Update, or Cancel to stop.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-cream/60 mb-1">Coupon code *</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. SAVE20"
              required
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream font-mono tracking-wider focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/60 mb-1">Short note (optional)</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. 10% off electronics"
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !form.code.trim()}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2 text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update Code" : "Add Code"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-gold/30 text-cream/70 px-4 py-2 text-sm hover:bg-white/5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <p className="text-xs text-cream/40 mb-2">
        {codes.length} code{codes.length === 1 ? "" : "s"} · {activeCount} showing on the site
      </p>

      {loading ? (
        <p className="text-cream/50 text-sm">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-cream/50 text-sm">No codes yet — add your first one above.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div key={c.id} className="card-surface rounded-lg p-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                <p className="font-mono font-bold tracking-widest text-gold break-all">{c.code}</p>
                {c.label && <p className="text-xs text-cream/50 mt-0.5">{c.label}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-cream/40">{c.is_active ? "Showing" : "Hidden"}</span>
                <ToggleSwitch
                  checked={c.is_active}
                  onChange={() => toggleActive(c)}
                  label="Show this code in the popup"
                />
              </div>
              <button
                onClick={() => startEdit(c)}
                className="text-xs text-cream/70 hover:text-gold px-2 py-1"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(c)}
                className="text-xs text-red-400/80 hover:text-red-400 px-2 py-1"
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
