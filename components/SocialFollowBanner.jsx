// Save as: components/SocialFollowBanner.jsx

import Link from "next/link";

const PLATFORMS = [
  { key: "instagramLink", icon: "📸", label: "Instagram" },
  { key: "facebookLink", icon: "👍", label: "Facebook" },
  { key: "tiktokLink", icon: "🎵", label: "TikTok" },
  { key: "whatsappLink", icon: "💬", label: "WhatsApp" },
];

export default function SocialFollowBanner({ config = {} }) {
  const active = PLATFORMS.filter((p) => config[p.key]);
  if (active.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-xl border border-gold/20 bg-ink-lighter p-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="font-display text-lg text-gold">{config.heading || "Follow Us for Daily Deals"}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {active.map((p) => (
            <Link
              key={p.key}
              href={config[p.key]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gold/30 rounded-full px-4 py-2 text-sm text-cream/80 hover:border-gold hover:text-gold transition-colors"
            >
              <span>{p.icon}</span> {p.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}