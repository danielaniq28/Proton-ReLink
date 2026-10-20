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
  const rows: Array<{ label: string; value: string; dot?: "green" | "amber" }> = [
    { label: "Door locks", value: telemetry.locked ? "Locked" : "Unlocked", dot: telemetry.locked ? "green" : "amber" },
    { label: "Windows", value: windows, dot: !telemetry.windowsOpen && !telemetry.windowsVent ? "green" : "amber" },
    { label: "Trunk", value: telemetry.trunkOpen ? "Open" : "Closed", dot: telemetry.trunkOpen ? "amber" : "green" },
    { label: "Hood", value: telemetry.hoodOpen ? "Open" : "Closed", dot: telemetry.hoodOpen ? "amber" : "green" },
    { label: "Engine", value: telemetry.engineOn ? "Running" : "Off", dot: telemetry.engineOn ? "amber" : "green" },
    { label: "A/C", value: telemetry.climateOn ? "On" : "Off", dot: telemetry.climateOn ? "amber" : "green" },
    { label: "Battery voltage", value: telemetry.batteryVoltage == null ? "—" : `${telemetry.batteryVoltage.toFixed(1)} V` },
    { label: "Odometer", value: `${formatNumber(telemetry.odometerKm)} km` },
    { label: "Distance to service", value: `${formatNumber(telemetry.serviceKm)} km` },
    {
      label: "4G TCU data (OpenAPI /flow)",
      value:
        telemetry.remainingDataGb != null
          ? `${telemetry.remainingDataGb.toFixed(2)} / ${telemetry.totalDataGb ?? 2} GB (${telemetry.rawUsedFlow || (telemetry.usedDataGb != null && telemetry.usedDataGb < 0.01 ? `${Math.round(telemetry.usedDataGb * 1024)} MB` : `${(telemetry.usedDataGb ?? 0).toFixed(2)} GB`)} used)`
          : "—",
      dot: telemetry.remainingDataGb != null ? (telemetry.remainingDataGb < 0.25 ? "amber" : "green") : undefined,
    },
    { label: "Telematics protocol", value: (telemetry.backend || vehicle.backend) === "atlas" ? "ACO Tech · ATLAS" : "ECARX · Legacy" },
  ];

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      {/* Consistent iOS Header */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">Health</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-0.5">Vehicle Health</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          {vehicle.carType} · {vehicle.plate || vehicle.vin}
        </p>
      </div>

      {/* 1. Tyre Pressures Section */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          Tyre Pressures
        </h2>
        <section className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
          {corners.map((corner, index) => {
            const tire = telemetry.tires[corner.key];
            return (
              <motion.div
                key={corner.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 transition-all hover:border-white/[0.14]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-[11px] font-medium tracking-wider text-zinc-400 uppercase">{corner.label}</p>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      tire.warning
                        ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                        : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                    }`}
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className={`text-2xl sm:text-3xl font-semibold tracking-tight ${tire.warning ? "text-rose-400" : "text-white"}`}>
                    {tire.pressureKpa}
                  </span>
                  <span className="text-xs text-zinc-400">kPa</span>
                </div>
              </motion.div>
            );
          })}
        </section>
      </div>

      {/* 2. System Diagnostics Section */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          System Diagnostics
        </h2>
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] divide-y divide-white/[0.05]"
        >
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
              <span className="min-w-0 text-xs sm:text-sm text-zinc-400">{row.label}</span>
              <span className="flex items-center gap-1.5 shrink-0 text-xs sm:text-sm font-medium text-white">
                {row.dot ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      row.dot === "green"
                        ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                        : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                    }`}
                  />
                ) : null}
                <span>{row.value}</span>
              </span>
            </div>
          ))}
        </motion.section>
      </div>
    </div>
  );
}
