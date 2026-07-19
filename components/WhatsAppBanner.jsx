import Link from "next/link";

export default function WhatsAppBanner({ config = {} }) {
  const useImageStyle = config.image && config.style !== "gradient";
  const link = config.whatsappLink || "#";

  if (useImageStyle) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-4">
        <Link href={link} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-gold/20">
          <img src={config.image} alt={config.heading || "WhatsApp"} className="w-full h-auto" />
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 p-6 md:p-8 text-white flex items-center justify-between gap-6 overflow-hidden">
        <div>
          <h3 className="font-display text-2xl md:text-3xl mb-2">{config.heading || "Never Miss a Deal Again"}</h3>
          <p className="text-emerald-50 text-sm mb-4 max-w-md">
            {config.subheading || "Join our WhatsApp channel for instant deal alerts."}
          </p>
          <Link
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold text-sm px-4 py-2 rounded-md hover:bg-emerald-50 transition-colors"
          >
            {config.buttonText || "Join on WhatsApp"} →
          </Link>
        </div>
        <span className="hidden md:block text-6xl opacity-90 shrink-0">💬</span>
      </div>
    </section>
  );
}