// Save as: components/SeasonalSaleBanner.jsx

import Link from "next/link";

const OCCASIONS = {
  eid: { gradient: "from-emerald-600 to-teal-700", emoji: "🌙", heading: "Eid Sale", subheading: "Celebrate with amazing discounts." },
  national_day: { gradient: "from-red-600 to-emerald-700", emoji: "🇦🇪", heading: "UAE National Day Sale", subheading: "Celebrating the UAE with special prices." },
  black_friday: { gradient: "from-gray-900 to-black", emoji: "🖤", heading: "Black Friday Sale", subheading: "The biggest deals of the year." },
  white_friday: { gradient: "from-slate-200 to-slate-400", emoji: "🤍", heading: "White Friday Sale", subheading: "Massive savings across every category." },
  ramadan: { gradient: "from-purple-700 to-indigo-800", emoji: "🕌", heading: "Ramadan Sale", subheading: "Special offers all month long." },
  new_year: { gradient: "from-amber-500 to-yellow-600", emoji: "🎉", heading: "New Year Sale", subheading: "Start the year with great deals." },
};

export default function SeasonalSaleBanner({ config = {}, priority = false }) {
  const occasion = OCCASIONS[config.theme] || OCCASIONS.black_friday;
  const textColor = config.theme === "white_friday" ? "text-gray-900" : "text-white";
  const subColor = config.theme === "white_friday" ? "text-gray-700" : "text-white/80";

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div
        className="relative rounded-xl overflow-hidden p-6 md:p-8 text-center"
        style={config.image ? {} : undefined}
      >
        {config.image ? (
          <>
            <img
              src={config.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-r ${occasion.gradient}`} />
        )}
        <div className="relative">
          <span className="text-4xl mb-2 block">{occasion.emoji}</span>
          <h3 className={`font-display text-2xl md:text-4xl mb-2 ${config.image ? "text-white" : textColor}`}>
            {config.heading || occasion.heading}
          </h3>
          <p className={`text-sm mb-5 max-w-md mx-auto ${config.image ? "text-white/85" : subColor}`}>
            {config.subheading || occasion.subheading}
          </p>
          <Link
            href={config.link || "/deals/latest"}
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            {config.buttonText || "Shop the Sale"} →
          </Link>
        </div>
      </div>
    </section>
  );
}