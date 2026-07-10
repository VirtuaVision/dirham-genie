import Link from "next/link";

const CATEGORY_ICONS = {
  electronics: "🎧",
  "home-kitchen": "🏠",
  "beauty-personal-care": "💄",
  fashion: "👗",
  "toys-games": "🧸",
  "sports-outdoors": "⚽",
};

export default function CategoryTiles({ categories }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          className="card-surface rounded-lg p-4 flex flex-col items-center gap-2 text-center hover:border-gold/50 hover:-translate-y-0.5 transition-all"
        >
          <span className="text-2xl">{CATEGORY_ICONS[c.slug] || "🛍️"}</span>
          <span className="text-xs text-cream/80 leading-tight">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}