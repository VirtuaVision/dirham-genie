// Save as: components/BannerStrip.jsx
//
// Renders your active homepage banners (managed in Admin -> Banners).
// This didn't exist before — banners could be created in the admin panel
// but nothing on the public site displayed them until now.

import Link from "next/link";
import Image from "next/image";

export default function BannerStrip({ banners }) {
  if (!banners || banners.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className={`grid gap-4 ${banners.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {banners.map((b) => (
          <Link
            key={b.id}
            href={b.link_url || "#"}
            className="relative rounded-lg overflow-hidden border border-gold/20 block group"
          >
            {b.image_url ? (
              <div className="relative aspect-[3/1]">
                <Image
                  src={b.image_url}
                  alt={b.title || ""}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : null}
            {(b.title || b.subtitle) && (
              <div className="p-4 bg-ink">
                {b.title && <p className="text-gold font-display text-lg">{b.title}</p>}
                {b.subtitle && <p className="text-cream/60 text-sm">{b.subtitle}</p>}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
