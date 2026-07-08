export const metadata = { title: "Affiliate Disclaimer | Dirham Genie" };

export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl text-gold mb-6">Affiliate Disclaimer</h1>
      <div className="text-cream/80 space-y-5 leading-relaxed text-sm md:text-base">
        <p>
          Dirham Genie (dirhamgenie.com), operated by VirtuaVision, is a
          participant in the Amazon Services LLC Associates Program (through
          Amazon.ae), an affiliate advertising programme designed to provide a
          means for sites to earn advertising fees by advertising and linking
          to Amazon.ae and affiliated sites.
        </p>
        <p>
          <strong className="text-gold">As an Amazon Associate, we earn from
          qualifying purchases.</strong> This means that if you click on one
          of our product links and make a purchase on Amazon.ae, Dirham Genie
          may receive a small commission, at no additional cost to you. This
          helps support the running of this website.
        </p>
        <p>
          We only recommend or list products that we believe may be of
          interest or value to our readers. However, we do not guarantee the
          accuracy, completeness, or timeliness of any product information,
          pricing, or availability shown on this site. All prices, discounts,
          and product details are pulled from Amazon.ae at a point in time and
          are subject to change without notice. Always check the final price
          and details on Amazon.ae before completing your purchase.
        </p>
        <p>
          Certain content on this site, including but not limited to product
          images, titles, and pricing information, is sourced from the Amazon
          Product Advertising API and is used in accordance with Amazon&apos;s
          applicable terms and licensing agreements.
        </p>
        <p>
          Amazon, Amazon.ae, and the Amazon logo are trademarks of Amazon.com,
          Inc. or its affiliates. Dirham Genie is not endorsed by, directly
          affiliated with, maintained, authorized, or sponsored by Amazon
          beyond standard participation in its affiliate programme.
        </p>
        <p>
          If you have any questions about this disclaimer, please visit our{" "}
          <a href="/contact" className="text-gold underline">Contact page</a>.
        </p>
      </div>
    </div>
  );
}
