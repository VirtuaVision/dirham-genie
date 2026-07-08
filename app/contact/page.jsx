export const metadata = { title: "Contact | Dirham Genie" };

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl text-gold mb-6">Contact Us</h1>
      <p className="text-cream/80 leading-relaxed text-sm md:text-base mb-6">
        Have a question, a product suggestion, or found an incorrect price?
        We&apos;d love to hear from you.
      </p>
      <div className="card-surface rounded-lg p-6 text-cream/80 text-sm space-y-2">
        <p><span className="text-gold">Email:</span> hello@dirhamgenie.com</p>
        <p><span className="text-gold">Company:</span> VirtuaVision</p>
        <p><span className="text-gold">Based in:</span> United Arab Emirates</p>
      </div>
      <p className="text-cream/40 text-xs mt-6">
        Tip: replace the email above with your real support address once the
        site is live.
      </p>
    </div>
  );
}
