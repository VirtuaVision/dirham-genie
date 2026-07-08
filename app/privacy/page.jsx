export const metadata = { title: "Privacy Policy | Dirham Genie" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl text-gold mb-6">Privacy Policy</h1>
      <div className="text-cream/80 space-y-5 leading-relaxed text-sm md:text-base">
        <p>
          This Privacy Policy explains how Dirham Genie (&quot;we&quot;,
          &quot;us&quot;), operated by VirtuaVision, handles information when
          you visit dirhamgenie.com.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Information we collect</h2>
        <p>
          We do not require visitors to create an account or submit personal
          information to browse deals. We may automatically collect basic,
          non-identifying technical data such as browser type, device type,
          and pages visited, through standard analytics tools, to understand
          how our site is used and to improve it.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Cookies</h2>
        <p>
          Our site, and Amazon.ae once you click through to it, may use
          cookies. Amazon and other third parties may use cookies to serve
          relevant ads and track affiliate referrals. We do not control
          Amazon&apos;s cookies once you leave our site.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Affiliate links</h2>
        <p>
          Product links on this site are affiliate links to Amazon.ae. When
          you click through and make a purchase, Amazon may track that the
          referral came from Dirham Genie in order to credit us a commission.
          See our{" "}
          <a href="/disclaimer" className="text-gold underline">
            Affiliate Disclaimer
          </a>{" "}
          for more detail.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Contact us</h2>
        <p>
          If you have questions about this policy, please reach out via our{" "}
          <a href="/contact" className="text-gold underline">Contact page</a>.
        </p>

        <p className="text-cream/50 text-xs">
          Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
