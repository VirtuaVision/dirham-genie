"use client";

import { useEffect, useState } from "react";
import SimpleBarChart from "@/components/SimpleBarChart";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-cream/50 text-sm">Loading...</p>;
  if (!data) return <p className="text-red-300 text-sm">Couldn&apos;t load analytics.</p>;

  const totalClicks = data.clicksByDay.reduce((sum, d) => sum + d.count, 0);
  const totalSubs = data.subscribersByDay.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Analytics</h1>

      <div className="card-surface rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-cream/80 font-semibold">Affiliate Clicks — last 30 days</p>
          <p className="font-mono text-gold text-lg">{totalClicks}</p>
        </div>
        <SimpleBarChart data={data.clicksByDay} color="#D4AF37" />
        <div className="flex justify-between text-xs text-cream/40 mt-2">
          <span>{data.clicksByDay[0]?.date}</span>
          <span>{data.clicksByDay[data.clicksByDay.length - 1]?.date}</span>
        </div>
      </div>

      <div className="card-surface rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-cream/80 font-semibold">New Newsletter Subscribers — last 30 days</p>
          <p className="font-mono text-gold text-lg">{totalSubs}</p>
        </div>
        <SimpleBarChart data={data.subscribersByDay} color="#2E9E5B" />
        <div className="flex justify-between text-xs text-cream/40 mt-2">
          <span>{data.subscribersByDay[0]?.date}</span>
          <span>{data.subscribersByDay[data.subscribersByDay.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}
