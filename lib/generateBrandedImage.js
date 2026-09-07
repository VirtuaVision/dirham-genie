// Save as: lib/generateBrandedImage.js
//
// Draws a designed social-post image from the product's own data (photo,
// title, price, discount) using your site's gold/ink theme — no Amazon
// page involved, so nothing here can hit a bot-check page or time out
// waiting on a slow external site. Used as the fallback when a live
// Amazon screenshot isn't available (see lib/postImage.js).

import "server-only";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";

const WIDTH = 1080;
const HEIGHT = 1080;
const IMAGE_AREA_HEIGHT = 780;

const COLOR_CREAM_BG = "#F5EDE1";
const COLOR_INK = "#1C1410";
const COLOR_INK_BORDER = "#3A2F26";
const COLOR_GOLD = "#D8B45C";
const COLOR_MUTED = "#8A8074";
const COLOR_BADGE_BG = "#C9302C";
const COLOR_BADGE_TEXT = "#FCEBEB";

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

export async function generateBrandedImage(product) {
  if (!product?.image_url || !product?.title) return null;

  try {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // Product photo area
    ctx.fillStyle = COLOR_CREAM_BG;
    ctx.fillRect(0, 0, WIDTH, IMAGE_AREA_HEIGHT);

    const imgRes = await fetch(product.image_url);
    if (imgRes.ok) {
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const photo = await loadImage(buffer);
      const padding = 90;
      const maxW = WIDTH - padding * 2;
      const maxH = IMAGE_AREA_HEIGHT - padding * 2;
      const scale = Math.min(maxW / photo.width, maxH / photo.height, 1);
      const drawW = photo.width * scale;
      const drawH = photo.height * scale;
      const dx = (WIDTH - drawW) / 2;
      const dy = (IMAGE_AREA_HEIGHT - drawH) / 2;
      ctx.drawImage(photo, dx, dy, drawW, drawH);
    }

    // Discount badge
    const discount = discountPercent(product.price, product.list_price);
    if (discount) {
      const badgeText = `-${discount}% off`;
      ctx.font = "bold 34px sans-serif";
      const textWidth = ctx.measureText(badgeText).width;
      const badgeW = textWidth + 48;
      const badgeH = 62;
      const bx = 40;
      const by = 40;
      ctx.fillStyle = COLOR_BADGE_BG;
      ctx.beginPath();
      ctx.roundRect(bx, by, badgeW, badgeH, 8);
      ctx.fill();
      ctx.fillStyle = COLOR_BADGE_TEXT;
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, bx + 24, by + badgeH / 2 + 2);
    }

    // Bottom info band
    ctx.fillStyle = COLOR_INK;
    ctx.fillRect(0, IMAGE_AREA_HEIGHT, WIDTH, HEIGHT - IMAGE_AREA_HEIGHT);

    const padX = 56;
    let cursorY = IMAGE_AREA_HEIGHT + 60;

    ctx.fillStyle = "#F5EDE1";
    ctx.font = "500 40px sans-serif";
    ctx.textBaseline = "alphabetic";
    const titleLines = wrapText(ctx, truncateTitle(product.title, 70), WIDTH - padX * 2, 2);
    for (const line of titleLines) {
      ctx.fillText(line, padX, cursorY);
      cursorY += 50;
    }

    cursorY += 20;
    ctx.font = "500 56px sans-serif";
    ctx.fillStyle = COLOR_GOLD;
    const priceText = formatAed(product.price) || "See price on Amazon";
    ctx.fillText(priceText, padX, cursorY);

    if (product.list_price && product.list_price > product.price) {
      const priceWidth = ctx.measureText(priceText).width;
      ctx.font = "36px sans-serif";
      ctx.fillStyle = COLOR_MUTED;
      const originalText = formatAed(product.list_price);
      const ox = padX + priceWidth + 24;
      ctx.fillText(originalText, ox, cursorY);
      const strikeWidth = ctx.measureText(originalText).width;
      ctx.strokeStyle = COLOR_MUTED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, cursorY - 12);
      ctx.lineTo(ox + strikeWidth, cursorY - 12);
      ctx.stroke();
    }

    // Footer divider + branding
    const footerY = HEIGHT - 50;
    ctx.strokeStyle = COLOR_INK_BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, footerY - 38);
    ctx.lineTo(WIDTH - padX, footerY - 38);
    ctx.stroke();

    ctx.font = "500 30px sans-serif";
    ctx.fillStyle = COLOR_GOLD;
    ctx.fillText("Dirham Genie", padX, footerY);

    ctx.font = "26px sans-serif";
    ctx.fillStyle = COLOR_MUTED;
    const siteText = "dirham-genie.vercel.app";
    const siteWidth = ctx.measureText(siteText).width;
    ctx.fillText(siteText, WIDTH - padX - siteWidth, footerY);

    const jpegBuffer = await canvas.encode("jpeg", 90);
    const filename = `branded-${Date.now()}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from("social-posts")
      .upload(filename, jpegBuffer, { contentType: "image/jpeg", upsert: false });
    if (error) {
      console.error(`[branded-image] Supabase Storage upload failed: ${error.message}`);
      return null;
    }

    const { data } = supabaseAdmin.storage.from("social-posts").getPublicUrl(filename);
    return data.publicUrl;
  } catch (err) {
    console.error(`[branded-image] Unexpected error: ${err.message}`);
    return null;
  }
}
