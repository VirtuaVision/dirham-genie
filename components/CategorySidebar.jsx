import Link from "next/link";

const CATEGORY_ICONS = {
  "genies-choice": "🧞",
  "mega-deals": "🔥",
  electronics: "🎧",
  "home-kitchen": "🏠",
  "beauty-personal-care": "💄",
  fashion: "👗",
  "toys-games": "🧸",
  "sports-outdoors": "⚽",
};

// Distinct pastel background per category, matching the varied palette in
// the reference design instead of one repeated accent color.
const CATEGORY_COLORS = {
  "genies-choice": "bg-emerald-100 text-emerald-700",
  "mega-deals": "bg-orange-100 text-orange-700",
  electronics: "bg-sky-100 text-sky-700",
  "home-kitchen": "bg-rose-100 text-rose-700",
  "beauty-personal-care": "bg-pink-100 text-pink-700",
  fashion: "bg-blue-100 text-blue-700",
  "toys-games": "bg-amber-100 text-amber-700",
  "sports-outdoors": "bg-slate-100 text-slate-700",
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
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${CATEGORY_COLORS[c.slug] || "bg-gold/15 text-gold"}`}>
              {CATEGORY_ICONS[c.slug] || "🛍️"}
            </span>
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
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${CATEGORY_COLORS[c.slug] || "bg-gold/15 text-gold"}`}>
              {CATEGORY_ICONS[c.slug] || "🛍️"}
            </span>
            {c.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}