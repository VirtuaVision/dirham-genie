"use client";

import { useEffect } from "react";

export default function RecordView({ product }) {
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("dg_recently_viewed") || "[]");
      const snapshot = {
        id: product.id,
        title: product.title,
        slug: product.slug,
        image_url: product.image_url,
        price: product.price,
      };
      const next = [snapshot, ...list.filter((p) => p.id !== product.id)].slice(0, 10);
      localStorage.setItem("dg_recently_viewed", JSON.stringify(next));
    } catch {
      // localStorage unavailable (e.g. private browsing) — silently skip
    }
  }, [product.id]);

  return null;
}
