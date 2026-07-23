// Save as: components/TripleImageBanner.jsx

import Link from "next/link";

export default function TripleImageBanner({ config = {}, priority = false }) {
  const items = [
    { image: config.image1, link: config.link1 },
    { image: config.image2, link: config.link2 },
    { image: config.image3, link: config.link3 },
  ].filter((item) => item.image);

  if (items.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.link || "/category"}
            className="block rounded-xl overflow-hidden border border-gold/20"
          >
            <img
              src={item.image}
              alt=""
              className="w-full h-auto"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}