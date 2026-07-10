"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatAed } from "@/lib/formatCurrency";
import LampIllustration from "@/components/LampIllustration";

export default function RubTheLamp({ label = "Rub the Lamp for Today's Wish" }) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  async function rubTheLamp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products/random");
      const json = await res.json();
      if (!json.product) {
        setError("The genie is still stocking the lamp \u2014 check back soon.");
      } else {
        setProduct(json.product);
      }
    } catch {
      setError("The genie is resting. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="relative">
        <span className="absolute -top-2 -left-6 text-gold animate-sparkle text-xl">✦</span>
        <span className="absolute -top-4 right-0 text-gold-bright animate-sparkle text-sm" style={{ animationDelay: "0.6s" }}>✦</span>
        <span className="absolute top-6 -right-8 text-gold animate-sparkle text-lg" style={{ animationDelay: "1.2s" }}>✦</span>
        <button
          onClick={rubTheLamp}
          disabled={loading}
          className="hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none"
          aria-label="Rub the lamp for a surprise deal"
        >
          <LampIllustration className="w-40 h-28 md:w-52 md:h-36 lamp-glow" />
        </button>
      </div>

      <button
        onClick={rubTheLamp}
        disabled={loading}
        className="rounded-full bg-gold hover:bg-gold-bright text-ink font-semibold px-6 py-2.5 text-sm transition-colors disabled:opacity-60"
      >
        {loading ? "Summoning a deal..." : label}
      </button>

      {error && <p className="text-cream/60 text-sm max-w-sm">{error}</p>}

      {product && (
        <div className="card-surface rounded-lg p-4 flex items-center gap-4 max-w-md text-left animate-[fadeIn_0.3s_ease]">
          {product.image_url && (
            <div className="relative w-20 h-20 shrink-0 bg-white/5 rounded">
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                sizes="80px"
                className="object-contain p-1"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-cream/90 line-clamp-2">{product.title}</p>
            <p className="font-mono text-gold font-semibold mt-1">
              {formatAed(product.price) || "See price on Amazon"}
            </p>
            <Link
              href={`/product/${product.slug}`}
              className="text-xs text-gold underline underline-offset-2 hover:text-gold-bright"
            >
              View this wish &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}