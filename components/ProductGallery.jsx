"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ mainImage, additionalImages, title }) {
  const allImages = [mainImage, ...(additionalImages || [])].filter(Boolean);
  const [active, setActive] = useState(allImages[0] || null);

  if (allImages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-cream/30">
        No image available
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square">
        <Image
          src={active}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-contain p-8"
          priority
        />
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {allImages.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(url)}
              className={`shrink-0 w-16 h-16 rounded border bg-white/5 relative ${
                active === url ? "border-gold" : "border-gold/20"
              }`}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}