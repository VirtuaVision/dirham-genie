// Save as: components/CategoryBanner.jsx
//
// A generic promotional banner block — use it for a category sale, a
// seasonal campaign, a clearance push, etc. Every bit of it (image, text,
// button, and where it links to) is controlled from Page Builder, so it can
// be swapped for different sales periods without touching code.

import Link from "next/link";

export default function CategoryBanner({ config = {} }) {
  const link = config.link || "/category";
  const eyebrow = config.eyebrow || "Limited Time";
  const heading = config.heading || "This Week's Category Sale";
  const subheading =
    config.subheading || "Big discounts on your favorite categories — while stocks last.";
  const buttonText = config.buttonText || "Shop the Sale";

  const useImageStyle = config.style === "image" && config.image;

  if (useImageStyle) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-4">
        <Link
          href={link}
          className="block rounded-xl overflow-hidden border border-gold/20"
        >
          <img src={config.image} alt={heading} className="w-full h-auto" />
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 p-6 md:p-8 text-white flex items-center justify-between gap-6 overflow-hidden">
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-100 mb-1">{eyebrow}</p>
          <h3 className="font-display text-2xl md:text-3xl mb-2">{heading}</h3>
          <p className="text-amber-50 text-sm mb-4 max-w-md">{subheading}</p>
          <Link
            href={link}
            className="inline-flex items-center gap-2 bg-white text-orange-700 font-semibold text-sm px-4 py-2 rounded-md hover:bg-amber-50 transition-colors"
          >
            {buttonText} →
          </Link>
        </div>
        <span className="hidden md:block text-6xl opacity-90 shrink-0">🏷️</span>
      </div>
    </section>
  );
}