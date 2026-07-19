// Save as: components/SocialIconsBar.jsx

import { getSiteSetting } from "@/lib/siteSettings";

export default async function SocialIconsBar() {
  const [instagram, facebook, tiktok, whatsapp, youtube, twitter] = await Promise.all([
    getSiteSetting("social_instagram", ""),
    getSiteSetting("social_facebook", ""),
    getSiteSetting("social_tiktok", ""),
    getSiteSetting("social_whatsapp", ""),
    getSiteSetting("social_youtube", ""),
    getSiteSetting("social_twitter", ""),
  ]);

  const socialLinks = [
    { href: instagram, label: "Instagram", icon: "📸" },
    { href: facebook, label: "Facebook", icon: "👍" },
    { href: tiktok, label: "TikTok", icon: "🎵" },
    { href: whatsapp, label: "WhatsApp", icon: "💬" },
    { href: youtube, label: "YouTube", icon: "▶️" },
    { href: twitter, label: "X / Twitter", icon: "𝕏" },
  ].filter((s) => s.href);

  if (socialLinks.length === 0) return null;

  return (
    <div className="bg-ink-lighter border-b border-gold/15">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <span className="text-xs text-cream/60 font-semibold uppercase tracking-wide">Follow Us</span>
        {socialLinks.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gold/25 text-sm hover:border-gold hover:bg-white/10 transition-colors"
          >
            {s.icon}
          </a>
        ))}
      </div>
    </div>
  );
}