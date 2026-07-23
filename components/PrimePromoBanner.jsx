// Save as: components/PrimePromoBanner.jsx
//
// Note: this intentionally doesn't reproduce Amazon's actual Prime logo
// artwork (that's their trademark) — it references Prime by name in plain
// text, which is fine since this is a real, accurate statement about a
// service available on Amazon.

import Link from "next/link";

// Your saved Amazon Prime affiliate link — used whenever the admin leaves
// the "Link" field blank in Page Builder.
const DEFAULT_PRIME_LINK =
  "https://www.amazon.ae/prime?&linkCode=ll2&tag=dirham-genie-21&linkId=ab872be099f6946efde49aa8ec412a5d&ref_=as_li_ss_tl";

export default function PrimePromoBanner({ config = {}, priority = false }) {
  const link = config.link || DEFAULT_PRIME_LINK;
  const eyebrow = config.eyebrow || "Amazon Prime";
  const heading = config.heading || "Start your Prime journey";
  const subheading =
    config.subheading || "Enjoy fast delivery, exclusive deals & much more with Amazon Prime.";
  const buttonText = config.buttonText || "Join Prime & Save";

  const useImageStyle = config.image && config.style !== "gradient";

  if (useImageStyle) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-4">
        <Link
          href={link}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block rounded-xl overflow-hidden border border-gold/20"
        >
          <img
            src={config.image}
            alt={heading}
            className="w-full h-auto"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 p-6 md:p-8 text-white flex items-center justify-between gap-6 overflow-hidden">
        <div>
          <p className="text-xs uppercase tracking-wide text-sky-100 mb-1">{eyebrow}</p>
          <h3 className="font-display text-2xl md:text-3xl mb-2">{heading}</h3>
          <p className="text-sky-50 text-sm mb-4 max-w-md">{subheading}</p>
          <Link
            href={link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-md hover:bg-sky-50 transition-colors"
          >
            {buttonText} →
          </Link>
        </div>
        <span className="hidden md:block text-6xl opacity-90 shrink-0">📦</span>
      </div>
    </section>
  );
}