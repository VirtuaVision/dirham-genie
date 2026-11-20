"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/collections");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCollections(json.collections || []);
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

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push(`/admin/collections/${json.collection.id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  }

  async function handleDelete(c) {
    if (!confirm(`Delete the page "${c.title}"? The products themselves are not deleted.`)) return;
    await fetch(`/api/admin/collections/${c.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-gold mb-1">Collections</h1>
      <p className="text-cream/50 text-sm mb-6">
        Make your own pages — like &ldquo;Ramadan Deals&rdquo; or &ldquo;Under AED 50&rdquo; — and choose
        exactly which products appear on each one. You can change the products any time.
      </p>

      <form onSubmit={handleCreate} className="card-surface rounded-lg p-4 mb-6">
        <label className="block text-xs text-cream/60 mb-1">New page title</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ramadan Deals"
            className="flex-1 min-w-0 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
          <button
            type="submit"
            disabled={creating || !title.trim()}
            className="shrink-0 rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-4 py-2 text-sm disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </form>

      {loading ? (
        <p className="text-cream/50 text-sm">Loading…</p>
      ) : collections.length === 0 ? (
        <p className="text-cream/50 text-sm">No pages yet — create your first one above.</p>
      ) : (
        <div className="space-y-2">
          {collections.map((c) => (
            <div key={c.id} className="card-surface rounded-lg p-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                <p className="text-sm text-cream/90">{c.title}</p>
                <p className="text-xs text-cream/45">
                  /collection/{c.slug} · {c.product_count} product{c.product_count === 1 ? "" : "s"}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  c.is_active ? "bg-deal-green/20 text-deal-green" : "bg-white/5 text-cream/40"
                }`}
              >
                {c.is_active ? "Visible" : "Hidden"}
              </span>
              <Link
                href={`/admin/collections/${c.id}`}
                className="text-xs text-gold hover:underline px-2 py-1"
              >
                Edit
              </Link>
              <a
                href={`/collection/${c.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cream/70 hover:text-gold px-2 py-1"
              >
                View
              </a>
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
