export default function LampIllustration({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 160"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Magic lamp"
    >
      <defs>
        <linearGradient id="lampGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F4C430" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8A6D1F" />
        </linearGradient>
        <linearGradient id="lampShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFF8DC" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="142" rx="58" ry="8" fill="#000" opacity="0.35" />

      <rect x="95" y="128" width="50" height="10" rx="3" fill="url(#lampGold)" />
      <rect x="105" y="120" width="30" height="10" rx="3" fill="url(#lampGold)" />

      <path
        d="M60 118
           C40 118 30 100 45 88
           C55 80 60 78 55 68
           C50 56 65 50 80 52
           C90 40 130 38 150 55
           C185 60 205 78 195 95
           C188 106 165 112 150 112
           C150 118 145 122 138 122
           L70 122
           C64 122 60 121 60 118 Z"
        fill="url(#lampGold)"
        stroke="#8A6D1F"
        strokeWidth="1.5"
      />

      <path
        d="M75 70 C80 60 100 54 115 56 C110 66 100 74 85 78 C78 80 73 76 75 70 Z"
        fill="url(#lampShine)"
      />

      <path
        d="M195 95 C215 92 232 84 236 78 C238 74 234 72 230 74 C220 80 205 86 190 88 Z"
        fill="url(#lampGold)"
        stroke="#8A6D1F"
        strokeWidth="1.5"
      />

      <path
        d="M52 92 C36 90 30 104 40 114 C46 120 56 118 58 110"
        fill="none"
        stroke="url(#lampGold)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <ellipse cx="115" cy="52" rx="20" ry="6" fill="url(#lampGold)" stroke="#8A6D1F" strokeWidth="1.5" />
      <rect x="108" y="40" width="14" height="14" rx="4" fill="url(#lampGold)" stroke="#8A6D1F" strokeWidth="1.5" />
      <circle cx="115" cy="36" r="5" fill="url(#lampGold)" stroke="#8A6D1F" strokeWidth="1.5" />
    </svg>
  );
}