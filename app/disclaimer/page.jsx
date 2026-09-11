export const metadata = { title: "Affiliate & Content Disclosures | Dirham Genie" };

const LAST_UPDATED = "September 11, 2026";

function Section({ icon, title, children }) {
  return (
    <div className="rounded-xl border border-gold/25 bg-ink-light/40 px-5 py-6 md:px-7 md:py-7">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-11 h-11 shrink-0 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-xl">
          {icon}
        </div>
        <h2 className="font-display text-xl text-gold pt-1.5">{title}</h2>
      </div>
      <div className="text-cream/75 space-y-4 leading-relaxed text-sm md:text-base">
        {children}
      </div>
    </div>
  );
}

export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-3xl">
          🛡️
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-gold mb-3">
          Affiliate &amp; Content Disclosures
        </h1>
        <p className="text-cream/50 text-sm mb-5">Last updated: {LAST_UPDATED}</p>
        <p className="text-cream/70 leading-relaxed max-w-xl mx-auto">
          At Dirham Genie, our goal is to help UAE shoppers discover useful
          Amazon.ae deals and make more informed buying decisions. This page
          explains how we earn commissions, use Amazon-sourced content,
          write our own material, and use AI-assisted tools along the way.
        </p>
      </div>

      <div className="space-y-6">
        <Section icon="🔗" title="Amazon Associates Program">
          <p>
            <strong className="text-gold">Affiliate Disclosure:</strong> As
            an Amazon Associate, Dirham Genie earns from qualifying
            purchases.
          </p>
          <p>
            Dirham Genie (dirhamgenie.com), operated by VirtuaVision, is a
            participant in the Amazon Services LLC Associates Program
            (through Amazon.ae), an affiliate advertising programme designed
            to provide a means for sites to earn advertising fees by
            advertising and linking to Amazon.ae. Purchases made through our
            links are at no extra cost to you. Prices and availability are
            set by Amazon and may change — please verify the final price on
            Amazon.ae before purchasing.
          </p>
        </Section>

        <Section icon="🖼️" title="Amazon Program Content">
          <p>
            Product pages on this site display images, titles, prices, and
            other details sourced from Amazon through the Amazon Associates
            Program API.
          </p>
          <p className="uppercase text-xs tracking-wide text-cream/50">
            Certain content that appears on this site comes from Amazon.
            This content is provided &quot;as is&quot; and is subject to
            change or removal at any time.
          </p>
          <p>
            Each product page also shows roughly how long ago its price was
            last checked, since Amazon.ae prices can change between our last
            check and your visit — always confirm the current price on
            Amazon.ae before buying.
          </p>
        </Section>

        <Section icon="📝" title="Editorial Content & Reviews">
          <p>
            Affiliate relationships do not determine our picks: our goal is
            to help you find deals and products that may be useful for your
            needs. Product highlights, categories, and coupon write-ups on
            this site are for general informational purposes.
          </p>
          <p>
            We do not personally test or physically handle the products
            listed on Dirham Genie. Descriptions, specifications, and
            highlights shown on product pages are drawn from the
            manufacturer&apos;s or Amazon&apos;s own listing content, not
            from hands-on review, unless explicitly stated otherwise.
          </p>
        </Section>

        <Section icon="✨" title="Use of AI Assistance">
          <p>
            Dirham Genie uses AI-assisted tools to help with parts of the
            site — for example, generating short coupon/discount summaries
            and suggesting a product category based on Amazon&apos;s
            listing data. These outputs are generated automatically and are
            not individually fact-checked by a person before publishing.
          </p>
          <p>
            Content is intended for general informational and product
            discovery purposes. Please always verify important details —
            price, specifications, seller, and availability — directly on
            Amazon.ae before purchasing.
          </p>
        </Section>

        <Section icon="🔄" title="Accuracy and Updates">
          <p>
            We work to keep listings on Dirham Genie useful and up to date.
            However, product details, pricing, discounts, coupon codes, and
            availability are all controlled by Amazon and third-party
            sellers, and can change at any time without notice.
          </p>
          <p>
            If you notice inaccurate information or have questions about our
            content, please{" "}
            <a href="/contact" className="text-gold underline">contact us</a>.
            You can also read our{" "}
            <a href="/terms" className="text-gold underline">Terms of Use</a>
            {" "}and{" "}
            <a href="/privacy" className="text-gold underline">Privacy Policy</a>.
          </p>
        </Section>

        <p className="text-cream/50 text-xs text-center pt-2">
          Amazon, Amazon.ae, and the Amazon logo are trademarks of
          Amazon.com, Inc. or its affiliates. Dirham Genie is an independent
          deals publisher and is not endorsed by, directly affiliated with,
          maintained, authorized, or sponsored by Amazon beyond standard
          participation in its affiliate programme.
        </p>
      </div>
    </div>
  );
}
