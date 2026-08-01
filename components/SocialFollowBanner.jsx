// Save as: components/SocialFollowBanner.jsx

import Link from "next/link";

// Small hand-drawn glyphs (not official brand logo files) inside solid
// brand-colored circles — recognizable at a glance without pulling in an
// icon library or reproducing any platform's exact proprietary artwork.
function IconCircle({ bg, children, gradient }) {
  return (
    <span
      className="inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-white"
      style={gradient ? { background: gradient } : { backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

const PLATFORMS = [
  {
    key: "facebookLink",
    label: "Facebook",
    icon: (
      <IconCircle bg="#1877F2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.17 2.1 15.95 2 14.66 2 11.98 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5z" />
        </svg>
      </IconCircle>
    ),
  },
  {
    key: "instagramLink",
    label: "Instagram",
    icon: (
      <IconCircle gradient="radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
        </svg>
      </IconCircle>
    ),
  },
  {
    key: "whatsappLink",
    label: "WhatsApp",
    icon: (
      <IconCircle bg="#25D366">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.6 14.2c-.24.67-1.4 1.28-1.94 1.35-.5.07-1.13.1-1.82-.11a16.7 16.7 0 0 1-1.66-.6c-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36h.55c.18 0 .42-.07.65.5.24.58.82 2.01.89 2.16.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.44.5-.15.15-.3.31-.13.6.17.29.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.37 1.47.29.15.46.12.63-.08.17-.19.71-.83.9-1.11.19-.29.38-.24.63-.15.26.1 1.65.78 1.93.92.29.14.48.22.55.34.07.12.07.7-.17 1.37z" />
        </svg>
      </IconCircle>
    ),
  },
  {
    key: "linkedinLink",
    label: "LinkedIn",
    icon: (
      <IconCircle bg="#0A66C2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
        </svg>
      </IconCircle>
    ),
  },
  {
    key: "youtubeLink",
    label: "YouTube",
    icon: (
      <IconCircle bg="#FF0000">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <rect x="2" y="5" width="20" height="14" rx="4" fill="white" opacity="0" />
          <path d="M10 8.5v7l6-3.5-6-3.5z" fill="white" />
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="white" strokeWidth="1.6" />
        </svg>
      </IconCircle>
    ),
  },
  {
    key: "telegramLink",
    label: "Telegram",
    icon: (
      <IconCircle bg="#26A5E4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M21.5 4.5l-3.1 15c-.23.99-.86 1.23-1.74.77l-4.8-3.54-2.32 2.23c-.26.26-.47.47-.96.47l.34-4.87 8.86-8c.38-.35-.08-.54-.6-.2L6.1 12.7l-4.7-1.47c-1.02-.32-1.04-1.02.21-1.51l18.4-7.1c.85-.32 1.6.2 1.32 1.28z" />
        </svg>
      </IconCircle>
    ),
  },
  {
    key: "tiktokLink",
    label: "TikTok",
    icon: (
      <IconCircle bg="#000000">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M16.5 2h-3v13.5a2.5 2.5 0 1 1-2.5-2.5c.18 0 .35.02.5.05V9.9a5.6 5.6 0 0 0-.5-.02A5.62 5.62 0 1 0 16.5 15.5V8.3a7.5 7.5 0 0 0 4 1.15V6.4a4.5 4.5 0 0 1-4-4.4z" />
        </svg>
      </IconCircle>
    ),
  },
];

export default function SocialFollowBanner({ config = {} }) {
  const active = PLATFORMS.filter((p) => config[p.key]);
  if (active.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className="rounded-[2.5rem] bg-white border border-gold/15 shadow-lg px-6 py-5 md:px-8 md:py-6">
        <div className="flex items-center justify-center md:justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-3xl">🪔</span>
            <div className="leading-tight">
              <p className="italic text-slate-500 text-sm -mb-0.5">Follow</p>
              <p className="font-display font-bold text-emerald-600 text-xl">{config.heading || "Dirham Genie"}</p>
            </div>
          </div>

          <span className="hidden md:block w-px h-10 bg-gray-200" />

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {active.map((p) => (
              <Link
                key={p.key}
                href={config[p.key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={p.label}
                className="hover:scale-110 transition-transform"
              >
                {p.icon}
              </Link>
            ))}
          </div>
        </div>

        {config.tagline !== "" && (
          <p className="text-center text-slate-600 text-sm mt-4">
            {config.tagline || "Your destination for the best Amazon UAE deals & trending finds."}
          </p>
        )}
      </div>
    </section>
  );
}
