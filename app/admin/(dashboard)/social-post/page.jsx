"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

// Fills n cards into one row (n=1,2,3) or a 2x2 grid (n=4), always using
// the full available area — no empty cells regardless of how many are picked.
function computeLayout(n, areaX, areaY, areaW, areaH, gap) {
  const positions = [];
  if (n === 4) {
    const cardW = (areaW - gap) / 2;
    const cardH = (areaH - gap) / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        positions.push([areaX + c * (cardW + gap), areaY + r * (cardH + gap), cardW, cardH]);
      }
    }
  } else {
    const cardW = (areaW - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      positions.push([areaX + i * (cardW + gap), areaY, cardW, areaH]);
    }
  }
  return positions;
}

function SocialPostPageInner() {
  const canvasRef = useRef(null);
  const searchParams = useSearchParams();
  const preselectProductId = searchParams.get("product");
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
        const active = (json.products || []).filter((p) => p.is_active);

        // Coming from "Create Post" on a Search Amazon result — that
        // product might not be in the most-recent-10, so make sure it's
        // pulled in and pre-selected regardless of where it sorts.
        if (preselectProductId) {
          const match = active.find((p) => String(p.id) === String(preselectProductId));
          const recent = active.slice(0, 10);
          const list = match && !recent.some((p) => p.id === match.id)
            ? [match, ...recent].slice(0, 10)
            : recent;
          setProducts(list);
          setSelected(match ? [match.id] : recent.slice(0, MAX_SLOTS).map((p) => p.id));
        } else {
          const recent = active.slice(0, 10);
          setProducts(recent);
          setSelected(recent.slice(0, MAX_SLOTS).map((p) => p.id));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [preselectProductId]);

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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Light background — cream to white
      const bgGradient = ctx.createLinearGradient(0, 0, 0, SIZE);
      bgGradient.addColorStop(0, "#FAF7F2");
      bgGradient.addColorStop(1, "#FFFFFF");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Header: logo mark (aspect-ratio preserved, no more squishing) + title
      try {
        const logo = await loadImage("/logo-dirham-genie.png");
        const boxSize = 96;
        const scale = Math.min(boxSize / logo.width, boxSize / logo.height);
        const w = logo.width * scale;
        const h = logo.height * scale;
        ctx.drawImage(logo, 40 + (boxSize - w) / 2, 32 + (boxSize - h) / 2, w, h);
      } catch {
        // logo failed to load; continue without it
      }

      ctx.fillStyle = "#92400E";
      ctx.font = "bold 46px Arial";
      ctx.textBaseline = "top";
      ctx.fillText("TODAY'S BEST DEALS", 150, 55);
      ctx.fillStyle = "rgba(43,34,28,0.55)";
      ctx.font = "26px Arial";
      ctx.fillText("Dirham Genie · dirham-genie.vercel.app", 150, 108);

      // Product cards — dynamic layout, always fills the available space
      const areaX = 24, areaY = 170, areaW = SIZE - 48, areaH = SIZE - 170 - 70;
      const positions = computeLayout(chosen.length, areaX, areaY, areaW, areaH, 20);

      for (let i = 0; i < chosen.length; i++) {
        const p = chosen[i];
        const [x, y, w, h] = positions[i];

        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, x, y, w, h, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(146,64,14,0.2)";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, w, h, 20);
        ctx.stroke();

        const imgBox = Math.min(w * 0.85, h * 0.55);
        if (p.image_url) {
          try {
            const img = await loadImage(`/api/proxy-image?url=${encodeURIComponent(p.image_url)}`);
            const scale = Math.min(imgBox / img.width, imgBox / img.height) * 0.9;
            const iw = img.width * scale;
            const ih = img.height * scale;
            ctx.drawImage(img, x + (w - iw) / 2, y + 20 + (imgBox - ih) / 2, iw, ih);
          } catch {
            // image failed to load; skip
          }
        }

        const discount = discountPercent(p.price, p.list_price);
        if (discount) {
          ctx.fillStyle = "#16A34A";
          roundRect(ctx, x + 16, y + 16, 90, 40, 8);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 22px Arial";
          ctx.fillText(`-${discount}%`, x + 28, y + 26);
        }

        ctx.fillStyle = "#2B221C";
        ctx.font = `${Math.max(18, Math.min(26, w / 14))}px Arial`;
        const titleY = y + 20 + imgBox + 16;
        const titleHeight = wrapText(ctx, p.title, x + 20, titleY, w - 40, 30, 2);

        const priceY = titleY + titleHeight + 14;
        const priceText = formatAed(p.price) || "See price";

        ctx.fillStyle = "#92400E";
        ctx.font = "bold 30px Arial";
        ctx.fillText(priceText, x + 20, priceY);

        if (discount && p.list_price) {
          const priceWidth = ctx.measureText(priceText).width;
          const originalText = formatAed(p.list_price);
          const strikeX = x + 20 + priceWidth + 14;

          ctx.fillStyle = "#9CA3AF";
          ctx.font = "20px Arial";
          ctx.fillText(originalText, strikeX, priceY + 6);

          const origWidth = ctx.measureText(originalText).width;
          ctx.strokeStyle = "#9CA3AF";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(strikeX, priceY + 16);
          ctx.lineTo(strikeX + origWidth, priceY + 16);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(43,34,28,0.4)";
      ctx.font = "18px Arial";
      ctx.fillText("dirham-genie.vercel.app", areaX, SIZE - 40);

      // Caption — discount %, correct link, and social pages included
      const lines = chosen.map((p) => {
        const price = formatAed(p.price) || "See price on Amazon";
        const discount = discountPercent(p.price, p.list_price);
        const priceLine = discount
          ? `${price} (was ${formatAed(p.list_price)}) — ${discount}% OFF 🔥`
          : price;
        return `✨ ${p.title}\n💰 ${priceLine}\n🔗 ${p.affiliate_url}`;
      });
      const generatedCaption =
        `🧞‍♂️ Today's Best Deals from Dirham Genie! 🔥\n\n` +
        lines.join("\n\n") +
        `\n\n📍 Shop more: https://dirham-genie.vercel.app/\n` +
        `📲 WhatsApp deals community: https://whatsapp.com/channel/0029VbDuCjs8F2pFx9WrrQ1b\n` +
        `👍 Facebook: https://www.facebook.com/share/192L4NKNcz/\n` +
        `📸 Instagram: https://www.instagram.com/dirham_genie\n\n` +
        `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals #DealsOfTheDay`;
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
                className="flex items-center gap-3 text-sm text-cream/80 bg-white/5 rounded px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleSelect(p.id)}
                />
                {p.image_url && (
                  <img src={p.image_url} alt="" className="w-8 h-8 object-contain rounded shrink-0 bg-white" />
                )}
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
                className="rounded-md text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
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

export default function SocialPostPage() {
  return (
    <Suspense fallback={<p className="text-cream/50 text-sm">Loading...</p>}>
      <SocialPostPageInner />
    </Suspense>
  );
}