export const metadata = { title: "DMCA / Content Policy | Dirham Genie" };

export default function DmcaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl text-gold mb-6">DMCA &amp; Content Policy</h1>
      <div className="text-cream/80 space-y-5 leading-relaxed text-sm md:text-base">
        <p>
          Dirham Genie (operated by VirtuaVision) respects the intellectual
          property rights of others and expects users of our site to do the
          same.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Product content</h2>
        <p>
          Product images, titles, and descriptions displayed on Dirham Genie
          are sourced either from the Amazon Product Advertising API (used
          under Amazon&apos;s licensing terms) or entered manually by our team
          based on publicly available listing information.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Filing a takedown notice</h2>
        <p>
          If you believe content on this site infringes your copyright or
          trademark, please contact us via our{" "}
          <a href="/contact" className="text-gold underline">Contact page</a>{" "}
          with:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>A description of the copyrighted work you believe is being infringed</li>
          <li>The URL(s) on our site where the material appears</li>
          <li>Your contact information</li>
          <li>A statement that you have a good-faith belief the use is unauthorised</li>
        </ul>
        <p>
          We will review and respond to legitimate requests promptly, and
          remove or correct content as appropriate.
        </p>
      </div>
    </div>
  );
}
