import Link from "next/link";
import { getSiteSetting } from "@/lib/siteSettings";

export default async function Footer() {
  const [bgLight, bgDark, instagram, facebook, tiktok, whatsapp, youtube, twitter] = await Promise.all([
    getSiteSetting("footer_bg_light", ""),
    getSiteSetting("footer_bg_dark", ""),
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

  return (
    <footer className="bg-ink border-t border-gold/20 mt-16 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        <div className="grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <div className="font-display text-lg font-bold text-gold-dim mb-2">
              Dirham Genie
            </div>
            <p className="text-cream/60 leading-relaxed">
              Unlocking the best deals every day. Dirham Genie is an independent
              deals publisher and is not affiliated with, endorsed by, or
              sponsored by Amazon beyond standard participation in its
              affiliate programme.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gold/25 text-base hover:border-gold hover:bg-white/5 transition-colors"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-gold font-semibold mb-2">Site</div>
            <ul className="space-y-1 text-cream/70">
              <li><Link href="/deals/latest" className="hover:text-gold">Latest Deals</Link></li>
              <li><Link href="/deals/biggest-discounts" className="hover:text-gold">Biggest Discounts</Link></li>
              <li><Link href="/deals/lightning" className="hover:text-gold">Lightning Deals</Link></li>
              <li><Link href="/coupons" className="hover:text-gold">Coupons</Link></li>
              <li><Link href="/blog" className="hover:text-gold">Blog</Link></li>
              <li><Link href="/wishlist" className="hover:text-gold">Wishlist</Link></li>
              <li><Link href="/compare" className="hover:text-gold">Compare Products</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-gold font-semibold mb-2">Legal</div>
            <ul className="space-y-1 text-cream/70">
              <li><Link href="/about" className="hover:text-gold">About Us</Link></li>
              <li><Link href="/disclaimer" className="hover:text-gold">Affiliate Disclaimer</Link></li>
              <li><Link href="/privacy" className="hover:text-gold">Privacy Policy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-gold">Cookie Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold">Terms of Use</Link></li>
              <li><Link href="/dmca" className="hover:text-gold">DMCA / Content Policy</Link></li>
              <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-gold font-semibold mb-2">Amazon Associates Disclosure</div>
            <p className="text-cream/60 leading-relaxed">
              Dirham Genie is a participant in the Amazon Services LLC
              Associates Program (Amazon.ae), an affiliate advertising
              programme designed to provide a means for sites to earn
              advertising fees by advertising and linking to Amazon.ae.
              As an Amazon Associate, we earn from qualifying purchases.
              Prices and availability are accurate as of the date/time
              indicated and are subject to change.
            </p>
          </div>
        </div>

        <div className="divider-gold my-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/50">
          <span>&copy; {new Date().getFullYear()} Dirham Genie. All rights reserved.</span>
          <span className="flex items-center gap-2">
            Built &amp; powered by
            <img src="/logo-virtuavision.png" alt="VirtuaVision" className="h-5" />
          </span>
        </div>
      </div>

      {(bgLight || bgDark) && (
        <div className="relative w-full h-28 md:h-36">
          <div
            className="footer-bg-layer absolute inset-0 opacity-70"
            style={{
              "--footer-bg-light": bgLight ? `url(${bgLight})` : "none",
              "--footer-bg-dark": bgDark ? `url(${bgDark})` : "none",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-ink to-transparent" />
        </div>
      )}
    </footer>
  );
}