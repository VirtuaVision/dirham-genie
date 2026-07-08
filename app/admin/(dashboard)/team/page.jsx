"use client";

import { useEffect, useState } from "react";

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ email: "", password: "", role: "editor" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers(json.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setForm({ email: "", password: "", role: "editor" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(user) {
    if (!confirm(`Remove ${user.email} from the team?`)) return;
    await fetch(`/api/team/${user.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-2">Team Access</h1>
      <p className="text-cream/50 text-sm mb-6">
        Your main login (set in Vercel&apos;s environment variables) always has
        full Admin access. Add extra accounts here for editors or additional
        admins.
      </p>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-3 mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="card-surface rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-cream/60 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cream/60 mb-1">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cream/60 mb-1">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream focus:border-gold outline-none"
          >
            <option value="editor">Editor (products & content only)</option>
            <option value="admin">Admin (full access)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-4 py-2 text-sm disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add Team Member"}
        </button>
      </form>

      {loading ? (
        <p className="text-cream/50 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {users.length === 0 && (
            <p className="text-cream/50 text-sm">No extra team accounts yet.</p>
          )}
          {users.map((u) => (
            <div key={u.id} className="card-surface rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-cream/90">{u.email}</p>
                <p className="text-xs text-cream/50 capitalize">{u.role}</p>
              </div>
              <button
                onClick={() => remove(u)}
                className="text-xs px-2 py-1 rounded bg-white/5 text-cream/70 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
