import Link from "next/link";

const THEMES = {
  gold: "bg-gold text-ink",
  red: "bg-red-600 text-white",
  black: "bg-gray-900 text-gold border-b border-gold/30",
  green: "bg-emerald-600 text-white",
};

export default function AnnouncementBar({ config = {} }) {
  if (!config.text) return null;
  const themeClass = THEMES[config.theme] || THEMES.gold;

  const content = (
    <p className="text-center text-sm font-semibold py-2 px-4">{config.text}</p>
  );

  return (
    <div className={themeClass}>
      {config.link ? (
        <Link href={config.link} className="block hover:opacity-90 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}