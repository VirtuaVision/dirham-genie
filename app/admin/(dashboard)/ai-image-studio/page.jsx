"use client";

import { useEffect, useRef, useState } from "react";
import { discountPercent } from "@/lib/formatCurrency";

const DEFAULT_PROMPT =
  "Create a premium Amazon promotional image. Keep the product exactly the same " +
  "as the original. Replace the white background with a modern luxury UAE " +
  "shopping environment. Add soft lighting, realistic shadows, and a clean, " +
  "high-end advertisement style. Do not alter the product's shape, color, " +
  "branding, or packaging.";

// name, canvas width, canvas height, and where the platform(s) it's meant for
const OUTPUT_SIZES = [
  { key: "square", label: "Square — Website / Facebook / Instagram feed", w: 1080, h: 1080 },
  { key: "story", label: "Story — Instagram / WhatsApp status", w: 1080, h: 1920 },
  { key: "wide", label: "Wide — Facebook link preview", w: 1200, h: 630 },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws the AI image "cover" style (fills the frame, cropping overflow),
 *  then stamps the discount badge (top-left) and Dirham Genie logo (bottom-right). */
async function composeCanvas(canvas, { aiImageSrc, w, h, badgeText, logoSrc }) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const img = await loadImage(aiImageSrc);
  const scale = Math.max(w / img.width, h / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);

  if (badgeText) {
    const padX = 24;
    ctx.font = `bold ${Math.round(w * 0.045)}px Arial`;
    const textW = ctx.measureText(badgeText).width;
    const badgeW = textW + padX * 2;
    const badgeH = w * 0.09;
    const bx = w * 0.04;
    const by = w * 0.04;

    ctx.fillStyle = "#DC2626";
    roundRect(ctx, bx, by, badgeW, badgeH, badgeH / 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, bx + padX, by + badgeH / 2 + 2);
  }

  if (logoSrc) {
    try {
      const logo = await loadImage(logoSrc);
      const boxSize = w * 0.14;
      const logoScale = Math.min(boxSize / logo.width, boxSize / logo.height);
      const lw = logo.width * logoScale;
      const lh = logo.height * logoScale;
      const lx = w - lw - w * 0.04;
      const ly = h - lh - w * 0.04;

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      roundRect(ctx, lx - 10, ly - 10, lw + 20, lh + 20, 12);
      ctx.fill();
      ctx.drawImage(logo, lx, ly, lw, lh);
    } catch {
      // logo failed to load; continue without it
    }
  }
}

export default function AIImageStudioPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [badgeText, setBadgeText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [composing, setComposing] = useState(false);
  const [aiImage, setAiImage] = useState(null); // raw AI result, data URL
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [saveResult, setSaveResult] = useState(null);

  const canvasRefs = useRef({});

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((json) => {
        const active = (json.products || []).filter((p) => p.is_active).slice(0, 30);
        setProducts(active);
        if (active[0]) {
          setSelectedId(active[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selected = products.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    const discount = discountPercent(selected.price, selected.list_price);
    setBadgeText(discount ? `${discount}% OFF` : "");
    setAiImage(null);
    setSaveResult(null);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    if (!selected?.image_url) {
      setError("This product doesn't have a source image yet.");
      return;
    }
    setGenerating(true);
    setError(null);
    setAiImage(null);
    setSaveResult(null);
    try {
      const res = await fetch("/api/admin/ai-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: selected.image_url, prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAiImage(json.dataUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function composeAll() {
    if (!aiImage) return;
    setComposing(true);
    setError(null);
    try {
      for (const size of OUTPUT_SIZES) {
        const canvas = canvasRefs.current[size.key];
        if (!canvas) continue;
        await composeCanvas(canvas, {
          aiImageSrc: aiImage,
          w: size.w,
          h: size.h,
          badgeText,
          logoSrc: "/logo-dirham-genie.png",
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setComposing(false);
    }
  }

  function downloadSize(key) {
    const canvas = canvasRefs.current[key];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${(selected?.title || "dirham-genie").slice(0, 40).replace(/\s+/g, "-")}-${key}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function saveSize(key, setAsMainImage) {
    const canvas = canvasRefs.current[key];
    if (!canvas || !selected) return;
    setSavingKey(key);
    setSaveResult(null);
    setError(null);
    try {
      const imageDataUrl = canvas.toDataURL("image/png");
      const res = await fetch("/api/admin/ai-image/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, productId: selected.id, setAsMainImage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaveResult(`Saved! ${setAsMainImage ? "Set as the product's main image." : "Stored as the AI image."}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">AI Image Studio</h1>
      <p className="text-cream/50 text-sm mb-6">
        Pick a product, generate a premium AI lifestyle photo with ChatGPT&apos;s image
        model, then stamp on a discount badge and your logo and export it sized for
        Facebook, Instagram, WhatsApp, and the website.
      </p>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-cream/50 text-sm">Loading products...</p>
      ) : (
        <div className="card-surface rounded-lg p-4 mb-6 space-y-4">
          <div>
            <label className="text-xs text-cream/60 block mb-1">Product</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {selected?.image_url && (
            <img
              src={selected.image_url}
              alt=""
              className="w-24 h-24 object-contain rounded bg-white border border-gold/20"
            />
          )}

          <div>
            <label className="text-xs text-cream/60 block mb-1">AI prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-cream/60 block mb-1">Discount badge text (leave blank to skip)</label>
            <input
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="e.g. 40% OFF"
              className="w-full sm:w-56 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>

          <button
            onClick={generate}
            disabled={generating || !selected}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {generating ? "Generating with AI..." : "Generate AI Image"}
          </button>
        </div>
      )}

      {aiImage && (
        <div className="card-surface rounded-lg p-4 mb-6">
          <p className="text-xs text-cream/60 mb-2">AI result (background replaced):</p>
          <img src={aiImage} alt="AI generated" className="w-full max-w-sm rounded-lg border border-gold/20 mb-4" />
          <button
            onClick={composeAll}
            disabled={composing}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {composing ? "Composing..." : "Add Badge + Logo → Export All Sizes"}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {OUTPUT_SIZES.map((size) => (
          <div key={size.key} className="card-surface rounded-lg p-4">
            <p className="text-xs text-cream/60 mb-2">
              {size.label} ({size.w}×{size.h})
            </p>
            <canvas
              ref={(el) => (canvasRefs.current[size.key] = el)}
              className="w-full rounded-lg border border-gold/20 bg-black/10"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => downloadSize(size.key)}
                disabled={!aiImage}
                className="rounded-md border border-gold/30 text-cream/80 hover:border-gold hover:text-gold px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Download
              </button>
              {size.key === "square" && (
                <>
                  <button
                    onClick={() => saveSize(size.key, false)}
                    disabled={!aiImage || savingKey === size.key}
                    className="rounded-md border border-gold/30 text-cream/80 hover:border-gold hover:text-gold px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    {savingKey === size.key ? "Saving..." : "Save to Product"}
                  </button>
                  <button
                    onClick={() => saveSize(size.key, true)}
                    disabled={!aiImage || savingKey === size.key}
                    className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    {savingKey === size.key ? "Saving..." : "Set as Main Image"}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {saveResult && <p className="text-deal-green text-sm mt-4">{saveResult}</p>}
    </div>
  );
}