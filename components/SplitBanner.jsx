// Save as: components/SplitBanner.jsx

import Link from "next/link";

function Half({ image, heading, link }) {
  return (
    <Link
      href={link || "/category"}
      className="relative flex-1 rounded-xl overflow-hidden border border-gold/20 min-h-[160px] bg-ink-lighter block"
    >
      {image && <img src={image} alt={heading || ""} className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      {heading && (
        <p className="absolute bottom-4 left-4 right-4 text-white font-display text-xl">{heading}</p>
      )}
    </Link>
  );
}

export default function SplitBanner({ config = {} }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Half image={config.leftImage} heading={config.leftHeading} link={config.leftLink} />
        <Half image={config.rightImage} heading={config.rightHeading} link={config.rightLink} />
      </div>
    </section>
  );
}