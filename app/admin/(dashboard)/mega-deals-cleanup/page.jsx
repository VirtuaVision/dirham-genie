"use client";

import { useEffect, useState } from "react";
import { formatAed } from "@/lib/formatCurrency";

export default function MegaDealsCleanupPage() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products/mega-deals-audit");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProducts(json.products || []);
      setSelected((json.products || []).filter((p) => !p.qualifies).map((p) => p.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAllFlagged() {
    setSelected(products.filter((p) => !p.qualifies).map((p) => p.id));
  }

  async function runAction(action) {
    if (selected.length === 0) {
      setError("Select at least one product first.");
      return;
    }
    const confirmMsg =
      action === "delete"
        ? `Permanently delete ${selected.length} product(s)? This can't be undone.`
        : `Move ${selected.length} product(s) out of Mega Deals (to Uncategorised)?`;
    if (!confirm(confirmMsg)) return;

    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/products/mega-deals-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessage(`Done — ${json.action} ${json.count} product(s).`);
      setSelected([]);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  const flaggedCount = products.filter((p) => !p.qualifies).length;

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Mega Deals Cleanup</h1>
      <p className="text-cream/50 text-sm mb-6">
        Lists every product currently in the &quot;Mega Deals (50%+ Off)&quot;
        category and checks whether it actually qualifies. Anything flagged
        red doesn&apos;t have a genuine 50%+ discount and is pre-selected for
        you to fix.
      </p>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
        </p>
      )}
      {message && (
        <p className="bg-deal-green/10 border border-deal-green/30 text-deal-green text-sm rounded p-3 mb-4">
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-cream/50 text-sm">No products in Mega Deals yet — nothing to clean up.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <p className="text-sm text-cream/70">
              {products.length} total &middot; <span className="text-red-300">{flaggedCount} flagged</span>
            </p>
            <button
              onClick={selectAllFlagged}
              className="text-xs px-3 py-1.5 rounded border border-gold/30 text-cream/70 hover:border-gold hover:text-gold"
            >
              Select all flagged
            </button>
            <button
              onClick={() => runAction("uncategorize")}
              disabled={working}
              className="text-xs px-3 py-1.5 rounded bg-gold text-ink font-semibold disabled:opacity-60"
            >
              Move selected to Uncategorised
            </button>
            <button
              onClick={() => runAction("delete")}
              disabled={working}
              className="text-xs px-3 py-1.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 disabled:opacity-60"
            >
              Delete selected
            </button>
          </div>

          <div className="space-y-2">
            {products.map((p) => (
              <label
                key={p.id}
                className={`card-surface rounded-lg p-3 flex items-center gap-3 cursor-pointer ${
                  !p.qualifies ? "border-red-500/40" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                />
                {p.image_url && (
                  <img src={p.image_url} alt="" className="w-12 h-12 object-contain bg-white/5 rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cream/90 truncate">{p.title}</p>
                  <p className="text-xs text-cream/50">
                    {formatAed(p.price) || "No price"}
                    {p.list_price ? ` (was ${formatAed(p.list_price)})` : " · no list price"}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                    p.qualifies ? "bg-deal-green/20 text-deal-green" : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {p.computed_discount}% off
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}