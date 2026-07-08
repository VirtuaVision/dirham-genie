"use client";

import { useEffect, useState } from "react";

function readCompare() {
  try {
    return JSON.parse(localStorage.getItem("dg_compare") || "[]");
  } catch {
    return [];
  }
}

function writeCompare(list) {
  localStorage.setItem("dg_compare", JSON.stringify(list));
}

export default function CompareButton({ product }) {
  const [added, setAdded] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const list = readCompare();
    setAdded(list.some((p) => p.id === product.id));
    setFull(list.length >= 4);
  }, [product.id]);

  function toggle() {
    const list = readCompare();
    const exists = list.some((p) => p.id === product.id);
    if (!exists && list.length >= 4) {
      alert("You can compare up to 4 products at a time. Remove one first.");
      return;
    }
    const next = exists
      ? list.filter((p) => p.id !== product.id)
      : [
          ...list,
          {
            id: product.id,
            title: product.title,
            slug: product.slug,
            image_url: product.image_url,
            price: product.price,
            list_price: product.list_price,
            rating: product.rating,
            review_count: product.review_count,
            brand: product.brand,
          },
        ];
    writeCompare(next);
    setAdded(!exists);
    setFull(next.length >= 4);
  }

  return (
    <button
      onClick={toggle}
      disabled={!added && full}
      className={`rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 ${
        added
          ? "border-gold bg-gold/15 text-gold"
          : "border-gold/30 text-cream/70 hover:border-gold hover:text-gold"
      }`}
    >
      {added ? "✓ Added to Compare" : "+ Add to Compare"}
    </button>
  );
}
