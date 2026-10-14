"use client";

import { motion } from "framer-motion";

type Props = {
  carType: string;
  imageUrl?: string | null;
  className?: string;
  colorName?: string | null;
  engineOn?: boolean;
  triggerKey?: number;
};

// Volumetric smoke plume billows expanding backwards and upwards from rear tyre contact patch
const plumeBillows = [
  // 1. Initial burst at tire contact patch
  { id: "b1", x: 6, y: 0, dx: 28, dy: -16, r0: 10, r1: 34, delay: 0.0, dur: 1.6, op: 0.85 },
  { id: "b2", x: 14, y: -4, dx: 42, dy: -26, r0: 12, r1: 42, delay: 0.08, dur: 1.7, op: 0.85 },
  { id: "b3", x: 2, y: 2, dx: 36, dy: -20, r0: 11, r1: 38, delay: 0.16, dur: 1.7, op: 0.8 },

  // 2. Rising lower plume expanding backwards behind tyre
  { id: "b4", x: 20, y: -8, dx: 58, dy: -40, r0: 14, r1: 52, delay: 0.24, dur: 1.8, op: 0.9 },
  { id: "b5", x: 10, y: -14, dx: 50, dy: -34, r0: 15, r1: 48, delay: 0.32, dur: 1.8, op: 0.85 },
  { id: "b6", x: 26, y: -10, dx: 72, dy: -48, r0: 16, r1: 58, delay: 0.4, dur: 1.9, op: 0.9 },

  // 3. Thick mid-plume billowing cloud
  { id: "b7", x: 18, y: -20, dx: 78, dy: -58, r0: 18, r1: 64, delay: 0.48, dur: 2.0, op: 0.85 },
  { id: "b8", x: 34, y: -16, dx: 92, dy: -66, r0: 20, r1: 68, delay: 0.58, dur: 2.0, op: 0.8 },
  { id: "b9", x: 14, y: -26, dx: 68, dy: -52, r0: 16, r1: 60, delay: 0.68, dur: 1.9, op: 0.8 },

  // 4. Upper plume curling upwards behind bumper
  { id: "b10", x: 28, y: -30, dx: 106, dy: -78, r0: 22, r1: 75, delay: 0.78, dur: 2.1, op: 0.75 },
  { id: "b11", x: 42, y: -24, dx: 120, dy: -84, r0: 24, r1: 80, delay: 0.88, dur: 2.1, op: 0.7 },
  { id: "b12", x: 22, y: -36, dx: 96, dy: -88, r0: 20, r1: 72, delay: 0.98, dur: 2.2, op: 0.65 },

  // 5. Late wisps trailing off into the atmosphere
  { id: "b13", x: 38, y: -38, dx: 130, dy: -98, r0: 24, r1: 85, delay: 1.1, dur: 2.2, op: 0.55 },
  { id: "b14", x: 50, y: -32, dx: 145, dy: -92, r0: 22, r1: 82, delay: 1.25, dur: 2.2, op: 0.5 },
];

const groundWisps = [
  { id: "gw1", x: 18, dx: 58, rx0: 14, rx1: 52, ry: 5, delay: 0.05, dur: 1.5, op: 0.7 },
  { id: "gw2", x: 32, dx: 86, rx0: 18, rx1: 72, ry: 6, delay: 0.25, dur: 1.8, op: 0.65 },
  { id: "gw3", x: 46, dx: 118, rx0: 22, rx1: 90, ry: 7, delay: 0.5, dur: 2.0, op: 0.55 },
];

