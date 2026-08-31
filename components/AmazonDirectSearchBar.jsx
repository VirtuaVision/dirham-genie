"use client";

import { useState } from "react";
import AmazonLiveResults from "@/components/AmazonLiveResults";

export default function AmazonDirectSearchBar() {
  const [keyword, setKeyword] = useState("");
  const [minDiscount, setMinDiscount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/amazon/public-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, minDiscount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResults(json.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mb-8">
      <div className="card-surface rounded-lg p-4">
        <p className="text-sm text-gold font-semibold mb-1">🔎 Search all of Amazon.ae directly</p>
        <p className="text-xs text-cream/50 mb-3">
          Looking for something specific? Search Amazon.ae itself — not just what's already on our site.
        </p>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. wireless earbuds"
            className="flex-1 min-w-[160px] bg-ink-lighter border border-gold/20 rounded-md px-3 py-2 text-sm text-cream/90 placeholder:text-cream/30"
          />
          <select
            value={minDiscount}
            onChange={(e) => setMinDiscount(Number(e.target.value))}
            className="bg-ink-lighter border border-gold/20 rounded-md px-3 py-2 text-sm text-cream/90"
          >
            <option value={0}>Any discount</option>
            <option value={0.3}>30%+ off</option>
            <option value={0.5}>50%+ off</option>
            <option value={0.7}>70%+ off</option>
          </select>
          <button
            type="submit"
            disabled={searching}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2 text-sm disabled:opacity-60"
          >
            {searching ? "Searching..." : "Search Amazon"}
          </button>
        </form>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {results && results.length === 0 && (
        <p className="text-cream/50 text-sm mt-4">
          No Amazon.ae results matched that search{minDiscount > 0 ? " at that discount level" : ""}. Try a different keyword or a lower discount filter.
        </p>
      )}
      {results && results.length > 0 && <AmazonLiveResults products={results} />}
    </div>
  );
}