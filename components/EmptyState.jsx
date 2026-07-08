import Link from "next/link";

export default function EmptyState({ icon = "🪔", title, subtitle, actionLabel, actionHref }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <p className="text-cream/70 font-medium">{title}</p>
      {subtitle && <p className="text-cream/40 text-sm mt-1 max-w-sm mx-auto">{subtitle}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block mt-4 text-sm text-gold underline underline-offset-2 hover:text-gold-bright"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
