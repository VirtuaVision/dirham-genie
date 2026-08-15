"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";

const FORMATS = {
  square: { width: 1080, height: 1080, label: "Square (Feed) — 1:1" },
  story: { width: 1080, height: 1920, label: "Story (IG/FB) — 9:16" },
};
const MAX_SLOTS = 2;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Amazon product photos (especially secondary/lifestyle shots) often have a
// lot of built-in white padding around the actual product. This scans the
// image's edges and returns a source-rectangle {sx, sy, sw, sh} that trims
// that blank border, so the product fills the frame instead of looking
// small inside empty space. Falls back to the full image if anything goes
// wrong (e.g. a tainted canvas).
function cropWhitespace(img, tolerance = 14) {
  const fallback = { sx: 0, sy: 0, sw: img.width, sh: img.height };
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const w = canvas.width, h = canvas.height;

    const isBg = (i) => {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 10) return true;
      return r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance;
    };

    let top = 0, bottom = h - 1, left = 0, right = w - 1;

    topLoop: for (; top < h; top++) {
      for (let x = 0; x < w; x++) {
        if (!isBg((top * w + x) * 4)) break topLoop;
      }
    }
    bottomLoop: for (; bottom > top; bottom--) {
      for (let x = 0; x < w; x++) {
        if (!isBg((bottom * w + x) * 4)) break bottomLoop;
      }
    }
    leftLoop: for (; left < w; left++) {
      for (let y = top; y <= bottom; y++) {
        if (!isBg((y * w + left) * 4)) break leftLoop;
      }
    }
    rightLoop: for (; right > left; right--) {
      for (let y = top; y <= bottom; y++) {
        if (!isBg((y * w + right) * 4)) break rightLoop;
      }
    }

    const trimmedW = right - left + 1;
    const trimmedH = bottom - top + 1;
    if (trimmedW <= 0 || trimmedH <= 0) return fallback;

    // Add a little breathing room back so the product doesn't touch the edge
    const padX = trimmedW * 0.06;
    const padY = trimmedH * 0.06;
    const sx = Math.max(0, left - padX);
    const sy = Math.max(0, top - padY);
    const sw = Math.min(w - sx, trimmedW + padX * 2);
    const sh = Math.min(h - sy, trimmedH + padY * 2);

    return { sx, sy, sw, sh };
  } catch {
    return fallback;
  }
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
    let tru