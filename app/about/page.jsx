export const metadata = { title: "About Us | Dirham Genie" };

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14 prose-invert">
      <h1 className="font-display text-3xl text-gold mb-6">About Dirham Genie</h1>
      <div className="text-cream/80 space-y-4 leading-relaxed text-sm md:text-base">
        <p>
          Dirham Genie is a UAE-focused deals publisher built by VirtuaVision.
          Our mission is simple: cut through the noise of Amazon.ae and surface
          genuinely good prices, so shoppers in the UAE save real dirhams on
          things they actually want to buy.
        </p>
        <p>
          We curate products manually and, where available, use Amazon&apos;s
          own Product Advertising API to keep prices and details up to date.
          Every product on this site links out to Amazon.ae through our
          affiliate tracking link.
        </p>
        <p>
          Dirham Genie is a participant in the Amazon Services LLC Associates
          Program, an affiliate advertising programme designed to provide a
          means for sites to earn advertising fees by advertising and linking
          to Amazon.ae. Read our full{" "}
          <a href="/disclaimer" className="text-gold underline">
            affiliate disclaimer
          </a>{" "}
          for details.
        </p>
        <p>
          Dirham Genie is an independent site and is not affiliated with,
          endorsed by, or sponsored by Amazon, beyond our participation in its
          affiliate programme.
        </p>
      </div>
    </div>
  );
}
