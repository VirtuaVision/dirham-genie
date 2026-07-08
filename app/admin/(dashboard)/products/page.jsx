"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatAed } from "@/lib/formatCurrency";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="card-surface rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3"
          >
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
