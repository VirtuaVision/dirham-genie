// Save as: components/CategoryIconStrip.jsx

import Link from "next/link";

// Maps common category slugs to an icon. Anything not listed falls back to
// a generic tag icon, so this works automatically as you add categories —
// no need to configure an icon per category.
const ICON_MAP = {
  electronics: "🎧",
  fashion: "👜",
  watches: "⌚",
  "home-kitchen": "🫖",
  beauty: "💄",
  "beauty-personal-care": "💄",
  luggage: "🧳",
  toys: "🧸",
  "toys-games": "🧸",
  "sports-outdoors": "⚽",
};

export default function CategoryIconStrip({ categories }) {
  if (!categories || categories.length === 0) return null;

  const shown = categories.slice(0, 7);

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center gap-6 overflow-x-auto pb-1 scrollbar-hide">
        {shown.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="flex flex-col items-center gap-2 shrink-0 group"
          >
            <span className="w-14 h-14 rounded-full bg-ink-lighter border border-gold/20 flex items-center justify-center text-2xl group-hover:border-gold transition-colors">
              {ICON_MAP[c.slug] || "🏷️"}
            </span>
            <span className="text-xs text-cream/70 group-hover:text-gold transition-colors whitespace-nowrap">
              {c.name}
            </span>
          </Link>
        ))}
        <Link href="/category" className="flex flex-col items-center gap-2 shrink-0 group">
          <span className="w-14 h-14 rounded-full bg-ink-lighter border border-gold/20 flex items-center justify-center text-xl group-hover:border-gold transition-colors">
            ⊞
          </span>
          <span className="text-xs text-cream/70 group-hover:text-gold transition-colors">More</span>
        </Link>
      </div>
    </section>
  );
}
