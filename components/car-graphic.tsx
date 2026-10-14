"use client";

type Props = {
  carType: string;
  imageUrl?: string | null;
  className?: string;
  colorName?: string | null;
};

export function CarGraphic({ carType, imageUrl, className, colorName }: Props) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${carType} vehicle`}
        className={`mx-auto max-h-[280px] w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)] ${className ?? ""}`}
      />
    );
  }

  const isSedan = carType === "S70" || carType === "SAGA" || carType === "PERSONA";
  const isS70 = carType === "S70";
  const isX50 = carType === "X50";
  const isWhite = colorName?.toLowerCase().includes("white");

  // Colors tailored to Proton models (S70 Marine Blue as seen in reference screenshot)
  const primaryPaint = isWhite
    ? { start: "#ffffff", mid: "#e4e4e7", end: "#a1a1aa", highlight: "#ffffff" }
    : isS70
    ? { start: "#2563eb", mid: "#1d4ed8", end: "#1e3a8a", highlight: "#60a5fa" }
    : isX50
    ? { start: "#0284c7", mid: "#0369a1", end: "#075985", highlight: "#38bdf8" }
    : { start: "#3b82f6", mid: "#1d4ed8", end: "#172554", highlight: "#93c5fd" };

  return (
    <svg
      viewBox="0 0 680 240"
      className={`mx-auto w-full max-w-[620px] select-none ${className ?? ""}`}
      role="img"
      aria-label={`${carType} preview graphic`}
    >
      <defs>
        {/* Ground shadow */}
        <radialGradient id="car-ground-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Metallic body paint */}
        <linearGradient id="body-paint" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryPaint.highlight} stopOpacity="0.9" />
          <stop offset="25%" stopColor={primaryPaint.start} />
          <stop offset="65%" stopColor={primaryPaint.mid} />
          <stop offset="100%" stopColor={primaryPaint.end} />
        </linearGradient>

        {/* Roof reflection */}
        <linearGradient id="roof-reflection" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={primaryPaint.mid} />
          <stop offset="50%" stopColor={primaryPaint.highlight} stopOpacity="0.8" />
          <stop offset="100%" stopColor={primaryPaint.mid} />
        </linearGradient>

        {/* Glass tint */}
        <linearGradient id="car-glass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="35%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>

        {/* Alloy wheel metal */}
        <linearGradient id="alloy-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4f4f5" />
          <stop offset="50%" stopColor="#71717a" />
          <stop offset="100%" stopColor="#d4d4d8" />
        </linearGradient>

        {/* Headlight LED glow */}
        <linearGradient id="headlight-beam" x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#93c5fd" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>

        {/* Taillight LED red glow */}
        <linearGradient id="taillight-glow" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* 1. Ground contact shadow under tires and chassis */}
      <ellipse cx="340" cy="192" rx="270" ry="18" fill="url(#car-ground-shadow)" />

      {isSedan ? (
        /* ================= PROTON S70 SEDAN PROFILE ================= */
        <g>
          {/* Main Body Shell */}
          <path
            d="M 120 162
               L 100 156
               C 92 153, 86 145, 88 136
               C 92 120, 108 114, 138 110
               L 204 102
               C 238 98, 260 76, 290 64
               C 334 46, 420 46, 474 62
               C 514 74, 536 94, 574 104
               L 590 110
               C 602 114, 608 122, 606 132
               C 604 142, 594 150, 576 156
               L 554 160
               A 44 44 0 0 0 466 160
               L 230 160
               A 44 44 0 0 0 142 160
               Z"
            fill="url(#body-paint)"
          />

          {/* Underbody rocker panel / diffuser */}
          <path
            d="M 142 162 L 230 162 L 230 168 L 142 168 Z
               M 466 162 L 554 162 L 554 168 L 466 168 Z"
            fill="#09090b"
          />

          {/* Roof Line & Pillar Highlight */}
          <path
            d="M 216 100
               C 246 80, 274 66, 316 54
               C 362 42, 442 42, 492 56
               C 524 66, 546 86, 564 98
               L 556 100
               C 538 88, 516 70, 486 60
               C 438 46, 362 46, 320 58
               C 282 68, 254 84, 224 102
               Z"
            fill="url(#roof-reflection)"
          />

          {/* Greenhouse / Windows (Tinted Glass) */}
          <path
            d="M 234 98
               C 264 78, 288 64, 324 56
               C 368 48, 440 48, 480 60
               C 506 70, 524 84, 542 98
               L 528 100
               L 426 100
               L 338 100
               Z"
            fill="url(#car-glass)"
            stroke="#18181b"
            strokeWidth="2"
          />

          {/* B-Pillar & Window Division */}
          <rect x="372" y="52" width="10" height="48" fill="#09090b" />
          <path d="M 468 62 L 476 100" stroke="#09090b" strokeWidth="6" />

          {/* Chrome Window Trim Bottom Line */}
          <path
            d="M 226 100 L 546 100"
            stroke="#e4e4e7"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />

          {/* Sharp Dynamic Shoulder Crease */}
          <path
            d="M 126 112 C 220 108, 380 110, 584 116"
            stroke={primaryPaint.highlight}
            strokeWidth="2"
            strokeOpacity="0.7"
            fill="none"
          />

          {/* Lower Door Sculpt Crease */}
          <path
            d="M 170 148 C 260 144, 420 144, 520 148"
            stroke={primaryPaint.highlight}
            strokeWidth="1.2"
            strokeOpacity="0.4"
            fill="none"
          />

          {/* Door Shut Lines */}
          <path d="M 276 102 L 274 160" stroke="#0f172a" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 382 100 L 378 160" stroke="#0f172a" strokeWidth="1.5" strokeOpacity="0.6" />
          <path d="M 474 100 L 472 160" stroke="#0f172a" strokeWidth="1.5" strokeOpacity="0.6" />

          {/* Door Handles with Chrome Strip */}
          <rect x="312" y="112" width="22" height="4" rx="2" fill="#d4d4d8" />
          <rect x="420" y="112" width="22" height="4" rx="2" fill="#d4d4d8" />

          {/* Front LED Headlamp Unit */}
          <polygon points="90,132 116,118 132,120 106,138" fill="url(#headlight-beam)" />
          <path d="M 94 130 L 128 119" stroke="#ffffff" strokeWidth="2" />

          {/* Rear LED Taillamp Unit */}
          <polygon points="584,116 606,126 602,136 578,124" fill="url(#taillight-glow)" />
          <path d="M 584 118 L 606 128" stroke="#ef4444" strokeWidth="2.5" />

          {/* Front Bumper Lower Air Dam & Lip */}
          <path d="M 90 144 L 118 152 L 114 158 L 94 152 Z" fill="#09090b" />
        </g>
      ) : (
        /* ================= PROTON SUV PROFILE (X70 / X50) ================= */
        <g>
          {/* Main Body Shell */}
          <path
            d="M 124 162
               L 98 154
               C 88 150, 84 140, 86 130
               C 92 112, 112 106, 142 104
               L 210 98
               C 242 86, 268 62, 304 50
               C 356 36, 444 36, 506 48
               C 544 56, 566 78, 584 94
               L 596 114
               C 604 126, 604 138, 592 148
               L 568 158
               A 46 46 0 0 0 476 160
               L 236 160
               A 46 46 0 0 0 144 160
               Z"
            fill="url(#body-paint)"
          />

          {/* Roof Rails */}
          <path
            d="M 280 44 L 490 42"
            stroke="#71717a"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* SUV Greenhouse Windows */}
          <path
            d="M 238 94
               C 270 72, 296 54, 334 46
               C 382 38, 452 38, 492 48
               C 522 56, 544 72, 562 88
               L 550 94
               L 436 94
               L 338 94
               Z"
            fill="url(#car-glass)"
            stroke="#18181b"
            strokeWidth="2"
          />

          <rect x="382" y="44" width="12" height="50" fill="#09090b" />
          <path d="M 480 50 L 490 94" stroke="#09090b" strokeWidth="6" />

          {/* Shoulder Line */}
          <path
            d="M 130 106 C 240 102, 400 104, 586 110"
            stroke={primaryPaint.highlight}
            strokeWidth="2.2"
            strokeOpacity="0.7"
            fill="none"
          />

          {/* Cladding around arches */}
          <path
            d="M 136 162 A 52 52 0 0 1 244 162"
            stroke="#18181b"
            strokeWidth="7"
            fill="none"
          />
          <path
            d="M 468 162 A 52 52 0 0 1 576 162"
            stroke="#18181b"
            strokeWidth="7"
            fill="none"
          />
        </g>
      )}

      {/* ================= WHEELS & RIMS (FRONT & REAR) ================= */}
      {/* Front Wheel */}
      <g transform={`translate(${isSedan ? 186 : 190}, 160)`}>
        {/* Tire rubber */}
        <circle cx="0" cy="0" r="38" fill="#18181b" stroke="#09090b" strokeWidth="3" />
        {/* Rim outer lip */}
        <circle cx="0" cy="0" r="28" fill="#27272a" stroke="url(#alloy-rim)" strokeWidth="3" />
        {/* Brake Disc */}
        <circle cx="0" cy="0" r="18" fill="#3f3f46" />
        {/* Multi-spoke alloy wheels */}
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => (
          <line
            key={angle}
            x1="0"
            y1="0"
            x2={Math.cos((angle * Math.PI) / 180) * 26}
            y2={Math.sin((angle * Math.PI) / 180) * 26}
            stroke="url(#alloy-rim)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
        {/* Center cap with Proton gold shield / emblem accent */}
        <circle cx="0" cy="0" r="6" fill="#09090b" stroke="#d4af37" strokeWidth="1.5" />
      </g>

      {/* Rear Wheel */}
      <g transform={`translate(${isSedan ? 510 : 522}, 160)`}>
        {/* Tire rubber */}
        <circle cx="0" cy="0" r="38" fill="#18181b" stroke="#09090b" strokeWidth="3" />
        {/* Rim outer lip */}
        <circle cx="0" cy="0" r="28" fill="#27272a" stroke="url(#alloy-rim)" strokeWidth="3" />
        {/* Brake Disc */}
        <circle cx="0" cy="0" r="18" fill="#3f3f46" />
        {/* Multi-spoke alloy wheels */}
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => (
          <line
            key={angle}
            x1="0"
            y1="0"
            x2={Math.cos((angle * Math.PI) / 180) * 26}
            y2={Math.sin((angle * Math.PI) / 180) * 26}
            stroke="url(#alloy-rim)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
        {/* Center cap with Proton gold shield / emblem accent */}
        <circle cx="0" cy="0" r="6" fill="#09090b" stroke="#d4af37" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

