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
