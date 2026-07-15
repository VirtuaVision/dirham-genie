// Save as: components/TrendingCarousel.jsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAed } from "@/lib/formatCurrency";

export default function TrendingCarousel({ products }) {
  const [index, setIndex] = useState(0);
  if (!products || products.length === 0) return null;

  const slide = products[index % products.length];

  function prev() {
    setIndex((i) => (i - 1 + products.length) % products.length);
  }
  function next() {
    setIndex((i) => (i + 1) % products.length);
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="relative rounded-xl bg-gradient-to-br from-gold/10 via-ink-lighter to-gold/5 border border-gold/20 p-6 md:p-10 overflow-hidden">
        <div className="flex items-center justify-between gap-6">
          {products.length > 1 && (
            <button
              onClick={prev}
              aria-label="Previous"
              className="w-9 h-9 rounded-full bg-ink/60 text-cream flex items-center justify-center shrink-0 hover:bg-gold hover:text-ink transition-colors"
            >
              ‹
            </button>
          )}

          <div className="flex-1 flex items-center justify-between gap-6 min-w-0">
            <div className="min-w-0">
              <h3 className="font-display text-2xl md:text-3xl mb-2">
                Trending <span className="gold-gradient-text">Finds</span> You&apos;ll Love
              </h3>
              <p className="text-cream/60 text-sm mb-4 max-w-sm">
                Handpicked bestsellers from Amazon.ae — right now, {slide.title} is{" "}
                {formatAed(slide.price) || "a great deal"}.
              </p>
              <Link
                href={`/product/${slide.slug}`}
                className="inline-flex items-center gap-2 bg-ink text-gold border border-gold/40 font-semibold text-sm px-4 py-2 rounded-md hover:bg-gold hover:text-ink transition-colors"
              >
                Shop Now →
              </Link>
            </div>

            {slide.image_url && (
              <img
                src={slide.image_url}
                alt={slide.title}
                className="hidden sm:block w-32 h-32 md:w-44 md:h-44 object-contain shrink-0"
              />
            )}
          </div>

          {products.length > 1 && (
            <button
              onClick={next}
              aria-label="Next"
              className="w-9 h-9 rounded-full bg-ink/60 text-cream flex items-center justify-center shrink-0 hover:bg-gold hover:text-ink transition-colors"
            >
              ›
            </button>
          )}
        </div>

        {products.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-6">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-gold" : "w-1.5 bg-cream/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
