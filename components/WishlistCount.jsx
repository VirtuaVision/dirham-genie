// Save as: components/WishlistCount.jsx
//
// Small badge that shows how many items are saved to the wishlist, so
// the heart icon in the header feels functional instead of decorative.
// Updates instantly when items are added/removed via the
// "wishlist-updated" event dispatched by WishlistButton and the
// wishlist page.

"use client";

import { useEffect, useState } from "react";

function readCount() {
  try {
    return JSON.parse(localStorage.getItem("dg_wishlist") || "[]").length;
  } catch {
    return 0;
  }
}

export default function WishlistCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readCount());

    const onChange = () => setCount(readCount());
    window.addEventListener("wishlist-updated", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("wishlist-updated", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-[3px] rounded-full bg-gold text-ink text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}
