// Save as: app/admin/(dashboard)/settings/page.jsx

"use client";

import { useEffect, useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default function SiteSettingsPage() {
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((json) => setLogoUrl(json.settings?.site_logo || ""))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site_logo", value: logoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
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
        <div className="card-surface rounded-lg p-5">
          <ImageUploadField
            label="Site Logo"
            value={logoUrl}
            onChange={setLogoUrl}
          />
          <p className="text-xs text-cream/40 mt-2 mb-4">
            Shows in the header, admin sidebar, and browser tab. Square images work best.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Logo"}
          </button>
        </div>
      )}
    </div>
  );
}
