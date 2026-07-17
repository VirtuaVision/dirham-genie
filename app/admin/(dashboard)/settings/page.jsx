// Save as: app/admin/(dashboard)/settings/page.jsx

"use client";

import { useEffect, useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default function SiteSettingsPage() {
  const [logoUrl, setLogoUrl] = useState("");
  const [adminBgLight, setAdminBgLight] = useState("");
  const [adminBgDark, setAdminBgDark] = useState("");
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
              label="Site Logo (public website header)"
              value={logoUrl}
              onChange={setLogoUrl}
            />
          </div>

          <div className="border-t border-gold/15 pt-5">
            <p className="text-sm text-cream font-semibold mb-3">Admin Panel Theme</p>
            <p className="text-xs text-cream/40 mb-4">
              These apply across every admin page and the login screen. Upload both a light and
              dark version — the correct one shows automatically based on the light/dark toggle.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              <ImageUploadField
                label="Background — Light theme"
                value={adminBgLight}
                onChange={setAdminBgLight}
              />
              <ImageUploadField
                label="Background — Dark theme"
                value={adminBgDark}
                onChange={setAdminBgDark}
              />
              <ImageUploadField
                label="Logo — Light theme"
                value={adminLogoLight}
                onChange={setAdminLogoLight}
              />
              <ImageUploadField
                label="Logo — Dark theme"
                value={adminLogoDark}
                onChange={setAdminLogoDark}
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
