"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";

const FORMATS = {
  square: { width: 1080, height: 1080, label: "Square (Feed) — 1:1" },
  story: { width: 1080, height: 1920, label: "Story (IG/FB) — 9:16" },
};
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

function drawCircularLogo(ctx, img, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const size = radius * 2;
  const scale = Math.max(size / img.width, size / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
  ctx.restore();
}

function computeLayout(n, areaX, areaY, areaW, areaH, gap, stackVertical) {
  const positions = [];
  if (n === 4) {
    const cardW = (areaW - gap) / 2;
    const cardH = (areaH - gap) / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        positions.push([areaX + c * (cardW + gap), areaY + r * (cardH + gap), cardW, cardH]);
      }
    }
  } else if (stackVertical) {
    const cardH = (areaH - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      positions.push([areaX, areaY + i * (cardH + gap), areaW, cardH]);
    }
  } else {
    const cardW = (areaW - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      positions.push([areaX + i * (cardW + gap), areaY, cardW, areaH]);
    }
  }
  return positions;
}

const CAPTION_HOOKS = [
  "🧞‍♂️ Your wish has been granted! Today's best Amazon deals from Dirham Genie:",
  "🪔 Rubbed the lamp and THIS came out. Today's top Amazon picks:",
  "🔥 Stop scrolling — these Amazon deals won't last:",
  "🧞‍♂️ The genie has spoken. Here's what's worth grabbing on Amazon today:",
  "💫 Real discounts, real prices, zero nonsense. Today's Amazon finds:",
  "🚨 Deal alert! The genie found these Amazon deals so you don't have to search:",
  "🪔 Three wishes? Nah, we found you these Amazon deals instead:",
  "✨ Today's lamp rub delivered some serious Amazon savings:",
];
const CAPTION_CTAS = [
  "Tap the link before the price changes back 👆",
  "Don't sleep on this one 😴➡️💸",
  "Link's in the post — go go go 🏃",
  "Prices on Amazon.ae change fast, grab it now ⏱️",
  "Your future self will thank you for this one 🙏",
  "The genie only grants this wish once (or until the price moves) 🧞‍♂️",
];
const CAPTION_SIGNOFFS = [
  "That's the wish for today. See you tomorrow! 🪔",
  "More wishes granted daily — stay tuned 🧞‍♂️",
  "Follow for daily deals before everyone else finds them 👀",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PLATFORM_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};
const PLATFORM_COLORS = {
  facebook: "#1877F2",
  instagram: "#C13584",
  whatsapp: "#25D366",
};

const PAGE_SIZE = 10;

