"use client";

import { useEffect, useState } from "react";

const empty = { title: "", excerpt: "", content: "", cover_image_url: "" };

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/posts");
    const json = await res.json();
    setPosts(json.posts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(post) {
    await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !post.is_published }),
    });
    load();
  }

  async function remove(post) {
    if (!confirm(`Delete post "${post.title}"?`)) return;
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Blog / News Posts</h1>

      {error && <p className="text-red-300 text-sm mb-4">{error}</p>}

      <form onSubmit={handleAdd} className="card-surface rounded-lg p-4 mb-6 space-y-3">
        <input
          required
          placeholder="Post title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <input
          placeholder="Cover image URL"
          value={form.cover_image_url}
          onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
          className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <input
          placeholder="Short excerpt / summary"
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <textarea
          required
          rows={6}
          placeholder="Full post content"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          className="w-full rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-4 py-2 text-sm disabled:opacity-60"
        >
          {saving ? "Publishing..." : "Publish Post"}
        </button>
      </form>

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {posts.length === 0 && <p className="text-cream/50 text-sm">No posts yet.</p>}
          {posts.map((p) => (
            <div key={p.id} className="card-surface rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cream/90 truncate">{p.title}</p>
              </div>
              <button
                onClick={() => toggle(p)}
                className={`text-xs px-2 py-1 rounded ${p.is_published ? "bg-deal-green/20 text-deal-green" : "bg-white/5 text-cream/40"}`}
              >
                {p.is_published ? "Published" : "Draft"}
              </button>
              <button
                onClick={() => remove(p)}
                className="text-xs px-2 py-1 rounded bg-white/5 text-cream/70 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
