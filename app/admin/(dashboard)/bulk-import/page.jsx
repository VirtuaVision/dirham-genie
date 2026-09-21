"use client";

import { useEffect, useState } from "react";

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const splitLine = (line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));

  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const looksLikeHeader = header.includes("title") && (header.includes("affiliate_url") || header.includes("link"));

  const dataLines = looksLikeHeader ? lines.slice(1) : lines;
  const columns = looksLikeHeader
    ? header
    : ["title", "price", "list_price", "image_url", "affiliate_url", "brand", "coupon_code", "coupon_details"];

  return dataLines.map((line) => {
    const cells = splitLine(line);
    const row = {};
    columns.forEach((col, i) => {
      row[col] = cells[i] || "";
    });
    return row;
  });
}

export default function BulkImportPage() {
  const [mode, setMode] = useState("manual");
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewRows, setPreviewRows] = useState(null); // null = not previewed yet
  const [batchCouponCode, setBatchCouponCode] = useState("");
  const [batchCouponDetails, setBatchCouponDetails] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        const cats = json.categories || [];
        setCategories(cats);
        const genie = cats.find((c) => c.slug === "genies-choice");
        if (genie && mode === "manual") setCategoryId(genie.id);
      });
  }, []);

  useEffect(() => {
    if (mode === "manual") {
      const genie = categories.find((c) => c.slug === "genies-choice");
      if (genie) setCategoryId(genie.id);
    }
  }, [mode, categories]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  }

  function handleBuildPreview() {
    setError(null);
    setResult(null);
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setError("Nothing to preview — check your file/paste.");
      return;
    }
    setPreviewRows(
      rows.map((r) => ({
        ...r,
        coupon_code: r.coupon_code || batchCouponCode,
        coupon_details: r.coupon_details || batchCouponDetails,
      }))
    );
  }

  function updatePreviewRow(index, field, value) {
    setPreviewRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function handleBackToEdit() {
    setPreviewRows(null);
    setError(null);
  }

  async function handleManualImport() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const rows = previewRows ?? parseCsv(text);
      if (rows.length === 0) throw new Error("Nothing to import — check your file/paste.");

      const res = await fetch("/api/products/manual-bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, category_id: categoryId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json);
      setPreviewRows(null);
      setText("");
      setBatchCouponCode("");
      setBatchCouponDetails("");
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function handleAmazonImport() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.split(",")[0].trim())
        .filter(Boolean)
        .filter((l) => l.toLowerCase() !== "asin");

      const res = await fetch("/api/amazon/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          category_id: categoryId || null,
          coupon_code: batchCouponCode.trim() || null,
          coupon_details: batchCouponDetails.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json);
      setBatchCouponCode("");
      setBatchCouponDetails("");
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Bulk Import Products</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode("manual"); setResult(null); setError(null); setPreviewRows(null); }}
          className={`text-sm px-4 py-2 rounded-md ${mode === "manual" ? "bg-gold text-ink font-semibold" : "bg-white/5 text-cream/70"}`}
        >
          Manual (recommended)
        </button>
        <button
          onClick={() => { setMode("amazon"); setResult(null); setError(null); setPreviewRows(null); }}
          className={`text-sm px-4 py-2 rounded-md ${mode === "amazon" ? "bg-gold text-ink font-semibold" : "bg-white/5 text-cream/70"}`}
        >
          Amazon Auto-fetch
        </button>
      </div>

      {mode === "amazon" && (
        <p className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm rounded p-3 mb-4">
          Heads up: Amazon retired the API this feature depends on (PA-API) in
          May 2026 and replaced it with a new system requiring 10 sales in 30
          days to access. This mode won&apos;t work until that&apos;s rebuilt
          and you&apos;re eligible. Use &quot;Manual&quot; for now.
        </p>
      )}

      <p className="text-cream/50 text-sm mb-6">
        {mode === "manual"
          ? "Upload a CSV or paste rows with: title, price, list_price, image_url, affiliate_url, brand (one product per line, comma-separated). A header row is optional. You'll get a chance to add a coupon code to each product next, before importing."
          : "Upload a CSV/text file, or paste a list, with one ASIN or Amazon.ae product link per line."}
      </p>

      <div className="card-surface rounded-lg p-4 space-y-4">
        {mode === "amazon" || !previewRows ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-cream/60 mb-1">
                  Coupon code for this whole batch (optional)
                </label>
                <input
                  type="text"
                  value={batchCouponCode}
                  onChange={(e) => setBatchCouponCode(e.target.value)}
                  placeholder="e.g. SAVE20"
                  className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-cream/60 mb-1">Coupon details (optional)</label>
                <input
                  type="text"
                  value={batchCouponDetails}
                  onChange={(e) => setBatchCouponDetails(e.target.value)}
                  placeholder="e.g. Applies at checkout"
                  className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-cream/40 -mt-2">
              {mode === "manual"
                ? "Applied to every product in this batch — you can still fine-tune or clear it per product on the next step."
                : "Applied to every product fetched in this batch."}
            </p>

            <div>
              <label className="block text-xs text-cream/60 mb-1">Upload a .csv or .txt file (optional)</label>
              <input type="file" accept=".csv,.txt" onChange={handleFile} className="text-sm text-cream/70" />
            </div>

            <div>
              <label className="block text-xs text-cream/60 mb-1">
                {mode === "manual"
                  ? "Or paste rows: title,price,list_price,image_url,affiliate_url,brand"
                  : "Or paste ASINs / Amazon.ae links, one per line"}
              </label>
              <textarea
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === "manual"
                    ? "Wireless Earbuds,99.00,149.00,https://example.com/img.jpg,https://www.amazon.ae/dp/B0XXXXX?tag=yourtag-21,SoundCo"
                    : "B0D1XXXXXX\nhttps://www.amazon.ae/dp/B0D2XXXXXX"
                }
                className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none font-mono"
              />
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-cream/60">
                Add a coupon code to any product below (optional) — leave blank if there isn&apos;t one
              </label>
              <button
                onClick={handleBackToEdit}
                className="text-xs text-cream/50 underline hover:text-cream/80 shrink-0 ml-3"
              >
                ← Back to edit list
              </button>
            </div>
            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              {previewRows.map((row, i) => (
                <div key={i} className="rounded-md border border-gold/20 bg-ink-lighter px-3 py-3">
                  <p className="text-sm text-cream/90 font-medium truncate">
                    {row.title || <span className="text-red-400">Missing title</span>}
                  </p>
                  <p className="text-xs text-cream/40 mb-2">
                    {row.price ? `AED ${row.price}` : "No price"}
                    {row.affiliate_url ? " · has link" : " · missing link"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={row.coupon_code || ""}
                      onChange={(e) => updatePreviewRow(i, "coupon_code", e.target.value)}
                      placeholder="Coupon code (optional)"
                      className="rounded-md bg-ink border border-gold/25 px-2 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                    <input
                      type="text"
                      value={row.coupon_details || ""}
                      onChange={(e) => updatePreviewRow(i, "coupon_details", e.target.value)}
                      placeholder="Coupon details (optional)"
                      className="rounded-md bg-ink border border-gold/25 px-2 py-1.5 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {mode === "manual" && !previewRows ? (
          <button
            onClick={handleBuildPreview}
            disabled={!text.trim()}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2.5 text-sm disabled:opacity-60"
          >
            Next: Add Coupons →
          </button>
        ) : (
          <button
            onClick={mode === "manual" ? handleManualImport : handleAmazonImport}
            disabled={running || (mode === "manual" ? !previewRows?.length : !text.trim())}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {running ? "Importing..." : "Start Import"}
          </button>
        )}
      </div>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mt-4">
          {error}
        </p>
      )}

      {result && (
        <div className="card-surface rounded-lg p-4 mt-6 text-sm">
          <p className="text-deal-green font-semibold">
            Imported {result.imported} new product{result.imported === 1 ? "" : "s"}.
          </p>
          {result.skippedDuplicates !== undefined && (
            <p className="text-cream/60 mt-1">
              Skipped {result.skippedDuplicates} already on your site
              {result.invalidLines > 0 && `, ignored ${result.invalidLines} invalid line(s)`}
              {result.errors > 0 && `, ${result.errors} error(s)`}.
            </p>
          )}
          {result.errors > 0 && result.skippedDuplicates === undefined && (
            <p className="text-cream/60 mt-1">{result.errors} row(s) had errors.</p>
          )}
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