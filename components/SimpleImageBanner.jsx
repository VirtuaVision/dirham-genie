import Link from "next/link";

export default function SimpleImageBanner({ config = {}, priority = false }) {
  if (!config.image) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <Link href={config.link || "/deals/latest"} className="block rounded-xl overflow-hidden border border-gold/20">
        <img
          src={config.image}
          alt={config.altText || "Promotional banner"}
          className="w-full h-auto"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      </Link>
    </section>
  );
}