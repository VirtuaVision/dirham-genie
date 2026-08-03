import Link from "next/link";

export default function WhatsAppBanner({ config = {} }) {
  const useImageStyle = config.image && config.style !== "gradient";
  const link = config.whatsappLink || "#";

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="relative rounded-xl overflow-hidden p-6 md:p-8 text-white flex items-center justify-between gap-6 flex-wrap">
        {useImageStyle ? (
          <>
            <img src={config.image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700" />
        )}
        <div className="relative">
          <h3 className="font-display text-2xl md:text-3xl mb-2 [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">{config.heading || "Never Miss a Deal Again"}</h3>
          <p className="text-white/85 text-sm mb-4 max-w-md">
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
        {!useImageStyle && <span className="relative hidden md:block text-6xl opacity-90 shrink-0">💬</span>}
      </div>
    </section>
  );
}