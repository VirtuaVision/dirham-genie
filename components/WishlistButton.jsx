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

export default function WishlistButton({ product }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const list = readWishlist();
    setSaved(list.some((p) => p.id === product.id));
  }, [product.id]);

  function toggle() {
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
      className={`rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
        saved
          ? "border-gold bg-gold/15 text-gold"
          : "border-gold/30 text-cream/70 hover:border-gold hover:text-gold"
      }`}
    >
      {saved ? "♥ Saved to Wishlist" : "♡ Add to Wishlist"}
    </button>
  );
}
