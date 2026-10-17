"use client";

import { useState } from "react";

// Amazon product photos are plain <img>, not next/image, on purpose:
// Vercel's image-optimization step occasionally fails on a perfectly valid
// Amazon photo (timeout / format quirk on their end), which otherwise shows
// as a broken image even though the photo itself loads fine everywhere
// else (admin previews, direct links, etc all use plain <img> already).
// Amazon's own CDN already serves an appropriately-sized file via the
// _SLnnn_ part of the URL, so there's little optimization upside anyway.
export default function ProductGallery({ mainImage, additionalImages, title }) {
  const allImages = [mainImage, ...(additionalImages || [])].filter(Boolean);
  // Still guard against a genuinely dead Amazon image reference (does
  // happen occasionally) — track which URLs actually fail to load so we
  // can skip past them instead of showing a browser broken-image icon.
  const [failedUrls, setFailedUrls] = useState(() => new Set());
  const workingImages = allImages.filter((url) => !failedUrls.has(url));
  const [active, setActive] = useState(allImages[0] || null);

  function markFailed(url) {
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev;
      return new Set(prev).add(url);
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
        <img
          key={displayActive}
          src={displayActive}
          alt={title}
          className="absolute inset-0 w-full h-full object-contain p-8"
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
              <img
                src={url}
                alt=""
                className="absolute inset-0 w-full h-full object-contain p-1"
                onError={() => markFailed(url)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
