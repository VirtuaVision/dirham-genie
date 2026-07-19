// Save as: components/BrandSpotlightBanner.jsx

import Link from "next/link";

export default function BrandSpotlightBanner({ config = {} }) {
  const useImageStyle = config.image && config.style !== "gradient";

  if (useImageStyle) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-4">
        <Link href={config.link || "/category"} className="block rounded-xl overflow-hidden border border-gold/20">
          <img src={config.image} alt={config.heading || "Brand spotlight"} className="w-full h-auto" />
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 border border-gold/20 p-6 md:p-8 text-white flex items-center gap-6">
        {config.brandLogo && (
          <img src={config.brandLogo} alt="" className="w-16 h-16 rounded-lg object-contain bg-white/10 p-2 shrink-0" />
        )}
        <div>
          <h3 className="font-display text-2xl md:text-3xl mb-2">{config.heading || "Brand Spotlight"}</h3>
          <p className="text-white/70 text-sm mb-4 max-w-md">
            {config.subheading || "This week's featured brand — top picks, best prices."}
          </p>
          <Link
            href={config.link || "/category"}
            className="inline-flex items-center gap-2 bg-gold text-ink font-semibold text-sm px-4 py-2 rounded-md hover:bg-gold-bright transition-colors"
          >
            {config.buttonText || "Shop the Brand"} →
          </Link>
        </div>
      </div>
    </section>
  );
}