"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Check, Copy, ExternalLink } from "lucide-react";
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!vehicle || !telemetry) return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField((cur) => (cur === field ? null : cur));
      }, 2000);
    }
  };

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

      {/* 3. Service Appointment Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400">
            Service &amp; Maintenance
          </h2>
          {telemetry.serviceKm != null ? (
            <span className="text-[11px] font-medium text-zinc-400">
              Next in <span className="text-white font-semibold">{formatNumber(telemetry.serviceKm)} km</span>
            </span>
          ) : null}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 sm:p-5 transition-all hover:border-white/[0.14]"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.06] text-white">
                <CalendarCheck className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                  Proton Service Appointment
                </h3>
                <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
                  Book regular service, scheduled maintenance, or vehicle inspection with authorised Proton Service Centres.
                </p>
              </div>
            </div>

            {/* Quick-reference helper pills for filling the Proton booking form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Plate No.</p>
                  <p className="text-xs font-semibold text-white truncate">{vehicle.plate || "Not set"}</p>
                </div>
                {vehicle.plate ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(vehicle.plate, "plate")}
                    title="Copy Plate Number"
                    aria-label="Copy Plate Number"
                    className="p-1 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer hover:bg-white/10"
                  >
                    {copiedField === "plate" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                ) : null}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">VIN</p>
                  <p className="text-xs font-mono font-medium text-white truncate" title={vehicle.vin}>{vehicle.vin}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(vehicle.vin, "vin")}
                  title="Copy VIN"
                  aria-label="Copy VIN"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer hover:bg-white/10 shrink-0"
                >
                  {copiedField === "vin" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Current Mileage</p>
                  <p className="text-xs font-semibold text-white truncate">{formatNumber(telemetry.odometerKm)} km</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(String(telemetry.odometerKm || 0), "mileage")}
                  title="Copy Mileage"
                  aria-label="Copy Mileage"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer hover:bg-white/10"
                >
                  {copiedField === "mileage" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Service appointment button requested */}
            <a
              href="https://www.proton.com/after-sales/service-appointment"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-white text-xs sm:text-sm font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.99] cursor-pointer shadow-md shadow-white/5"
            >
              <CalendarCheck className="h-4 w-4 text-black" />
              <span>Set service appointment</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 ml-0.5" />
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