function PostGeneratorCard({ title, description, products, loading, platforms, preselectProductId }) {
  const canvasRef = useRef(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState([]);
  const [rendering, setRendering] = useState(false);
  const [caption, setCaption] = useState("");
  const [format, setFormat] = useState("square");
  const [includeSocialLinks, setIncludeSocialLinks] = useState(false);
  const [error, setError] = useState(null);
  const [publishingPlatform, setPublishingPlatform] = useState(null);
  const [publishResult, setPublishResult] = useState(null);

  useEffect(() => {
    if (!preselectProductId || products.length === 0) return;
    const match = products.find((p) => String(p.id) === String(preselectProductId));
    if (match) setSelected([match.id]);
  }, [preselectProductId, products]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const allMatches = search
    ? products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    : products;
  const totalPages = Math.max(1, Math.ceil(allMatches.length / PAGE_SIZE));
  const filteredProducts = allMatches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
    setPublishResult(null);
    try {
      const chosen = products.filter((p) => selected.includes(p.id)).slice(0, MAX_SLOTS);
      if (chosen.length === 0) {
        setError("Select at least one product first.");
        return;
      }

      const canvas = canvasRef.current;
      const { width: W, height: H } = FORMATS[format];
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
      bgGradient.addColorStop(0, "#FAF7F2");
      bgGradient.addColorStop(1, "#FFFFFF");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, W, H);

      try {
        const logo = await loadImage("/logo-dirham-genie.png");
        drawCircularLogo(ctx, logo, 40 + 48, 32 + 48, 48);
      } catch {
        // logo failed to load; continue without it
      }

      ctx.fillStyle = "#92400E";
      ctx.font = "bold 40px Arial";
      ctx.textBaseline = "top";
      ctx.fillText("TODAY'S BEST AMAZON DEALS", 150, 55);
      ctx.fillStyle = "rgba(43,34,28,0.55)";
      ctx.font = "26px Arial";
      ctx.fillText("Dirham Genie · dirham-genie.vercel.app", 150, 108);

      const areaX = 24, areaY = 170, areaW = W - 48, areaH = H - 170 - 70;
      const isSpotlight = chosen.length === 1;
      const stackVertical = format === "story" && chosen.length <= 3;
      const positions = computeLayout(chosen.length, areaX, areaY, areaW, areaH, 20, stackVertical);

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

        const imgBox = isSpotlight ? Math.min(w * 0.7, h * 0.62) : Math.min(w * 0.85, h * 0.55);
        const imgTopPad = isSpotlight ? h * 0.06 : 20;
        if (p.image_url) {
          try {
            const img = await loadImage(`/api/proxy-image?url=${encodeURIComponent(p.image_url)}`);
            const scale = Math.min(imgBox / img.width, imgBox / img.height) * (isSpotlight ? 0.95 : 0.9);
            const iw = img.width * scale;
            const ih = img.height * scale;
            ctx.drawImage(img, x + (w - iw) / 2, y + imgTopPad + (imgBox - ih) / 2, iw, ih);
          } catch {
            // image failed to load; skip
          }
        }

        const discount = discountPercent(p.price, p.list_price);
        if (discount) {
          const badgeW = isSpotlight ? 150 : 108;
          const badgeH = isSpotlight ? 64 : 48;
          const badgeFont = isSpotlight ? 34 : 26;
          ctx.fillStyle = "#C0392B";
          roundRect(ctx, x + 16, y + 16, badgeW, badgeH, 10);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${badgeFont}px Arial`;
          ctx.fillText(`-${discount}%`, x + 16 + badgeW / 2 - ctx.measureText(`-${discount}%`).width / 2, y + 16 + badgeH / 2 - badgeFont / 2 + 4);
        }

        ctx.fillStyle = "#2B221C";
        const titleFontSize = isSpotlight ? 28 : Math.max(16, Math.min(22, w / 16));
        ctx.font = `${titleFontSize}px Arial`;
        const titleY = y + imgTopPad + imgBox + (isSpotlight ? 20 : 14);
        const titleLineHeight = isSpotlight ? 34 : 26;
        const titleHeight = wrapText(ctx, p.title, x + 20, titleY, w - 40, titleLineHeight, 1);

        const priceY = titleY + titleHeight + (isSpotlight ? 18 : 12);
        const priceText = formatAed(p.price) || "See price";

        ctx.fillStyle = "#92400E";
        ctx.font = `bold ${isSpotlight ? 46 : 30}px Arial`;
        ctx.fillText(priceText, x + 20, priceY);

        if (discount && p.list_price) {
          const priceWidth = ctx.measureText(priceText).width;
          const originalText = formatAed(p.list_price);
          const strikeX = x + 20 + priceWidth + (isSpotlight ? 20 : 14);
          const origFont = isSpotlight ? 28 : 20;

          ctx.fillStyle = "#9CA3AF";
          ctx.font = `${origFont}px Arial`;
          ctx.fillText(originalText, strikeX, priceY + (isSpotlight ? 10 : 6));

          const origWidth = ctx.measureText(originalText).width;
          ctx.strokeStyle = "#9CA3AF";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(strikeX, priceY + (isSpotlight ? 22 : 16));
          ctx.lineTo(strikeX + origWidth, priceY + (isSpotlight ? 22 : 16));
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(43,34,28,0.4)";
      ctx.font = "18px Arial";
      ctx.fillText("dirham-genie.vercel.app", areaX, H - 40);

      const lines = chosen.map((p) => {
        const price = formatAed(p.price) || "See price on Amazon";
        const discount = discountPercent(p.price, p.list_price);
        const priceLine = discount
          ? `${price} (was ${formatAed(p.list_price)}) — ${discount}% OFF 🔥`
          : price;
        return `✨ ${truncateTitle(p.title)}\n💰 ${priceLine}\n🔗 ${p.affiliate_url}`;
      });
      const socialLinksBlock = includeSocialLinks
        ? `📲 WhatsApp: https://whatsapp.com/channel/0029VbDuCjs8F2pFx9WrrQ1b\n` +
          `👍 Facebook: https://www.facebook.com/share/1NpqYbsc6R/\n` +
          `📸 Instagram: https://www.instagram.com/dirham_genie\n\n`
        : "";
      const generatedCaption =
        `${pickRandom(CAPTION_HOOKS)}\n\n` +
        lines.join("\n\n") +
        `\n\n${pickRandom(CAPTION_CTAS)}\n\n` +
        `📍 Shop more: https://dirham-genie.vercel.app/\n` +
        socialLinksBlock +
        `${pickRandom(CAPTION_SIGNOFFS)}\n\n` +
        `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals #DealsOfTheDay`;
      setCaption(generatedCaption);
      setSelected([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setRendering(false);
    }
  }

  function downloadImage() {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `dirham-genie-post-${format}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    link.click();
  }

  async function publishToSocial(targetPlatforms) {
    setPublishingPlatform(targetPlatforms.length === 1 ? targetPlatforms[0] : "all");
    setPublishResult(null);
    setError(null);
    try {
      const canvas = canvasRef.current;
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, caption, format, platforms: targetPlatforms }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPublishResult(json.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishingPlatform(null);
    }
  }

  function copyCaption() {
    navigator.clipboard.writeText(caption);
  }

  const showAllButton = platforms.length > 1;

  return (
    <div className="card-surface rounded-lg p-4 mb-8">
      <h2 className="font-display text-lg text-gold mb-1">{title}</h2>
      <p className="text-cream/50 text-xs mb-4">{description}</p>

      {error && (
        <p className="bg-red-50 border border-red-300 text-red-700 text-sm rounded p-3 mb-4 font-medium">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-cream/50 text-sm">Loading products...</p>
      ) : (
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <p className="text-xs text-cream/60 mb-2">Image format:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(FORMATS).map(([key, f]) => (
              <button
                key={key}
                onClick={() => setFormat(key)}
                className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                  format === key
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-gold/20 text-cream/60 hover:border-gold/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-cream/60 mb-2">
            Select up to {MAX_SLOTS} products ({selected.length}/{MAX_SLOTS} selected):
          </p>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search all ${products.length} products (or leave blank to browse recent)...`}
            className="w-full mb-2 bg-ink-lighter border border-gold/20 rounded-md px-3 py-2 text-sm text-cream/90 placeholder:text-cream/30"
          />
          <div className="grid sm:grid-cols-2 gap-2">
            {filteredProducts.length === 0 && (
              <p className="text-cream/40 text-sm sm:col-span-2">No products match that search.</p>
            )}
            {filteredProducts.map((p) => {
              const discount = discountPercent(p.price, p.list_price);
              const priceText = formatAed(p.price) || "See price";
              return (
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
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{p.title}</span>
                    <span className="block text-xs text-cream/50">
                      {priceText}
                      {discount && <span className="text-deal-green font-semibold"> · -{discount}%</span>}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-cream/60">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-gold/20 px-3 py-1.5 disabled:opacity-40 hover:border-gold/50"
            >
              ← Prev
            </button>
            <span>
              Page {page + 1} of {totalPages} ({allMatches.length} product{allMatches.length === 1 ? "" : "s"})
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border border-gold/20 px-3 py-1.5 disabled:opacity-40 hover:border-gold/50"
            >
              Next →
            </button>
          </div>

          <label className="flex items-center gap-2 mt-4 text-sm text-cream/80 cursor-pointer w-fit">
            <button
              type="button"
              role="switch"
              aria-checked={includeSocialLinks}
              onClick={() => setIncludeSocialLinks((v) => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                includeSocialLinks ? "bg-gold" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  includeSocialLinks ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            Include WhatsApp/Facebook/Instagram links in caption
          </label>

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
            <p className="text-xs text-cream/60 mb-2">Caption (edit before posting if you like):</p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
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

              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => publishToSocial([platform])}
                  disabled={publishingPlatform !== null}
                  className="rounded-md text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
                  style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                >
                  {publishingPlatform === platform ? "Posting..." : `📤 Post to ${PLATFORM_LABELS[platform]}`}
                </button>
              ))}

              {showAllButton && (
                <button
                  onClick={() => publishToSocial(platforms)}
                  disabled={publishingPlatform !== null}
                  className="rounded-md text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
                  style={{ backgroundColor: "#3B5BDB" }}
                >
                  {publishingPlatform === "all" ? "Posting..." : "📤 Post to All"}
                </button>
              )}
            </div>

            {format === "story" && platforms.includes("facebook") && (
              <p className="text-xs text-cream/50 mt-2">
                Posts as a Story to Facebook &amp; Instagram (no caption support on Stories via
                the API — your caption above is for the copy button only). WhatsApp Channel still
                gets a normal post with the full caption attached.
              </p>
            )}

            {publishResult && (
              <div className="mt-4 space-y-2 text-sm bg-white/90 rounded-md p-3 border border-gold/20">
                {["whatsapp", "facebook", "instagram"].map((platform) => {
                  const r = publishResult[platform];
                  if (!r) return null;
                  return (
                    <p
                      key={platform}
                      className={
                        r.ok
                          ? "text-green-700 font-semibold"
                          : r.skipped
                          ? "text-gray-600"
                          : "text-red-700 font-semibold"
                      }
                    >
                      {PLATFORM_LABELS[platform]}:{" "}
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

function SocialPostPageInner() {
  const searchParams = useSearchParams();
  const preselectProductId = searchParams.get("product");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((json) => {
        const active = (json.products || []).filter((p) => p.is_active);
        setProducts(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Social Post Generator</h1>
      <p className="text-cream/50 text-sm mb-6">
        Pick up to {MAX_SLOTS} products (search to find older ones), choose a format, and
        generate a ready-to-share image plus a caption with all the affiliate links included.
      </p>

      <PostGeneratorCard
        title="All Platforms"
        description="Generate once, then post to Facebook, Instagram, and WhatsApp — individually or all at once."
        products={products}
        loading={loading}
        platforms={["facebook", "instagram", "whatsapp"]}
        preselectProductId={preselectProductId}
      />

      <PostGeneratorCard
        title="Instagram Only"
        description="A separate generator just for Instagram — pick products, tweak the caption, and post there alone without touching Facebook or WhatsApp."
        products={products}
        loading={loading}
        platforms={["instagram"]}
        preselectProductId={null}
      />
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