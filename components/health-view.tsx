"use client";

import { motion } from "framer-motion";
import { formatNumber } from "@/lib/format";
import { useVehicle } from "./vehicle-provider";

const corners = [
  { key: "fl" as const, label: "Front left" },
  { key: "fr" as const, label: "Front right" },
  { key: "rl" as const, label: "Rear left" },
  { key: "rr" as const, label: "Rear right" },
];

export function HealthView() {
  const { vehicle, telemetry } = useVehicle();
  if (!vehicle || !telemetry) return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;

  const windows = telemetry.windowsVent ? "Vent" : telemetry.windowsOpen ? "Open" : "Closed";
  const rows = [
    { label: "Battery voltage", value: telemetry.batteryVoltage == null ? "—" : `${telemetry.batteryVoltage.toFixed(1)} V` },
    { label: "Door locks", value: telemetry.locked ? "Locked" : "Unlocked" },
    { label: "Windows", value: windows },
    { label: "Trunk", value: telemetry.trunkOpen ? "Open" : "Closed" },
    { label: "Engine", value: telemetry.engineOn ? "Running" : "Off" },
    { label: "A/C", value: telemetry.climateOn ? "On" : "Off" },
    { label: "Odometer", value: `${formatNumber(telemetry.odometerKm)} km` },
    { label: "Distance to service", value: `${formatNumber(telemetry.serviceKm)} km` },
    { label: "Hood", value: telemetry.hoodOpen ? "Open" : "Closed" },
  ];

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <p className="text-xs tracking-[0.2em] text-[#d4af37] uppercase font-medium">Health</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">Tyres & Status</h1>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {corners.map((corner, index) => {
          const tire = telemetry.tires[corner.key];
          return (
            <motion.div
              key={corner.key}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.015 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <p className="text-[11px] tracking-widest text-zinc-500 uppercase">{corner.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${tire.warning ? "text-rose-300" : "text-white"}`}>{tire.pressureKpa}</p>
              <p className="text-xs text-zinc-500">kPa</p>
            </motion.div>
          );
        })}
      </section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, delay: 0.12 }}
        className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.02]"
      >
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3.5 last:border-b-0 sm:px-5">
            <span className="min-w-0 text-sm text-zinc-400">{row.label}</span>
            <span className="shrink-0 text-right font-medium text-white">{row.value}</span>
          </div>
        ))}
      </motion.section>
    </div>
  );
}
