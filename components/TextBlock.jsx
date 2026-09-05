// Save as: components/TextBlock.jsx
//
// Simple heading + paragraph block for announcements/promos, with an
// optional image. Configured entirely from Page Builder.

import Image from "next/image";

export default function TextBlock({ config = {} }) {
  if (!config.heading && !config.body && !config.image) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="card-surface rounded-lg p-6 md:p-8">
        {config.image && (
          <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden mb-6">
            <Image
              src={config.image}
              alt={config.heading || ""}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        )}
        {config.heading && (
          <h2 className="font-display text-2xl text-gold mb-3">{config.heading}</h2>
        )}
        {config.body && (
          <p className="text-cream/70 whitespace-pre-line leading-relaxed">{config.body}</p>
        )}
      </div>
    </section>
  );
}
