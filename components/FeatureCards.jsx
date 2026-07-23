// Save as: components/FeatureCards.jsx

import Link from "next/link";

const CARDS = [
  {
    icon: "🏷️",
    title: "Daily Deals",
    subtitle: "New deals every day",
    href: "/deals/latest",
    accent: "bg-emerald-500/10 border-emerald-500/30",
    iconBg: "bg-emerald-500 text-white",
  },
  {
    icon: "🗂️",
    title: "Top Categories",
    subtitle: "Shop from your favorite categories",
    href: "/category",
    accent: "bg-violet-500/10 border-violet-500/30",
    iconBg: "bg-violet-500 text-white",
  },
  {
    icon: "🎁",
    title: "Limited Time Offers",
    subtitle: "Grab before it's gone!",
    href: "/deals/lightning",
    accent: "bg-orange-500/10 border-orange-500/30",
    iconBg: "bg-orange-500 text-white",
  },
];

export default function FeatureCards({ config = {} }) {
  const images = [config.card1_image, config.card2_image, config.card3_image];
  const links = [config.card1_link, config.card2_link, config.card3_link];

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARDS.map((card, i) => (
          <Link
            key={card.title}
            href={links[i] || card.href}
            className={`rounded-xl border p-5 ${card.accent} hover:brightness-105 transition-all`}
          >
            {images[i] ? (
              <img
                src={images[i]}
                alt=""
                className="w-full h-28 object-cover rounded-lg mb-3"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className={`inline-flex w-9 h-9 rounded-full items-center justify-center text-base mb-3 ${card.iconBg}`}>
                {card.icon}
              </span>
            )}
            <p className="font-display text-lg text-cream mb-1">{card.title}</p>
            <p className="text-sm text-cream/60 mb-3">{card.subtitle}</p>
            <span className="text-sm font-semibold text-gold">Explore →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}