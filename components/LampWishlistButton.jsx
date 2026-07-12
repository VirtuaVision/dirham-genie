"use client";

import { useEffect, useState } from "react";

function readWishlist() {
  try {
    return JSON.parse(localStorage.getItem("dg_wishlist") || "[]");
  } catch {
    return [];
  }
}
function writeWishlist(list) {
  localStorage.setItem("dg_wishlist", JSON.stringify(list));
}

export default function LampWishlistButton({ product }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readWishlist().some((p) => p.id === product.id));
  }, [product.id]);

  function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    const list = readWishlist();
    const exists = list.some((p) => p.id === product.id);
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
            affiliate_url: product.affiliate_url,
          },
        ];
    writeWishlist(next);
    setSaved(!exists);
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      title={saved ? "Saved to wishlist" : "Save to wishlist"}
      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-110 active:scale-95 ${
        saved
          ? "bg-gold/15 border-gold"
          : "bg-white border-gold/30 hover:border-gold"
      }`}
    >
      <img src="/lamp-icon-gold.png" alt="" className="w-6 h-auto" />
    </button>
  );
}