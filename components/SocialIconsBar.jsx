// Save as: components/SocialIconsBar.jsx
//
// The actual site-wide "follow us" strip (shown under the header on every
// page), sourced from Site Settings. Redesigned to match the rounded-pill
// style with colored platform icon circles.

import { getSiteSetting } from "@/lib/siteSettings";

function IconCircle({ bg, children, gradient }) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-white"
      style={gradient ? { background: gradient } : { backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

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
    {
      href: facebook,
      label: "Facebook",
      icon: (
        <IconCircle bg="#1877F2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.98 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5z" />
          </svg>
        </IconCircle>
      ),
    },
    {
      href: instagram,
      label: "Instagram",
      icon: (
        <IconCircle gradient="radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
          </svg>
        </IconCircle>
      ),
    },
    {
      href: whatsapp,
      label: "WhatsApp",
      icon: (
        <IconCircle bg="#25D366">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.6 14.2c-.24.67-1.4 1.28-1.94 1.35-.5.07-1.13.1-1.82-.11a16.7 16.7 0 0 1-1.66-.6c-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36h.55c.18 0 .42-.07.65.5.24.58.82 2.01.89 2.16.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.44.5-.15.15-.3.31-.13.6.17.29.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.37 1.47.29.15.46.12.63-.08.17-.19.71-.83.9-1.11.19-.29.38-.24.63-.15.26.1 1.65.78 1.93.92.29.14.48.22.55.34.07.12.07.7-.17 1.37z" />
          </svg>
        </IconCircle>
      ),
    },
    {
      href: youtube,
      label: "YouTube",
      icon: (
        <IconCircle bg="#FF0000">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M10 8.5v7l6-3.5-6-3.5z" fill="white" />
            <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="white" strokeWidth="1.6" />
          </svg>
        </IconCircle>
      ),
    },
    {
      href: tiktok,
      label: "TikTok",
      icon: (
        <IconCircle bg="#000000">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M16.5 2h-3v13.5a2.5 2.5 0 1 1-2.5-2.5c.18 0 .35.02.5.05V9.9a5.6 5.6 0 0 0-.5-.02A5.62 5.62 0 1 0 16.5 15.5V8.3a7.5 7.5 0 0 0 4 1.15V6.4a4.5 4.5 0 0 1-4-4.4z" />
          </svg>
        </IconCircle>
      ),
    },
    {
      href: twitter,
      label: "X / Twitter",
      icon: (
        <IconCircle bg="#000000">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-6.9L4.5 22H1.3l8.2-9.3L1 2h7.1l4.9 6.3L18.9 2zm-1.2 18h1.9L7.4 4H5.4l12.3 16z" />
          </svg>
        </IconCircle>
      ),
    },
  ].filter((s) => s.href);

  if (socialLinks.length === 0) return null;

  return (
    <div className="bg-cream/60 border-b border-gold/10">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2 flex-wrap">
        <span className="text-[11px] text-ink/50 font-semibold uppercase tracking-wide mr-1">Follow Us</span>
        {socialLinks.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="hover:scale-110 transition-transform"
          >
            {s.icon}
          </a>
        ))}
      </div>
    </div>
  );
}
