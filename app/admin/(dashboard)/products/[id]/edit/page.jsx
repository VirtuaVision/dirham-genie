"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.product) {
          setForm({
            ...json.product,
            category_id: json.product.category_id || "",
          });
        } else {
          setError(json.error || "Product not found.");
        }
      });
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.categories || []));
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id || null,
          price: form.price === "" || form.price === null ? null : Number(form.price),
          list_price:
            form.list_price === "" || form.list_price === null ? null : Number(form.list_price),
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

  if (!form) {
    return <p className="text-cream/50 text-sm">{error || "Loading..."}</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Edit Product</h1>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
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
            value={form.title || ""}
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
            value={form.description || ""}
            onChange={(e) => update("description", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Image URL</label>
          <input
            value={form.image_url || ""}
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
              value={form.price ?? ""}
              onChange={(e) => update("price", e.target.value)}
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/60 mb-1">Original / List Price (AED)</label>
            <input
              type="number"
              step="0.01"
              value={form.list_price ?? ""}
              onChange={(e) => update("list_price", e.target.value)}
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-cream/60 mb-1">Amazon Affiliate Link *</label>
          <input
            required
            value={form.affiliate_url || ""}
            onChange={(e) => update("affiliate_url", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        {form.affiliate_url && (
          <div>
            <label className="block text-xs text-cream/60 mb-2">QR Code (scan to open the affiliate link)</label>
            <img
              src={`/api/qr?url=${encodeURIComponent(form.affiliate_url)}`}
              alt="QR code"
              className="w-32 h-32 rounded border border-gold/20"
            />
            <a
              href={`/api/qr?url=${encodeURIComponent(form.affiliate_url)}`}
              download={`${form.slug || "product"}-qr.png`}
              className="block mt-2 text-xs text-gold underline underline-offset-2"
            >
              Download QR code
            </a>
          </div>
        )}

        <div>
          <label className="block text-xs text-cream/60 mb-1">Category</label>
          <select
            value={form.category_id || ""}
            onChange={(e) => update("category_id", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          >
            <option value="">Uncategorised</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-6 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-cream/70">
            <input
              type="checkbox"
              checked={!!form.is_featured}
              onChange={(e) => update("is_featured", e.target.checked)}
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-cream/70">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => update("is_active", e.target.checked)}
            />
            Active (visible on site)
          </label>
          <label className="flex items-center gap-2 text-sm text-cream/70">
            <input
              type="checkbox"
              checked={!!form.is_lightning_deal}
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

        <div>
          <label className="block text-xs text-cream/60 mb-1">Coupon Code (optional)</label>
          <input
            value={form.coupon_code || ""}
            onChange={(e) => update("coupon_code", e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-6 py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
