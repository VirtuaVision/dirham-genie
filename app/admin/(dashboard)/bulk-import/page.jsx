"use client";

import { useEffect, useState } from "react";

export default function BulkImportPage() {
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.categories || []));
  }, []);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function handleImport() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.split(",")[0].trim())
        .filter(Boolean)
        .filter((l) => l.toLowerCase() !== "asin"); // skip a header row if present

      const res = await fetch("/api/amazon/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, category_id: categoryId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Bulk Import from Amazon</h1>
      <p className="text-cream/50 text-sm mb-6">
        Upload a CSV/text file, or paste a list, with one ASIN or Amazon.ae
        product link per line. Every product gets auto-fetched (title, image,
        price) and added to your site in one go. Requires your Amazon PA-API
        keys to already be set up.
      </p>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
        </p>
      )}

      <div className="card-surface rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-xs text-cream/60 mb-1">Upload a .csv or .txt file (optional)</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            className="text-sm text-cream/70"
          />
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">
            Or paste ASINs / Amazon.ae links, one per line
          </label>
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"B0D1XXXXXX\nhttps://www.amazon.ae/dp/B0D2XXXXXX\nB0D3XXXXXX"}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Assign all to category (optional)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          >
            <option value="">Uncategorised</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleImport}
          disabled={running || !text.trim()}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {running ? "Importing... this may take a minute" : "Start Import"}
        </button>
      </div>

      {result && (
        <div className="card-surface rounded-lg p-4 mt-6 text-sm">
          <p className="text-deal-green font-semibold">
            Imported {result.imported} new product{result.imported === 1 ? "" : "s"}.
          </p>
          <p className="text-cream/60 mt-1">
            Skipped {result.skippedDuplicates} already on your site
            {result.invalidLines > 0 && `, ignored ${result.invalidLines} invalid line(s)`}
            {result.errors > 0 && `, ${result.errors} error(s)`}.
          </p>
          {result.details?.length > 0 && (
            <ul className="text-cream/40 text-xs mt-2 list-disc list-inside">
              {result.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
