// Save as: components/PrimePromoBanner.jsx
//
// Note: this intentionally doesn't reproduce Amazon's actual Prime logo
// artwork (that's their trademark) — it references Prime by name in plain
// text, which is fine since this is a real, accurate statement about a
// service available on Amazon.

import Link from "next/link";

export default function PrimePromoBanner({ config = {} }) {
  if (config.image) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-4">
        <Link
          href="https://www.amazon.ae/amazonprime"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block rounded-xl overflow-hidden border border-gold/20"
        >
          <img src={config.image} alt="Amazon Prime" className="w-full h-auto" />
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 p-6 md:p-8 text-white flex items-center justify-between gap-6 overflow-hidden">
        <div>
          <p className="text-xs uppercase tracking-wide text-sky-100 mb-1">Amazon Prime</p>
          <h3 className="font-display text-2xl md:text-3xl mb-2">Start your Prime journey</h3>
          <p className="text-sky-50 text-sm mb-4 max-w-md">
            Enjoy fast delivery, exclusive deals &amp; much more with Amazon Prime.
          </p>
          <Link
            href="https://www.amazon.ae/amazonprime"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-md hover:bg-sky-50 transition-colors"
          >
            Join Prime &amp; Save →
          </Link>
        </div>
        <span className="hidden md:block text-6xl opacity-90 shrink-0">📦</span>
      </div>
    </section>
  );
}
