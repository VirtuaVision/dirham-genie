"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatAed } from "@/lib/formatCurrency";

export default function WishlistPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("dg_wishlist") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  function remove(id) {
    const next = items.filter((p) => p.id !== id);
    setItems(next);
    localStorage.setItem("dg_wishlist", JSON.stringify(next));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">Your Wishlist</h1>
      <p className="text-cream/60 text-sm mb-8">
        Saved on this device only &mdash; no account needed.
      </p>

      {items.length === 0 ? (
        <p className="text-cream/50 text-sm">
          Nothing saved yet. Tap &quot;Add to Wishlist&quot; on any product page.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="card-surface rounded-lg p-3 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 bg-white/5 rounded">
                {p.image_url && (
                  <Image src={p.image_url} alt={p.title} fill sizes="64px" className="object-contain p-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${p.slug}`} className="text-sm text-cream/90 hover:text-gold line-clamp-2">
                  {p.title}
                </Link>
                <p className="font-mono text-gold text-sm mt-1">{formatAed(p.price) || "See price"}</p>
              </div>
              <button
                onClick={() => remove(p.id)}
                className="text-xs px-2 py-1 rounded bg-white/5 text-cream/70 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
