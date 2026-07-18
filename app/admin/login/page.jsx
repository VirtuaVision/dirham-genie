"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forgotNote, setForgotNote] = useState(false);
  const [remember, setRemember] = useState(true);
  const [bg, setBg] = useState({ light: "", dark: "" });
  const [logo, setLogo] = useState({ light: "", dark: "" });

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["admin_bg_light", "admin_bg_dark", "admin_logo_light", "admin_logo_dark"])
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((row) => (map[row.key] = row.value));
        setBg({ light: map.admin_bg_light || "", dark: map.admin_bg_dark || "" });
        setLogo({ light: map.admin_logo_light || "", dark: map.admin_logo_dark || "" });
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Login failed.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="admin-bg-layer relative min-h-[70vh] overflow-hidden flex flex-col items-center justify-start px-4 pt-10 pb-6"
      style={{
        "--admin-bg-light": bg.light ? `url(${bg.light})` : "none",
        "--admin-bg-dark": bg.dark ? `url(${bg.dark})` : "none",
      }}
    >
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Decorative dotted pattern, top-left — only when no real photo is set */}
      {!bg.light && !bg.dark && (
        <div
          className="absolute top-0 left-0 w-40 h-40 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgb(var(--color-gold)) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
      )}

      {/* Logo badge */}
      <div className="relative z-10 mb-6">
        <div className="w-56 h-56 rounded-full border-2 border-gold/40 bg-ink-light flex flex-col items-center justify-center shadow-sm overflow-hidden">
          <img
            src={logo.light || "/logo-dirham-genie.png"}
            alt="Dirham Genie"
            className="admin-logo-light w-full h-full object-cover"
          />
          <img
            src={logo.dark || logo.light || "/logo-dirham-genie.png"}
            alt="Dirham Genie"
            className="admin-logo-dark w-full h-full object-cover"
          />
        </div>
      </div>

      <h1 className="relative z-10 font-display text-3xl text-cream mb-1 text-center">Welcome Back!</h1>
      <p className="relative z-10 text-cream/50 text-sm mb-8 text-center">
        Sign in to access your admin panel
      </p>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 card-surface rounded-2xl p-8 w-full max-w-sm shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gold/25" />
          <span className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-lg">
            🛡️
          </span>
          <div className="flex-1 h-px bg-gold/25" />
        </div>

        {error && (
          <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded p-2 mb-4">
            {error}
          </p>
        )}

        <label className="block text-sm text-cream font-semibold mb-1">Email</label>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40 text-sm">✉️</span>
          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 pl-10 pr-3 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
          />
        </div>

        <label className="block text-sm text-cream font-semibold mb-1">Password</label>
        <div className="relative mb-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40 text-sm">🔒</span>
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-ink-lighter border border-gold/30 pl-10 pr-10 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-gold text-sm"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <label className="flex items-center gap-2 text-xs text-cream/70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Keep me logged in
          </label>
          <button
            type="button"
            onClick={() => setForgotNote((v) => !v)}
            className="text-xs text-gold hover:text-gold-bright font-medium"
          >
            Forgot Password?
          </button>
          {forgotNote && (
            <p className="text-xs text-cream/50 mt-2 text-left w-full">
              Ask another admin with Team Access to reset it for you, or contact whoever manages your Supabase project.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gold hover:bg-gold-bright text-white font-semibold py-3 text-sm transition-colors disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="flex items-center gap-3 mt-6 mb-2">
          <div className="flex-1 h-px bg-gold/15" />
          <span className="text-xs text-cream/40 uppercase tracking-wide">Secure Access</span>
          <div className="flex-1 h-px bg-gold/15" />
        </div>
        <p className="text-center text-xs text-cream/40">🛡️ Your data is safe with us</p>
      </form>

      {/* Decorative skyline silhouette — only when no real photo is set */}
      {!bg.light && !bg.dark && (
        <svg
          className="absolute bottom-0 left-0 w-full h-32 opacity-20 pointer-events-none"
          viewBox="0 0 1024 140"
          preserveAspectRatio="none"
          fill="rgb(var(--color-gold))"
        >
          <rect x="60" y="70" width="14" height="70" />
          <rect x="90" y="50" width="10" height="90" />
          <polygon points="150,140 150,60 175,40 200,60 200,140" />
          <rect x="230" y="90" width="16" height="50" />
          <rect x="260" y="30" width="18" height="110" />
          <rect x="290" y="65" width="12" height="75" />
          <rect x="480" y="0" width="20" height="140" />
          <rect x="510" y="55" width="14" height="85" />
          <rect x="540" y="80" width="16" height="60" />
          <rect x="700" y="60" width="14" height="80" />
          <rect x="730" y="35" width="18" height="105" />
          <rect x="760" y="75" width="12" height="65" />
          <rect x="850" y="90" width="16" height="50" />
          <rect x="880" y="55" width="12" height="85" />
        </svg>
      )}
    </div>
  );
}
