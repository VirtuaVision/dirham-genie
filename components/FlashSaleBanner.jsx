// Save as: components/FlashSaleBanner.jsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const THEMES = {
  red: "bg-gradient-to-r from-red-600 to-rose-700",
  black: "bg-gradient-to-r from-gray-900 to-gray-700 border border-gold/40",
  purple: "bg-gradient-to-r from-purple-600 to-fuchsia-700",
};

function getTimeLeft(endDateTime) {
  if (!endDateTime) return null;
  const diff = new Date(endDateTime).getTime() - Date.now();
  if (isNaN(diff) || diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function FlashSaleBanner({ config = {} }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(config.endDateTime));

  useEffect(() => {
    if (!config.endDateTime) return;
    const interval = setInterval(() => setTimeLeft(getTimeLeft(config.endDateTime)), 1000);
    return () => clearInterval(interval);
  }, [config.endDateTime]);

  const themeClass = THEMES[config.theme] || THEMES.red;

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <div className={`rounded-xl ${themeClass} p-6 md:p-8 text-white text-center`}>
        <h3 className="font-display text-2xl md:text-3xl mb-2">
          {config.heading || "⚡ Flash Sale — Today Only!"}
        </h3>
        <p className="text-white/85 text-sm mb-4">
          {config.subheading || "Up to 50% off across the site."}
        </p>

        {timeLeft && (
          <div className="flex items-center justify-center gap-3 mb-5">
            {[
              ["Days", timeLeft.days],
              ["Hrs", timeLeft.hours],
              ["Min", timeLeft.minutes],
              ["Sec", timeLeft.seconds],
            ].map(([label, value]) => (
              <div key={label} className="bg-white/15 rounded-lg px-3 py-2 min-w-[56px]">
                <p className="text-xl font-bold tabular-nums">{String(value).padStart(2, "0")}</p>
                <p className="text-[10px] uppercase tracking-wide text-white/70">{label}</p>
              </div>
            ))}
          </div>
        )}

        <Link
          href={config.link || "/deals/lightning"}
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          {config.buttonText || "Shop the Sale"} →
        </Link>
      </div>
    </section>
  );
}