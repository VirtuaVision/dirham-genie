// Save as: app/admin/(dashboard)/settings/page.jsx

"use client";

import { useEffect, useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default function SiteSettingsPage() {
  const [logoUrl, setLogoUrl] = useState("");
  const [adminBgLight, setAdminBgLight] = useState("");
  const [adminBgDark, setAdminBgDark] = useState("");
  const [adminInnerBgLight, setAdminInnerBgLight] = useState("");
  const [adminInnerBgDark, setAdminInnerBgDark] = useState("");
  const [footerBgLight, setFooterBgLight] = useState("");
  const [footerBgDark, setFooterBgDark] = useState("");
  const [adminLogoLight, setAdminLogoLight] = useState("");
  const [adminLogoDark, setAdminLogoDark] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [tiktokLink, setTiktokLink] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((json) => {
        const s = json.settings || {};
        setLogoUrl(s.site_logo || "");
        setAdminBgLight(s.admin_bg_light || "");
        setAdminBgDark(s.admin_bg_dark || "");
        setAdminInnerBgLight(s.admin_inner_bg_light || "");
        setAdminInnerBgDark(s.admin_inner_bg_dark || "");
        setFooterBgLight(s.footer_bg_light || "");
        setFooterBgDark(s.footer_bg_dark || "");
        setAdminLogoLight(s.admin_logo_light || "");
        setAdminLogoDark(s.admin_logo_dark || "");
        setInstagramLink(s.social_instagram || "");
        setFacebookLink(s.social_facebook || "");
        setTiktokLink(s.social_tiktok || "");
        setWhatsappLink(s.social_whatsapp || "");
        setYoutubeLink(s.social_youtube || "");
        setTwitterLink(s.social_twitter || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveSetting(key, value) {
    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
  }

  async function handleSaveAll() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await Promise.all([
        saveSetting("site_logo", logoUrl),
        saveSetting("admin_bg_light", adminBgLight),
        saveSetting("admin_bg_dark", adminBgDark),
        saveSetting("admin_inner_bg_light", adminInnerBgLight),
        saveSetting("admin_inner_bg_dark", adminInnerBgDark),
        saveSetting("footer_bg_light", footerBgLight),
        saveSetting("footer_bg_dark", footerBgDark),
        saveSetting("admin_logo_light", adminLogoLight),
        saveSetting("admin_logo_dark", adminLogoDark),
        saveSetting("social_instagram", instagramLink),
        saveSetting("social_facebook", facebookLink),
        saveSetting("social_tiktok", tiktokLink),
        saveSetting("social_whatsapp", whatsappLink),
        saveSetting("social_youtube", youtubeLink),
        saveSetting("social_twitter", twitterLink),
      ]);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Site Settings</h1>
      <p className="text-cream/50 text-sm mb-6">
        Change site-wide elements here — currently just your logo, more settings can be added later.
      </p>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
        </p>
      )}
      {saved && (
        <p className="bg-deal-green/10 border border-deal-green/30 text-deal-green text-sm rounded p-3 mb-4">
          Saved! Your header and admin sidebar will use this logo now.
        </p>
      )}

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : (
        <div className="card-surface rounded-lg p-5 space-y-6">
          <div>
            <ImageUploadField
              label="Site Logo (public website header) — 1200×1200px, square"
              value={logoUrl}
              onChange={setLogoUrl}
            />
          </div>

          <div className="border-t border-gold/15 pt-5">
            <p className="text-sm text-cream font-semibold mb-3">Login Screen</p>
            <p className="text-xs text-cream/40 mb-4">
              Background and logo shown only on the admin sign-in page.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              <ImageUploadField
                label="Login Background — Light theme — 1024×1536px, portrait"
                value={adminBgLight}
                onChange={setAdminBgLight}
              />
              <ImageUploadField
                label="Login Background — Dark theme — 1024×1536px, portrait"
                value={adminBgDark}
                onChange={setAdminBgDark}
              />
              <ImageUploadField
                label="Login Logo — Light theme — 1200×1200px, square"
                value={adminLogoLight}
                onChange={setAdminLogoLight}
              />
              <ImageUploadField
                label="Login Logo — Dark theme — 1200×1200px, square"
                value={adminLogoDark}
                onChange={setAdminLogoDark}
              />
            </div>
          </div>

          <div className="border-t border-gold/15 pt-5">
            <p className="text-sm text-cream font-semibold mb-3">Inside Admin Pages</p>
            <p className="text-xs text-cream/40 mb-4">
              Background shown on every page once you're logged in — Dashboard, Products,
              Page Builder, and so on. Separate from the login screen's background.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              <ImageUploadField
                label="Pages Background — Light theme — 1600×1200px, landscape"
                value={adminInnerBgLight}
                onChange={setAdminInnerBgLight}
              />
              <ImageUploadField
                label="Pages Background — Dark theme — 1600×1200px, landscape"
                value={adminInnerBgDark}
                onChange={setAdminInnerBgDark}
              />
            </div>
          </div>

          <div className="border-t border-gold/15 pt-5">
            <p className="text-sm text-cream font-semibold mb-3">Public Site Footer</p>
            <p className="text-xs text-cream/40 mb-4">
              Background for the footer at the bottom of every public page (not admin). Follows
              the same light/dark toggle visitors use.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              <ImageUploadField
                label="Footer Background — Light theme — 1536×512px, wide banner (3:1)"
                value={footerBgLight}
                onChange={setFooterBgLight}
              />
              <ImageUploadField
                label="Footer Background — Dark theme — 1536×512px, wide banner (3:1)"
                value={footerBgDark}
                onChange={setFooterBgDark}
              />
            </div>
          </div>

          <div className="border-t border-gold/15 pt-5">
            <p className="text-sm text-cream font-semibold mb-3">Social Media Links</p>
            <p className="text-xs text-cream/40 mb-4">
              Paste your profile/channel links here — icons appear automatically in the site
              footer, and only for platforms you fill in. Leave any blank to hide that icon.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-cream/60 mb-1">Instagram</label>
                <input
                  value={instagramLink}
                  onChange={(e) => setInstagramLink(e.target.value)}
                  placeholder="https://instagram.com/yourpage"
                  className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-cream/60 mb-1">Facebook</label>
                <input
                  value={facebookLink}
                  onChange={(e) => setFacebookLink(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-cream/60 mb-1">TikTok</label>
                <input
                  value={tiktokLink}
                  onChange={(e) => setTiktokLink(e.target.value)}
                  placeholder="https://tiktok.com/@yourpage"
                  className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-cream/60 mb-1">WhatsApp channel/group</label>
                <input
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  placeholder="https://wa.me/... or channel link"
                  className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-cream/60 mb-1">YouTube</label>
                <input
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-cream/60 mb-1">X / Twitter</label>
                <input
                  value={twitterLink}
                  onChange={(e) => setTwitterLink(e.target.value)}
                  placeholder="https://x.com/yourpage"
                  className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      )}
    </div>
  );
}