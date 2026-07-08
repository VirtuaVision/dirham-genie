export const metadata = { title: "Terms of Use | Dirham Genie" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl text-gold mb-6">Terms of Use</h1>
      <div className="text-cream/80 space-y-5 leading-relaxed text-sm md:text-base">
        <p>
          By using dirhamgenie.com (&quot;the site&quot;), operated by
          VirtuaVision, you agree to the following terms.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Content</h2>
        <p>
          Product information, images, and prices are provided for
          informational purposes and are sourced from Amazon.ae or entered
          manually by our team. We make reasonable efforts to keep this
          information accurate but do not guarantee it. Always verify final
          pricing and details on Amazon.ae before purchasing.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">No liability</h2>
        <p>
          Dirham Genie is not responsible for any transaction, dispute,
          shipping issue, or product quality concern arising from a purchase
          made on Amazon.ae or any third-party site. Those matters are between
          you and Amazon (or the relevant seller).
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Intellectual property</h2>
        <p>
          The Dirham Genie name, logo, and original written content belong to
          VirtuaVision. Product images and trademarks belong to their
          respective owners, including Amazon.com, Inc. and its affiliates.
        </p>

        <h2 className="text-gold font-semibold text-lg mt-6">Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the
          site after changes means you accept the updated terms.
        </p>
      </div>
    </div>
  );
}
