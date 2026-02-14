"use client";

export function LandingEnvelope({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 100"
      className={`w-44 h-auto max-w-[180px] ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="env-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e63950" />
          <stop offset="50%" stopColor="#c41e3a" />
          <stop offset="100%" stopColor="#9e1830" />
        </linearGradient>
        <linearGradient id="env-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4e4a6" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8962e" />
        </linearGradient>
        <filter id="env-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Envelope body */}
      <rect
        x="10"
        y="25"
        width="120"
        height="65"
        rx="4"
        fill="url(#env-red)"
        filter="url(#env-shadow)"
      />
      {/* Triangle flap */}
      <path
        d="M 10 25 L 70 60 L 130 25 L 130 35 L 70 68 L 10 35 Z"
        fill="url(#env-red)"
        opacity="0.9"
      />
      {/* Gold seal / band */}
      <rect x="58" y="40" width="24" height="24" rx="4" fill="url(#env-gold)" />
      <text x="70" y="55" fill="#8b6914" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif">
        福
      </text>
    </svg>
  );
}
