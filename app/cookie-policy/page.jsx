export const metadata = { title: "Cookie Policy | Dirham Genie" };

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl text-gold mb-6">Cookie Policy</h1>
      <div className="text-cream/80 space-y-5 leading-relaxed text-sm md:text-base">
        <p>
          Dirham Genie (operated by VirtuaVision) uses cookies and similar
          technologies to make the site work properly and to understand how
          it&apos;s used.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device by your browser.
          They help websites remember information about your visit.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Cookies we use</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Essential cookies:</strong> keep the admin login session working securely.</li>
          <li><strong>Analytics cookies:</strong> if enabled, help us understand which deals are popular (e.g. Google Analytics).</li>
          <li><strong>Affiliate tracking:</strong> when you click through to Amazon.ae, Amazon sets its own cookies to attribute the referral to Dirham Genie.</li>
        </ul>

        <h2 className="text-gold font-semibold text-lg mt-6">Managing cookies</h2>
        <p>
          Most browsers let you block or delete cookies in their settings.
          Blocking essential cookies may affect how parts of the site work
          (such as staying logged into the admin panel).
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Third parties</h2>
        <p>
          Once you leave our site by clicking a product link, Amazon.ae&apos;s
          own cookie policy applies. We do not control cookies set on
          Amazon&apos;s domain.
        </p>
      </div>
    </div>
  );
}
