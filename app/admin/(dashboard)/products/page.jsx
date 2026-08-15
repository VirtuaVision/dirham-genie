"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatAed } from "@/lib/formatCurrency";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProducts(json.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleField(product, field) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !product[field] }),
    });
    load();
  }

  async function remove(product) {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    load();
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesSource =
      sourceFilter === "all" ||
      (sourceFilter === "amazon_api" ? p.source === "amazon_api" : p.source !== "amazon_api");
    return matchesSearch && matchesSource;
  });

  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selected.has(p.id));

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (
      !confirm(
        `Delete ${selected.size} selected product${selected.size === 1 ? "" : "s"}? This cannot be undone.`
      )
    )
      return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSelected(new Set());
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">All Products</h1>
        <div className="flex gap-2">
          <a
            href="/api/products/export"
            className="rounded-md border border-gold/30 text-cream/80 hover:border-gold hover:text-gold text-sm font-semibold px-4 py-2"
          >
            Export CSV
          </a>
          <Link
            href="/admin/products/new"
            className="rounded-md bg-gold hover:bg-gold-bright text-ink text-sm font-semibold px-4 py-2 transition-colors"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {loading && <p className="text-cream/50 text-sm">Loading...</p>}
      {error && <p className="text-red-300 text-sm">{error}</p>}

      {!loading && products.length === 0 && (
        <p className="text-cream/50 text-sm">
          No products yet. Click &quot;Add Product&quot; to create your first one.
        </p>
      )}

      {!loading && products.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="flex-1 min-w-[180px] bg-ink-lighter border border-gold/20 rounded-md px-3 py-2 text-sm text-cream/90 placeholder:text-cream/30"
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-ink-lighter border border-gold/20 rounded-md px-3 py-2 text-sm text-cream/90"
          >
            <option value="all">All sources ({products.length})</option>
            <option value="amazon_api">
              Auto-fetched from Amazon ({products.filter((p) => p.source === "amazon_api").length})
            </option>
            <option value="manual">
              Manual ({products.filter((p) => p.source !== "amazon_api").length})
            </option>
          </select>
        </div>
      )}

      {!loading && filteredProducts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white/5 rounded-lg px-3 py-2">
          <label className="flex items-center gap-2 text-sm text-cream/80 cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAllFiltered}
            />
            Select all ({filteredProducts.length} shown)
          </label>

          {selected.size > 0 && (
            <>
              <span className="text-xs text-cream/50">{selected.size} selected</span>
              <button
                onClick={deleteSelected}
                disabled={bulkDeleting}
                className="ml-auto rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 disabled:opacity-60"
              >
                {bulkDeleting ? "Deleting..." : `Delete Selected (${selected.size})`}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-cream/50 hover:text-cream/80 underline"
              >
                Clear selection
              </button>
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        {!loading && products.length > 0 && filteredProducts.length === 0 && (
          <p className="text-cream/50 text-sm">No products match that search/filter.</p>
        )}
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="card-surface rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggleOne(p.id)}
              className="shrink-0"
            />

            <div className="relative w-14 h-14 shrink-0 bg-white/5 rounded">
              {p.image_url && (
                <Image src={p.image_url} alt={p.title} fill sizes="56px" className="object-contain p-1" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-cream/90 truncate">{p.title}</p>
              <p className="text-xs text-cream/50">
                {formatAed(p.price) || "No price"} &middot; {p.categories?.name || "Uncategorised"} &middot;{" "}
                {p.source === "amazon_api" ? "Auto-fetched" : "Manual"}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => toggleField(p, "is_active")}
                className={`px-2 py-1 rounded ${
                  p.is_active ? "bg-deal-green/20 text-deal-green" : "bg-white/5 text-cream/40"
                }`}
              >
                {p.is_active ? "Active" : "Hidden"}
              </button>
              <button
                onClick={() => toggleField(p, "is_featured")}
                className={`px-2 py-1 rounded ${
                  p.is_featured ? "bg-gold/20 text-gold" : "bg-white/5 text-cream/40"
                }`}
              >
                {p.is_featured ? "Featured" : "Not featured"}
              </button>
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="px-2 py-1 rounded bg-white/5 text-cream/70 hover:text-gold"
              >
                Edit
              </Link>
              <button
                onClick={() => remove(p)}
                className="px-2 py-1 rounded bg-white/5 text-cream/70 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}