"use client";

import { motion } from "framer-motion";

export function rangeTone(rangeKm: number) {
  if (rangeKm <= 50) return { level: "low" as const, color: "#f2a3a0" };
  if (rangeKm <= 100) return { level: "warn" as const, color: "#e6b15a" };
  return { level: "ok" as const, color: "#f4f4f5" };
}

export function FuelArc({ percent, rangeKm = 999, className }: { percent: number; rangeKm?: number; className?: string }) {
  const value = Math.max(0, Math.min(100, percent));
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const visible = circumference * 0.72;
  const dash = (value / 100) * visible;
  const tone = rangeTone(rangeKm);
  const alerting = tone.level !== "ok";

  return (
    <svg viewBox="0 0 220 180" className={className ?? "h-28 w-32 sm:h-36 sm:w-44"}>
      <circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${visible} ${circumference}`}
        transform="rotate(140 110 110)"
      />
      <motion.circle
        cx="110"
        cy="110"
        r={radius}
        fill="none"
        stroke={tone.color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        transform="rotate(140 110 110)"
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={alerting ? { strokeDasharray: `${dash} ${circumference}`, opacity: [1, 0.35, 1] } : { strokeDasharray: `${dash} ${circumference}`, opacity: 1 }}
        transition={
          alerting
            ? { opacity: { duration: tone.level === "low" ? 0.9 : 1.5, repeat: Infinity, ease: "easeInOut" }, strokeDasharray: { type: "spring", stiffness: 80, damping: 20 } }
            : { type: "spring", stiffness: 80, damping: 20 }
        }
        style={alerting ? { filter: `drop-shadow(0 0 6px ${tone.color})` } : undefined}
      />
    </svg>
  );
}
