"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dg_theme");
    const dark = saved === "dark";
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("dg_theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="text-sm w-8 h-8 flex items-center justify-center rounded-full border border-gold/30 hover:border-gold text-cream/70 hover:text-gold transition-colors"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}