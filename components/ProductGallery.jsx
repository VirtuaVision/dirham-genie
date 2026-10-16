"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ mainImage, additionalImages, title }) {
  const allImages = [mainImage, ...(additionalImages || [])].filter(Boolean);
  // Amazon occasionally hands back a dead image reference for one photo in
  // a listing — track which URLs failed to load so we can skip straight
  // past them instead of showing a browser broken-image icon.
  const [failedUrls, setFailedUrls] = useState(() => new Set());
  const workingImages = allImages.filter((url) => !failedUrls.has(url));
  const [active, setActive] = useState(allImages[0] || null);

  function markFailed(url) {
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev).add(url);
      return next;
    });
  }

  const activeStillWorks = active && !failedUrls.has(active);
  const displayActive = activeStillWorks ? active : workingImages[0] || null;

  if (allImages.length === 0 || !displayActive) {
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
          key={displayActive}
          src={displayActive}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-contain p-8"
          priority
          onError={() => markFailed(displayActive)}
        />
      </div>
      {workingImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {workingImages.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(url)}
              className={`shrink-0 w-16 h-16 rounded border bg-white/5 relative ${
                displayActive === url ? "border-gold" : "border-gold/20"
              }`}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-contain p-1" onError={() => markFailed(url)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}