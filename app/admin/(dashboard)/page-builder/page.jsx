// Save as: app/admin/(dashboard)/page-builder/page.jsx

"use client";

import { useEffect, useState } from "react";
import { BLOCK_TYPES } from "@/lib/homepageBlocks";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default function PageBuilderPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addingType, setAddingType] = useState("");

  useEffect(() => {
    loadBlocks();
  }, []);

  async function loadBlocks() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/homepage-blocks");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setBlocks(json.blocks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (index === dragIndex) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  async function handleDrop() {
    setDragIndex(null);
    try {
      await fetch("/api/admin/homepage-blocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: blocks.map((b) => b.id) }),
      });
    } catch {
      setError("Couldn't save the new order — try again.");
    }
  }

  async function toggleVisible(block) {
    const updated = { ...block, is_visible: !block.is_visible };
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? updated : b)));
    await fetch(`/api/admin/homepage-blocks/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: updated.is_visible }),
    });
  }

  async function saveConfig(block, newConfig) {
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, config: newConfig } : b)));
    await fetch(`/api/admin/homepage-blocks/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: newConfig }),
    });
    setEditingId(null);
  }

  async function deleteBlock(block) {
    if (!confirm(`Remove "${BLOCK_TYPES[block.type]?.label || block.type}" from the homepage?`)) return;
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    await fetch(`/api/admin/homepage-blocks/${block.id}`, { method: "DELETE" });
  }

  async function addBlock() {
    if (!addingType) return;
    try {
      const res = await fetch("/api/admin/homepage-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: addingType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setBlocks((prev) => [...prev, json.block]);
      setAddingType("");
    } catch (err) {
      setError(err.message);
    }
  }

  const usedTypes = new Set(blocks.map((b) => b.type));
  const availableTypes = Object.keys(BLOCK_TYPES);

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Page Builder</h1>
      <p className="text-cream/50 text-sm mb-6">
        Drag the ⠿ handle to reorder. Toggle a block off to hide it without deleting it.
        Changes apply to your live homepage right away.
      </p>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-cream/50 text-sm">Loading layout...</p>
      ) : (
        <div className="space-y-2 mb-8">
          {blocks.map((block, index) => {
            const def = BLOCK_TYPES[block.type];
            const isEditing = editingId === block.id;

            return (
              <div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDrop}
                className={`card-surface rounded-lg p-4 ${block.is_visible ? "" : "opacity-50"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="cursor-grab text-cream/40 text-lg select-none">⠿</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cream/90 font-semibold">
                      {def?.label || block.type}
                    </p>
                    <p className="text-xs text-cream/40">{def?.description}</p>
                  </div>
                  <button
                    onClick={() => toggleVisible(block)}
                    className={`text-xs px-3 py-1.5 rounded-md ${
                      block.is_visible
                        ? "bg-deal-green/20 text-deal-green"
                        : "bg-white/10 text-cream/50"
                    }`}
                  >
                    {block.is_visible ? "Visible" : "Hidden"}
                  </button>
                  {def?.fields?.length > 0 && (
                    <button
                      onClick={() => setEditingId(isEditing ? null : block.id)}
                      className="text-xs px-3 py-1.5 rounded-md border border-gold/30 text-cream/70 hover:border-gold hover:text-gold"
                    >
                      {isEditing ? "Close" : "Edit"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteBlock(block)}
                    className="text-xs px-3 py-1.5 rounded-md border border-red-500/30 text-red-300 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>

                {isEditing && (
                  <BlockConfigForm
                    block={block}
                    fields={def.fields}
                    onSave={(config) => saveConfig(block, config)}
                  />
                )}
              </div>
            );
          })}

          {blocks.length === 0 && (
            <p className="text-cream/50 text-sm">
              No blocks yet — add one below to start building your homepage.
            </p>
          )}
        </div>
      )}

      <div className="card-surface rounded-lg p-4">
        <p className="text-xs text-cream/60 mb-2">Add a block:</p>
        <div className="flex gap-2 flex-wrap">
          <select
            value={addingType}
            onChange={(e) => setAddingType(e.target.value)}
            className="flex-1 min-w-[200px] rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          >
            <option value="">Choose a block type...</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {BLOCK_TYPES[type].label}
                {usedTypes.has(type) ? " (already on page)" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={addBlock}
            disabled={!addingType}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink text-sm font-semibold px-4 py-2 disabled:opacity-60"
          >
            Add Block
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockConfigForm({ block, fields, onSave }) {
  const [values, setValues] = useState(block.config || {});

  return (
    <div className="mt-4 pt-4 border-t border-gold/15 space-y-3">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-xs text-cream/60 mb-1">{field.label}</label>
          {field.type === "boolean" ? (
            <label className="flex items-center gap-2 text-sm text-cream/70">
              <input
                type="checkbox"
                checked={values[field.key] ?? field.default}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.checked }))}
              />
              Enabled
            </label>
          ) : field.type === "image" ? (
            <ImageUploadField
              value={values[field.key] ?? field.default}
              onChange={(url) => setValues((v) => ({ ...v, [field.key]: url }))}
            />
          ) : field.type === "textarea" ? (
            <textarea
              rows={3}
              value={values[field.key] ?? field.default}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          ) : (
            <input
              type={field.type === "number" ? "number" : "text"}
              value={values[field.key] ?? field.default}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                }))
              }
              className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          )}
        </div>
      ))}
      <button
        onClick={() => onSave(values)}
        className="rounded-md bg-gold hover:bg-gold-bright text-ink text-xs font-semibold px-4 py-2"
      >
        Save Settings
      </button>
    </div>
  );
}
