// Save as: components/admin/ImageUploadField.jsx
//
// Drop-in replacement for a plain "Image URL" text input. Shows a preview
// of the current image, a button to upload a new one from your phone/
// computer, and still lets you paste a URL directly if you'd rather.

"use client";

import { useState } from "react";

export default function ImageUploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onChange(json.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      {label && <label className="block text-xs text-cream/60 mb-1">{label}</label>}

      <div className="flex items-center gap-3 mb-2">
        {value ? (
          <img
            src={value}
            alt=""
            className="w-16 h-16 rounded-md object-cover border border-gold/20 bg-white/5"
          />
        ) : (
          <div className="w-16 h-16 rounded-md border border-dashed border-gold/30 flex items-center justify-center text-cream/30 text-[10px] text-center">
            No image
          </div>
        )}

        <label className="rounded-md border border-gold/30 text-cream/80 hover:border-gold hover:text-gold text-xs font-semibold px-3 py-2 cursor-pointer">
          {uploading ? "Uploading..." : "Upload Image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-300 hover:text-red-200"
          >
            Remove
          </button>
        )}
      </div>

      {error && <p className="text-red-300 text-xs mb-2">{error}</p>}

      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="...or paste an image URL directly"
        className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-xs text-cream/70 focus:border-gold outline-none"
      />
    </div>
  );
}
