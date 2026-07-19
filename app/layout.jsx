import { Cinzel, Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterForm from "@/components/NewsletterForm";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ConditionalChrome from "@/components/ConditionalChrome";
import { getLocale } from "@/lib/i18n";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Dirham Genie | Unlocking the Best Deals Every Day",
  description:
    "Dirham Genie finds the best Amazon.ae deals in the UAE, every day. Genuine prices, genuine picks, genuine savings in dirhams.",
  metadataBase: new URL("https://dirhamgenie.com"),
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Dirham Genie | Unlocking the Best Deals Every Day",
    description: "Dirham Genie finds the best Amazon.ae deals in the UAE, every day.",
    siteName: "Dirham Genie",
    images: [{ url: "/logo-dirham-genie.png", width: 1080, height: 1080 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dirham Genie | Unlocking the Best Deals Every Day",
    description: "Dirham Genie finds the best Amazon.ae deals in the UAE, every day.",
    images: ["/logo-dirham-genie.png"],
  },
};

export default function RootLayout({ children }) {
  const locale = getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="font-body min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Dirham Genie",
                url: "https://dirhamgenie.com",
                logo: "https://dirhamgenie.com/logo-dirham-genie.png",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Dirham Genie",
                url: "https://dirhamgenie.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://dirhamgenie.com/search?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            var t = localStorage.getItem('dg_theme');
            if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
          } catch (e) {}`}
        </Script>
        <GoogleAnalytics />
        <ServiceWorkerRegister />
        <ConditionalChrome>
          <Header />
          <SocialIconsBar />
        </ConditionalChrome>
        <main className="flex-1">{children}</main>
        <ConditionalChrome>
          <section className="border-t border-gold/15 bg-ink-lighter">
            <div className="max-w-6xl mx-auto px-4 py-10">
              <NewsletterForm />
            </div>
          </section>
        </ConditionalChrome>
        <ConditionalChrome>
          <Footer />
        </ConditionalChrome>
        <CookieConsent />
      </body>
    </html>
  );
}