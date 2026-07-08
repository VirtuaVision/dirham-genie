"use client";

import { useEffect, useRef, useState } from "react";
import { formatAed, discountPercent } from "@/lib/formatCurrency";

const SIZE = 1080;
const MAX_SLOTS = 4;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(" ");
  let line = "";
  let lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length === maxLines && ctx.measureText(lines[maxLines - 1]).width > maxWidth) {
    let truncated = lines[maxLines - 1];
    while (ctx.measureText(truncated + "…").width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    lines[maxLines - 1] = truncated + "…";
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length * lineHeight;
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

export default function SocialPostPage() {
  const canvasRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((json) => {
        const recent = (json.products || []).filter((p) => p.is_active).slice(0, 10);
        setProducts(recent);
        setSelected(recent.slice(0, MAX_SLOTS).map((p) => p.id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleSelect(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, id];
    });
  }

  async function generate() {
    setRendering(true);
    setError(null);
    try {
      const chosen = products.filter((p) => selected.includes(p.id)).slice(0, MAX_SLOTS);
      if (chosen.length === 0) {
        setError("Select at least one product first.");
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");

      // Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, SIZE);
      bgGradient.addColorStop(0, "#14141C");
      bgGradient.addColorStop(1, "#0B0B10");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Header
      try {
        const logo = await loadImage("/logo-dirham-genie.png");
        ctx.save();
        ctx.beginPath();
        ctx.arc(90, 90, 50, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, 40, 40, 100, 100);
        ctx.restore();
      } catch {
        // logo failed to load; continue without it
      }

      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 46px Arial";
      ctx.textBaseline = "top";
      ctx.fillText("TODAY'S BEST DEALS", 160, 55);
      ctx.fillStyle = "rgba(245,241,232,0.6)";
      ctx.font = "26px Arial";
      ctx.fillText("Dirham Genie \u00b7 dirhamgenie.com", 160, 108);

      // Product grid (2x2)
      const gridTop = 180;
      const gap = 24;
      const cardSize = (SIZE - gap * 3) / 2;
      const positions = [
        [gap, gridTop],
        [gap * 2 + cardSize, gridTop],
        [gap, gridTop + cardSize + gap],
        [gap * 2 + cardSize, gridTop + cardSize + gap],
      ];

      for (let i = 0; i < chosen.length; i++) {
        const p = chosen[i];
        const [x, y] = positions[i];

        ctx.fillStyle = "#1D1D28";
        roundRect(ctx, x, y, cardSize, cardSize, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(212,175,55,0.25)";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, cardSize, cardSize, 20);
        ctx.stroke();

        const imgBox = cardSize * 0.55;
        if (p.image_url) {
          try {
            const img = await loadImage(`/api/proxy-image?url=${encodeURIComponent(p.image_url)}`);
            const scale = Math.min(imgBox / img.width, imgBox / img.height) * 0.9;
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(
              img,
              x + (cardSize - w) / 2,
              y + 20 + (imgBox - h) / 2,
              w,
              h
            );
          } catch {
            // image failed to load; skip
          }
        }

        const discount = discountPercent(p.price, p.list_price);
        if (discount) {
          ctx.fillStyle = "#2E9E5B";
          roundRect(ctx, x + 16, y + 16, 90, 40, 8);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 22px Arial";
          ctx.fillText(`-${discount}%`, x + 28, y + 26);
        }

        ctx.fillStyle = "#F5F1E8";
        ctx.font = "24px Arial";
        wrapText(ctx, p.title, x + 20, y + imgBox + 30, cardSize - 40, 30, 2);

        ctx.fillStyle = "#D4AF37";
        ctx.font = "bold 30px Arial";
        ctx.fillText(formatAed(p.price) || "See price", x + 20, y + cardSize - 55);
      }

      // Footer disclosure
      ctx.fillStyle = "rgba(245,241,232,0.45)";
      ctx.font = "20px Arial";
      ctx.fillText("As an Amazon Associate, Dirham Genie earns from qualifying purchases.", gap, SIZE - 40);

      // Build the caption text to go with the image
      const lines = chosen.map((p) => {
        const price = formatAed(p.price) || "See price on Amazon";
        return `\u2728 ${p.title} \u2014 ${price}\n${p.affiliate_url}`;
      });
      const generatedCaption =
        `\ud83e\uddde\u200d\u2642\ufe0f Today's Best Deals from Dirham Genie! \ud83d\udd25\n\n` +
        lines.join("\n\n") +
        `\n\n\ud83d\udccd Shop more at dirhamgenie.com\n` +
        `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals #DealsOfTheDay\n\n` +
        `As an Amazon Associate, Dirham Genie earns from qualifying purchases.`;
      setCaption(generatedCaption);
    } catch (err) {
      setError(err.message);
    } finally {
      setRendering(false);
    }
  }

  function downloadImage() {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "dirham-genie-post.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function publishToSocial() {
    setPublishing(true);
    setPublishResult(null);
    setError(null);
    try {
      const canvas = canvasRef.current;
      const imageDataUrl = canvas.toDataURL("image/png");
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, caption }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPublishResult(json.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  function copyCaption() {
    navigator.clipboard.writeText(caption);
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Social Post Generator</h1>
      <p className="text-cream/50 text-sm mb-6">
        Pick up to {MAX_SLOTS} of your recent products and generate a ready-to-share
        square image plus a caption with all the affiliate links included.
      </p>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-cream/50 text-sm">Loading recent products...</p>
      ) : (
        <div className="card-surface rounded-lg p-4 mb-6">
          <p className="text-xs text-cream/60 mb-2">Select up to {MAX_SLOTS} products:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {products.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 text-sm text-cream/80 bg-white/5 rounded px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleSelect(p.id)}
                />
                <span className="truncate">{p.title}</span>
              </label>
            ))}
          </div>
          <button
            onClick={generate}
            disabled={rendering}
            className="mt-4 rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {rendering ? "Generating..." : "Generate Post"}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-cream/60 mb-2">Image preview:</p>
          <canvas
            ref={canvasRef}
            className="w-full max-w-md rounded-lg border border-gold/20"
          />
          {caption && (
            <button
              onClick={downloadImage}
              className="mt-3 rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-4 py-2 text-sm"
            >
              Download Image
            </button>
          )}
        </div>

        {caption && (
          <div>
            <p className="text-xs text-cream/60 mb-2">Caption (ready to paste):</p>
            <textarea
              readOnly
              value={caption}
              rows={14}
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
            <div className="flex flex-wrap gap-3 mt-3">
              <button
                onClick={copyCaption}
                className="rounded-md border border-gold/30 text-cream/80 hover:border-gold hover:text-gold px-4 py-2 text-sm"
              >
                Copy Caption
              </button>
              <button
                onClick={publishToSocial}
                disabled={publishing}
                className="rounded-md bg-vvblue hover:opacity-90 text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
                style={{ backgroundColor: "#3B5BDB" }}
              >
                {publishing ? "Posting..." : "📤 Post to Facebook & Instagram"}
              </button>
            </div>

            {publishResult && (
              <div className="mt-4 space-y-2 text-sm">
                {["facebook", "instagram"].map((platform) => {
                  const r = publishResult[platform];
                  if (!r) return null;
                  return (
                    <p
                      key={platform}
                      className={
                        r.ok
                          ? "text-deal-green"
                          : r.skipped
                          ? "text-cream/50"
                          : "text-red-300"
                      }
                    >
                      {platform === "facebook" ? "Facebook" : "Instagram"}:{" "}
                      {r.ok
                        ? "Posted successfully! ✅"
                        : r.skipped
                        ? r.reason
                        : `Failed — ${r.error}`}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
