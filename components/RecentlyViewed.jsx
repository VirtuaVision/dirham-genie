"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatAed } from "@/lib/formatCurrency";

export default function RecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("dg_recently_viewed") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="font-display text-2xl text-gold mb-4">Recently Viewed</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            className="card-surface rounded-lg p-2 w-32 shrink-0 hover:border-gold/50 transition-colors"
          >
            <div className="relative w-full aspect-square bg-white/5 rounded">
              {p.image_url && (
                <Image src={p.image_url} alt={p.title} fill sizes="128px" className="object-contain p-2" />
              )}
            </div>
            <p className="text-xs text-cream/80 mt-1 line-clamp-2">{p.title}</p>
            <p className="font-mono text-gold text-xs mt-1">{formatAed(p.price) || "—"}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
