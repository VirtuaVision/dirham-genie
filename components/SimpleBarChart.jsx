"use client";

export default function SimpleBarChart({ data, color = "#D4AF37" }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-[2px] h-32">
      {data.map((d, i) => (
        <div
          key={i}
          title={`${d.date}: ${d.count}`}
          className="flex-1 rounded-sm hover:opacity-80 transition-opacity"
          style={{
            height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%`,
            backgroundColor: d.count > 0 ? color : "rgba(255,255,255,0.08)",
          }}
        />
      ))}
    </div>
  );
}
