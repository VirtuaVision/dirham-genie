"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const emptyForm = {
  title: "",
  description: "",
  image_url: "",
  price: "",
  list_price: "",
  asin: "",
  affiliate_url: "",
  category_id: "",
  is_featured: false,
  is_active: true,
  source: "manual",
};

export default function NewProductPage() {
  const router = useRouter();
  const [mode, setMode] = useState("amazon"); // "amazon" | "manual"
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [amazonInput, setAmazonInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAmazonFetch(e) {
    e.preventDefault();
    setFetching(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/amazon/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: amazonInput }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const p = json.product;
      setForm((f) => ({
        ...f,
        title: p.title,
        description: p.description,
        image_url: p.image_url,
        price: p.price ?? "",
        list_price: p.list_price ?? "",
        asin: p.asin,
        affiliate_url: p.affiliate_url,
        source: "amazon_api",
        rating: p.rating,
        review_count: p.review_count,
      }));
      setNotice("Product details fetched! Review below, then save.");
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id || null,
          price: form.price === "" ? null : Number(form.price),
          list_price: form.list_price === "" ? null : Number(form.list_price),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push("/admin/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Add Product</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("amazon")}
          className={`text-sm px-4 py-2 rounded-md ${
            mode === "amazon" ? "bg-gold text-ink font-semibold" : "bg-white/5 text-cream/70"
          }`}
        >
          Auto-fetch from Amazon.ae
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`text-sm px-4 py-2 rounded-md ${
            mode === "manual" ? "bg-gold text-ink font-semibold" : "bg-white/5 text-cream/70"
          }`}
        >
          Add Manually
        </button>
      </div>

      {mode === "amazon" && (
        <form onSubmit={handleAmazonFetch} className="card-surface rounded-lg p-4 mb-6">
          <label className="block text-xs text-cream/60 mb-1">
            Paste the Amazon.ae product page URL (or its ASIN)
          </label>
          <div className="flex gap-2">
            <input
              value={amazonInput}
              onChange={(e) => setAmazonInput(e.target.value)}
              placeholder="https://www.amazon.ae/dp/B0XXXXXXX"
              className="flex-1 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
            <button
              type="submit"
              disabled={fetching}
              className="rounded-md bg-gold hover:bg-gold-bright text-ink text-sm font-semibold px-4 disabled:opacity-60"
            >
              {fetching ? "Fetching..." : "Fetch"}
            </button>
          </div>
          <p className="text-xs text-cream/40 mt-2">
            Requires your Amazon PA-API credentials to be set up and approved
            (see the README for setup steps). If you haven&apos;t been approved
            yet, use &quot;Add Manually&quot; instead.
          </p>
        </form>
      )}

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
        </p>
      )}
      {notice && (
        <p className="bg-deal-green/10 border border-deal-green/30 text-deal-green text-sm rounded p-3 mb-4">
          {notice}
        </p>
      )}

      <form onSubmit={handleSave} className="card-surface rounded-lg p-5 space-y-4">
        {form.image_url && (
          <div className="relative w-24 h-24 bg-white/5 rounded">
            <Image src={form.image_url} alt="" fill sizes="96px" className="object-contain p-2" />
          </div>
        )}

        <div>
          <label className="block text-xs text-cream/60 mb-1">Product Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Brand (optional)</label>
          <input
            value={form.brand || ""}
            onChange={(e) => update("brand", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Description / Highlights</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Image URL</label>
          <input
            value={form.image_url}
            onChange={(e) => update("image_url", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-cream/60 mb-1">Price (AED)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/60 mb-1">Original / List Price (AED)</label>
            <input
              type="number"
              step="0.01"
              value={form.list_price}
              onChange={(e) => update("list_price", e.target.value)}
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">
            Amazon Affiliate Link * (must include your tracking tag)
          </label>
          <input
            required
            value={form.affiliate_url}
            onChange={(e) => update("affiliate_url", e.target.value)}
            placeholder="https://www.amazon.ae/dp/B0XXXXXXX?tag=your-tag-21"
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Category</label>
          <select
            value={form.category_id}
            onChange={(e) => update("category_id", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          >
            <option value="">Uncategorised</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Coupon Code (optional)</label>
          <input
            value={form.coupon_code || ""}
            onChange={(e) => update("coupon_code", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Coupon Details (optional)</label>
          <input
            value={form.coupon_details || ""}
            onChange={(e) => update("coupon_details", e.target.value)}
            placeholder="e.g. Clip the on-page coupon for extra 10% off"
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div className="flex gap-6 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-cream/70">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => update("is_featured", e.target.checked)}
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-cream/70">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update("is_active", e.target.checked)}
            />
            Active (visible on site)
          </label>
          <label className="flex items-center gap-2 text-sm text-cream/70">
            <input
              type="checkbox"
              checked={form.is_lightning_deal || false}
              onChange={(e) => update("is_lightning_deal", e.target.checked)}
            />
            ⚡ Lightning Deal
          </label>
        </div>

        {form.is_lightning_deal && (
          <div>
            <label className="block text-xs text-cream/60 mb-1">Deal ends at</label>
            <input
              type="datetime-local"
              value={form.deal_expires_at || ""}
              onChange={(e) => update("deal_expires_at", e.target.value)}
              className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-6 py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
