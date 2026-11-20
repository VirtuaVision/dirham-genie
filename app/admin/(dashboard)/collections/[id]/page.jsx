"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
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

function Thumb({ src }) {
  return (
    <div className="w-12 h-12 shrink-0 rounded bg-white/5 overflow-hidden">
      {src && (
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

export default function EditCollectionPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [items, setItems] = useState([]); // products on this page, in order
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [asinText, setAsinText] = useState("");
  const [asinMessage, setAsinMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/collections/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        const c = json.collection;
        setForm({
          title: c.title,
          slug: c.slug,
          description: c.description || "",
          is_active: c.is_active,
          show_in_menu: c.show_in_menu,
        });
        setItems(json.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
    setMessage(null);
  }

  const inList = (productId) => items.some((p) => String(p.id) === String(productId));

  function addProduct(p) {
    if (inList(p.id)) return;
    setItems((prev) => [...prev, p]);
    setDirty(true);
    setMessage(null);
  }

  function removeProduct(productId) {
    setItems((prev) => prev.filter((p) => String(p.id) !== String(productId)));
    setDirty(true);
    setMessage(null);
  }

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
    setMessage(null);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/admin/collections/search?q=${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResults(json.products || []);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddAsins() {
    if (!asinText.trim()) return;
    setAsinMessage(null);
    try {
      const res = await fetch(`/api/admin/collections/search?asins=${encodeURIComponent(asinText)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const fresh = (json.products || []).filter((p) => !inList(p.id));
      if (fresh.length) {
        setItems((prev) => [...prev, ...fresh]);
        setDirty(true);
        setMessage(null);
      }
      const missing = json.notFound || [];
      setAsinMessage(
        `Added ${fresh.length}.` +
          (missing.length ? ` Not on your site yet: ${missing.join(", ")}.` : "") +
          (json.products.length - fresh.length > 0
            ? ` ${json.products.length - fresh.length} already on this page.`
            : "")
      );
      setAsinText("");
    } catch (err) {
      setAsinMessage(err.message);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, product_ids: items.map((p) => String(p.id)) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setForm((f) => ({ ...f, slug: json.collection.slug }));
      setDirty(false);
      setMessage("Saved ✓");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    const link = `${window.location.origin}/collection/${form.slug}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
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

  if (loading) return <p className="text-cream/50 text-sm">Loading…</p>;
  if (!form) {
    return (
      <div>
        <p className="text-red-400 text-sm mb-3">{error || "Page not found."}</p>
        <Link href="/admin/collections" className="text-gold text-sm underline">
          ← Back to Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-24">
      <Link href="/admin/collections" className="text-xs text-cream/50 hover:text-gold">
        ← All collections
      </Link>
      <h1 className="font-display text-2xl text-gold mt-1 mb-4">Edit page</h1>

      <div className="card-surface rounded-lg p-4 mb-5 space-y-3">
        <div>
          <label className="block text-xs text-cream/60 mb-1">Page title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cream/60 mb-1">Web address</label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-cream/45 shrink-0">/collection/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className="flex-1 min-w-0 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-cream/60 mb-1">Short intro (optional)</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="A sentence or two shown at the top of the page"
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-cream/80">Visible on the site</span>
          <Switch
            checked={form.is_active}
            onChange={() => update("is_active", !form.is_active)}
            label="Visible on the site"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-cream/80">Show as a pill in the menu under the header</span>
          <Switch
            checked={form.show_in_menu}
            onChange={() => update("show_in_menu", !form.show_in_menu)}
            label="Show in menu"
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={`/collection/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold underline"
          >
            View page ↗
          </a>
          <button type="button" onClick={copyLink} className="text-xs text-gold underline">
            {copied ? "Link copied ✓" : "Copy page link"}
          </button>
        </div>
      </div>

      <div className="card-surface rounded-lg p-4 mb-5">
        <h2 className="font-display text-lg text-gold mb-3">
          Products on this page ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-cream/50">Nothing yet — add products below.</p>
        ) : (
          <div className="space-y-2">
            {items.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-gold/15 bg-ink-lighter px-2 py-2"
              >
                <Thumb src={p.image_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-cream/90 line-clamp-2">{p.title}</p>
                  <p className="text-[11px] text-cream/45">
                    {p.price ? `AED ${p.price}` : "No price"}
                    {p.is_active === false && <span className="text-red-400/80"> · hidden product</span>}
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="px-2 py-1 text-cream/60 hover:text-gold disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                    className="px-2 py-1 text-cream/60 hover:text-gold disabled:opacity-25"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeProduct(p.id)}
                    aria-label="Remove"
                    className="px-2 py-1 text-red-400/80 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-surface rounded-lg p-4 mb-5">
        <h2 className="font-display text-lg text-gold mb-3">Add products</h2>

        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your products by name"
            className="flex-1 min-w-0 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="shrink-0 rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-4 py-2 text-sm disabled:opacity-60"
          >
            {searching ? "…" : "Search"}
          </button>
        </form>

        {searched && results.length === 0 && (
          <p className="text-sm text-cream/50 mb-3">No products found for that search.</p>
        )}
        {results.length > 0 && (
          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto pr-1">
            {results.map((p) => {
              const added = inList(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-md border border-gold/15 bg-ink-lighter px-2 py-2"
                >
                  <Thumb src={p.image_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cream/90 line-clamp-2">{p.title}</p>
                    <p className="text-[11px] text-cream/45">{p.price ? `AED ${p.price}` : "No price"}</p>
                  </div>
                  <button
                    onClick={() => addProduct(p)}
                    disabled={added}
                    className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                      added ? "bg-white/10 text-cream/40" : "bg-gold text-ink hover:bg-gold-bright"
                    }`}
                  >
                    {added ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-gold/15 pt-3">
          <label className="block text-xs text-cream/60 mb-1">
            Or add several at once — paste ASINs or Amazon links, one per line
          </label>
          <textarea
            rows={3}
            value={asinText}
            onChange={(e) => setAsinText(e.target.value)}
            placeholder={"B0D1XXXXXX\nB0D2XXXXXX"}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream font-mono focus:border-gold outline-none"
          />
          <button
            type="button"
            onClick={handleAddAsins}
            disabled={!asinText.trim()}
            className="mt-2 rounded-md border border-gold/40 text-gold hover:bg-gold/10 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Add these
          </button>
          {asinMessage && <p className="text-xs text-cream/60 mt-2">{asinMessage}</p>}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-ink/95 backdrop-blur border-t border-gold/20 px-4 py-3">
        <div className="max-w-3xl flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <span className="text-xs text-cream/60">
            {error ? <span className="text-red-400">{error}</span> : message || (dirty ? "You have unsaved changes" : "")}
          </span>
        </div>
      </div>
    </div>
  );
}
