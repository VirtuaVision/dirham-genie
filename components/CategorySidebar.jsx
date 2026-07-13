import Link from "next/link";

const CATEGORY_ICONS = {
  electronics: "🎧",
  "home-kitchen": "🏠",
  "beauty-personal-care": "💄",
  fashion: "👗",
  "toys-games": "🧸",
  "sports-outdoors": "⚽",
};

export default function CategorySidebar({ categories }) {
  return (
    <aside className="md:w-52 shrink-0">
      <h2 className="font-display text-lg text-gold mb-3">Shop by Category</h2>

      <div className="flex md:hidden gap-2 overflow-x-auto pb-2 mb-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="shrink-0 card-surface rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-cream/80 hover:border-gold/50 transition-colors"
          >
            <span>{CATEGORY_ICONS[c.slug] || "🛍️"}</span>
            {c.name}
          </Link>
        ))}
      </div>

      <nav className="hidden md:flex flex-col gap-1">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-cream/80 hover:bg-ink-lighter hover:text-gold transition-colors"
          >
            <span className="text-lg">{CATEGORY_ICONS[c.slug] || "🛍️"}</span>
            {c.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}