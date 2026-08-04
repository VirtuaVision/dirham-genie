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

// Fills n cards into one row (n=1,2,3) or a 2x2 grid (n=4), always using
// the full available area — no empty cells regardless of how many are picked.
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

// Rotating caption ingredients — picked randomly each time generate() runs
// so posts don't all read like the same template copy-pasted with new
// prices. Swapped in and out of the same reliable structure (hook, per-
// product lines, CTA, hashtags) rather than randomizing structure itself.
const CAPTION_HOOKS = [
  "🧞‍♂️ Your wish has been granted! Today's best deals from Dirham Genie:",
  "🪔 Rubbed the lamp and THIS came out. Today's top picks:",
  "🔥 Stop scrolling — these deals won't last:",
  "🧞‍♂️ The genie has spoken. Here's what's worth grabbing today:",
  "💫 Real discounts, real prices, zero nonsense. Today's finds:",
  "🚨 Deal alert! The genie found these so you don't have to search:",
  "🪔 Three wishes? Nah, we found you these instead:",
  "✨ Today's lamp rub delivered some serious savings:",
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

function SocialPostPageInner() {
  const canvasRef = useRef(null);
  const searchParams = useSearchParams();
  const preselectProductId = searchParams.get("product");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [caption, setCaption] = useState("");
  const [format, setFormat] = useState("square");
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((json) => {
        const active = (json.products || []).filter((p) => p.is_active);
        setProducts(active);

        // Coming from "Create Post" on a Search Amazon result — pre-select
        // that specific product regardless of where it sorts.
        if (preselectProductId) {
          const match = active.find((p) => String(p.id) === String(preselectProductId));
          setSelected(match ? [match.id] : active.slice(0, MAX_SLOTS).map((p) => p.id));
        } else {
          setSelected(active.slice(0, MAX_SLOTS).map((p) => p.id));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [preselectProductId]);

  const filteredProducts = search
    ? products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    : products.slice(0, 10); // no search yet — just show the 10 most recent to start

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
      const { width: W, height: H } = FORMATS[format];
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Light background — cream to white
      const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
      bgGradient.addColorStop(0, "#FAF7F2");
      bgGradient.addColorStop(1, "#FFFFFF");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, W, H);

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

        // A single product gets a "spotlight" treatment — the image fills
        // most of the card instead of sitting small in a sea of white
        // space, and text scales up to match.
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
          // Bigger, bolder badge — was easy to miss before, especially at
          // a glance while scrolling a feed.
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
        const titleFontSize = isSpotlight ? 34 : Math.max(18, Math.min(26, w / 14));
        ctx.font = `${titleFontSize}px Arial`;
        const titleY = y + imgTopPad + imgBox + (isSpotlight ? 24 : 16);
        const titleLineHeight = isSpotlight ? 42 : 30;
        const titleHeight = wrapText(ctx, p.title, x + 20, titleY, w - 40, titleLineHeight, isSpotlight ? 3 : 2);

        const priceY = titleY + titleHeight + (isSpotlight ? 20 : 14);
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
          ctx.fillText(originalText, stri