export function CarGraphic({ carType, imageUrl, className, colorName, engineOn = false, triggerKey = 1 }: Props) {
  if (imageUrl) {
    return (
      <div className="relative">
        <motion.img
          key={`img-${triggerKey}`}
          src={imageUrl}
          alt={`${carType} vehicle`}
          animate={{
            y: [0, -2.4, 2.0, -2.2, 1.8, -1.6, 1.4, -1.2, 1.0, -0.7, 0.5, -0.3, 0.2, 0],
            rotate: [0, -0.32, 0.32, -0.26, 0.26, -0.18, 0.18, -0.12, 0.12, -0.06, 0.04, 0],
          }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
          className={`mx-auto max-h-[280px] w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)] ${className ?? ""}`}
        />
      </div>
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

  const rearX = isSedan ? 510 : 522;
  const rearY = 192;

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

        {/* Smoke Plume soft radial gradient */}
        <radialGradient id="plume-puff-gradient" cx="45%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="28%" stopColor="#f4f4f5" stopOpacity="0.75" />
          <stop offset="58%" stopColor="#d4d4d8" stopOpacity="0.45" />
          <stop offset="85%" stopColor="#a1a1aa" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#71717a" stopOpacity="0" />
        </radialGradient>

        {/* Volumetric blur filters for soft, cloud-like smoke plume */}
        <filter id="plume-soft-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="plume-thick-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* 1. Ground contact shadow under tires and chassis */}
      <ellipse cx="340" cy="192" rx="270" ry="18" fill="url(#car-ground-shadow)" />

      {/* 2. Rear Tyre Smoke Plume (Billowing cloud behind and above rear tyre) */}
      <g key={`smoke-plume-${triggerKey}`}>
        {/* Ground rolling wisps */}
        {groundWisps.map((w) => (
          <motion.ellipse
            key={w.id}
            cx={rearX + w.x}
            cy={194}
            rx={w.rx0}
            ry={w.ry}
            fill="url(#plume-puff-gradient)"
            filter="url(#plume-soft-blur)"
            initial={{ opacity: 0, cx: rearX + w.x, rx: w.rx0 }}
            animate={{
              opacity: [0, w.op, w.op * 0.45, 0],
              cx: rearX + w.x + w.dx,
              rx: w.rx1,
            }}
            transition={{
              duration: w.dur,
              delay: w.delay,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Expanding volumetric smoke plume billows */}
        {plumeBillows.map((p) => (
          <motion.circle
            key={p.id}
            cx={rearX + p.x}
            cy={rearY + p.y}
            r={p.r0}
            fill="url(#plume-puff-gradient)"
            filter={p.r1 > 50 ? "url(#plume-thick-blur)" : "url(#plume-soft-blur)"}
            initial={{
              opacity: 0,
              cx: rearX + p.x,
              cy: rearY + p.y,
              r: p.r0,
            }}
            animate={{
              opacity: [0, p.op, p.op * 0.75, p.op * 0.3, 0],
              cx: [rearX + p.x, rearX + p.x + p.dx * 0.5, rearX + p.x + p.dx],
              cy: [rearY + p.y, rearY + p.y + p.dy * 0.55, rearY + p.y + p.dy],
              r: [p.r0, p.r0 + (p.r1 - p.r0) * 0.55, p.r1],
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </g>

      {/* 3. Main Vibrating Car Body & Wheels Assembly (Wheels are static, chassis vibrates) */}
      <motion.g
        key={`car-assembly-${triggerKey}`}
        animate={{
          y: [0, -2.5, 2.0, -2.2, 1.8, -1.6, 1.4, -1.2, 1.0, -0.7, 0.5, -0.3, 0.2, 0],
          rotate: [0, -0.35, 0.35, -0.28, 0.28, -0.2, 0.2, -0.14, 0.14, -0.08, 0.04, 0],
        }}
        transition={{
          duration: 2.4,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "340px 180px" }}
      >
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
          /* ================= PROTON SUV PROFILE (X70 / X50 / X90) ================= */
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

        {/* ================= WHEELS & RIMS (STATIC, NO WHEEL ANIMATION) ================= */}
        {/* Front Wheel */}
        <g transform={`translate(${isSedan ? 186 : 190}, 160)`}>
          <circle cx="0" cy="0" r="38" fill="#18181b" stroke="#09090b" strokeWidth="3" />
          <circle cx="0" cy="0" r="28" fill="#27272a" stroke="url(#alloy-rim)" strokeWidth="3" />
          <circle cx="0" cy="0" r="18" fill="#3f3f46" />
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
          <circle cx="0" cy="0" r="6" fill="#09090b" stroke="#d4af37" strokeWidth="1.5" />
        </g>

        {/* Rear Wheel (Static, no wheel animation) */}
        <g transform={`translate(${rearX}, 160)`}>
          <circle cx="0" cy="0" r="38" fill="#18181b" stroke="#09090b" strokeWidth="3" />
          <circle cx="0" cy="0" r="28" fill="#27272a" stroke="url(#alloy-rim)" strokeWidth="3" />
          <circle cx="0" cy="0" r="18" fill="#3f3f46" />
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
          <circle cx="0" cy="0" r="6" fill="#09090b" stroke="#d4af37" strokeWidth="1.5" />
        </g>
      </motion.g>
    </svg>
  );
}
