"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatAed } from "@/lib/formatCurrency";

const PAGE_SIZE = 20;

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DATE_PRESETS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "last30", label: "Last 30 Days" },
  { key: "custom", label: "Custom Range" },
];

function computePresetRange(key) {
  const now = new Date();
  const today = toLocalDateString(now);
  if (key === "today") return { from: today, to: today };
  if (key === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const s = toLocalDateString(y);
    return { from: s, to: s };
  }
  if (key === "last7") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { from: toLocalDateString(from), to: today };
  }
  if (key === "last30") {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { from: toLocalDateString(from), to: today };
  }
  return { from: "", to: "" };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectingAllMatching, setSelectingAllMatching] = useState(false);

  const activeRange = datePreset === "custom"
    ? { from: customFrom, to: customTo }
    : computePresetRange(datePreset);

  function buildParams(extra = {}) {
    const params = new URLSearchParams({ fields: "list", ...extra });
    if (search) params.set("search", search);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (activeRange.from) params.set("dateFrom", activeRange.from);
    if (activeRange.to) params.set("dateTo", activeRange.to);
    return params;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams({ page: String(page), limit: String(PAGE_SIZE) });
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProducts(json.products || []);
      setTotalPages(json.totalPages || 1);
      setTotal(json.total ?? (json.products || []).length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Reset to page 1 whenever any filter changes, so results don't land on
  // an empty out-of-range page.
  useEffect(() => {
    setPage(1);
  }, [search, sourceFilter, datePreset, customFrom, customTo]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sourceFilter, datePreset, customFrom, customTo]);

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

  const allOnPageSelected =
    products.length > 0 && products.every((p) => selected.has(p.id));

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        products.forEach((p) => next.delete(p.id));
      } else {
        products.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  async function selectAllMatching() {
    setSelectingAllMatching(true);
    try {
      const params = buildParams({ idsOnly: "true" });
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSelected(new Set((json.products || []).map((p) => p.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSelectingAllMatching(false);
    }
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
      const res = await fetch("/api/products/mega-deals-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action: "delete" }),
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

      {error && (
        <div className="flex items-center gap-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={load}
            className="text-xs rounded-md border border-gold/30 text-gold px-3 py-1.5 hover:border-gold"
          >
            Retry
          </button>
        </div>
      )}

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
          <option value="all">All sources</option>
          <option value="amazon_api">Auto-fetched from Amazon</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div className="mb-4 bg-white/5 rounded-lg p-3">
        <p className="text-xs text-cream/60 mb-2">Filter by date added:</p>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setDatePreset(p.key)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                datePreset === p.key
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-gold/20 text-cream/60 hover:border-gold/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <label className="text-xs text-cream/60">
              From
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="block mt-1 bg-ink-lighter border border-gold/20 rounded-md px-2 py-1.5 text-sm text-cream/90"
              />
            </label>
            <label className="text-xs text-cream/60">
              To
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="block mt-1 bg-ink-lighter border border-gold/20 rounded-md px-2 py-1.5 text-sm text-cream/90"
              />
            </label>
          </div>
        )}
        {datePreset !== "all" && activeRange.from && (
          <p className="text-xs text-cream/40 mt-2">
            Showing products added {activeRange.from === activeRange.to
              ? `on ${activeRange.from}`
              : `between ${activeRange.from} and ${activeRange.to}`}
          </p>
        )}
      </div>

      {!loading && products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white/5 rounded-lg px-3 py-2">
          <label className="flex items-center gap-2 text-sm text-cream/80 cursor-pointer">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={toggleSelectAllOnPage}
            />
            Select all on this page ({products.length})
          </label>
          <button
            onClick={selectAllMatching}
            disabled={selectingAllMatching}
            className="text-xs text-gold underline underline-offset-2 disabled:opacity-50"
          >
            {selectingAllMatching ? "Selecting..." : `Select all ${total} matching this filter`}
          </button>

          {selected.size > 0 && (
            <>
              <span className="text-xs text-cream/50">{selected.size} selected total</span>
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

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-cream/50 text-sm">No products match.</p>
      ) : (
        <>
          <div className="space-y-3">
            {products.map((p) => (
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

          <div className="flex items-center justify-between mt-6 text-sm text-cream/60">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-gold/20 px-3 py-1.5 disabled:opacity-40 hover:border-gold/50"
            >
              ← Prev
            </button>
            <span>
              Page {page} of {totalPages} ({total} product{total === 1 ? "" : "s"})
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-gold/20 px-3 py-1.5 disabled:opacity-40 hover:border-gold/50"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}