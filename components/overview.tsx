"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Check, ChevronRight, Copy, Fan, Fuel, LocateFixed, SlidersHorizontal, X } from "lucide-react";
import { CarGraphic } from "./car-graphic";
import { useDashboardNav } from "./dashboard-nav";
import { FuelArc, rangeTone } from "./fuel-arc";
import { formatNumber } from "@/lib/format";
import { resolveProtonColorName } from "@/lib/color";
import { useVehicle } from "./vehicle-provider";

function getMaxTankCapacity(carType: string): number {
  const upper = carType.toUpperCase();
  if (upper.includes("S70")) return 50;
  if (upper.includes("X50")) return 45;
  if (upper.includes("X70")) return 60;
  if (upper.includes("X90")) return 60;
  if (upper.includes("SAGA")) return 40;
  if (upper.includes("PERSONA") || upper.includes("IRIZ")) return 40;
  return 50;
}

export function Overview() {
  const { vehicle, telemetry, loading } = useVehicle();
  const { go } = useDashboardNav();
  const [donate, setDonate] = useState(false);
  const [copied, setCopied] = useState(false);

  if (loading || !vehicle || !telemetry) {
    return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;
  }

  const maxTankLitres = getMaxTankCapacity(vehicle.carType);
  const currentFuelLitres =
    telemetry.fuelLitres != null
      ? Math.min(maxTankLitres, telemetry.fuelLitres)
      : Math.round(((telemetry.fuelPercent ?? 0) / 100) * maxTankLitres * 10) / 10;
  const fuelPercent = Math.max(0, Math.min(100, telemetry.fuelPercent ?? (currentFuelLitres / maxTankLitres) * 100));

  const servicePercent = Math.max(8, Math.min(100, Math.round(((10000 - ((telemetry.serviceKm ?? 0) % 10000)) / 10000) * 100)));

  const modules = [
    {
      href: "/dashboard/controls",
      title: "Remote Control",
      copy: "Locks, engine, windows, trunk",
      icon: SlidersHorizontal,
    },
    {
      href: "/dashboard/climate",
      title: "Climate",
      copy: "Cabin temperature & A/C",
      icon: Fan,
    },
    {
      href: "/dashboard/health",
      title: "Car Status",
      copy: "Tyres, battery, diagnostics",
      icon: Activity,
    },
    {
      href: "/dashboard/map",
      title: "Find My Car",
      copy: "Live map & parked location",
      icon: LocateFixed,
    },
  ];

  const batteryVoltage = telemetry.batteryVoltage ?? 12.6;
  const isBatteryLow = batteryVoltage < 12.0;

  const stats: Array<{ label: string; value: string; dot?: "green" | "amber" }> = [
    {
      label: "Engine",
      value: telemetry.engineOn ? "Running" : "Off",
      dot: telemetry.engineOn ? "amber" : "green",
    },
    { label: "Efficiency", value: `${telemetry.efficiencyLPer100.toFixed(1)} L / 100 km` },
    {
      label: "Battery",
      value: `${batteryVoltage.toFixed(1)} V`,
      dot: isBatteryLow ? "amber" : "green",
    },
    { label: "Service in", value: `${formatNumber(telemetry.serviceKm)} km` },
  ];
  const tone = rangeTone(telemetry.rangeKm, fuelPercent);

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-6">
      {/* 1. TOP: Vehicle Hero Card with Range Arc and Car Photo */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="truncate text-[11px] tracking-[0.16em] text-zinc-400 uppercase font-semibold">
                {resolveProtonColorName(vehicle.colorName, vehicle.carType) || "Proton"}
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${
                  (telemetry.backend || vehicle.backend) === "atlas"
                    ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    (telemetry.backend || vehicle.backend) === "atlas" ? "bg-amber-400" : "bg-cyan-400"
                  }`}
                />
                {(telemetry.backend || vehicle.backend) === "atlas" ? "ACO Tech · ATLAS" : "ECARX · Legacy"}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-white mt-0.5">{vehicle.carType}</h1>
            <p className="mt-0.5 truncate text-xs sm:text-sm text-zinc-400">
              {vehicle.plate || vehicle.vin}
            </p>
          </div>
          <div className="relative shrink-0">
            <FuelArc percent={fuelPercent} rangeKm={telemetry.rangeKm} />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1.5 sm:pb-2.5">
              <div className="flex items-baseline gap-0.5">
                <motion.span
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                  animate={tone.level === "ok" ? { opacity: 1, color: tone.color } : { opacity: [1, 0.4, 1], color: tone.color }}
                  transition={tone.level === "ok" ? { duration: 0.2 } : { duration: tone.blinkDuration, repeat: Infinity, ease: "easeInOut" }}
                >
                  {telemetry.rangeKm}
                </motion.span>
                <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: tone.level === "ok" ? "#71717a" : tone.color }}>
                  km
                </span>
              </div>
              <div className="mt-0.5 sm:mt-1 flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 backdrop-blur-sm shadow-sm">
                <Fuel className={`h-2.5 w-2.5 shrink-0 ${fuelPercent <= 5 ? "text-red-400" : fuelPercent <= 15 ? "text-amber-400" : fuelPercent <= 25 ? "text-amber-400" : "text-zinc-400"}`} />
                <span className={`text-[10px] sm:text-[11px] font-semibold tabular-nums ${fuelPercent <= 5 ? "text-red-300" : fuelPercent <= 15 ? "text-amber-300" : fuelPercent <= 25 ? "text-amber-300" : "text-zinc-200"}`}>
                  {Math.round(fuelPercent)}%
                </span>
              </div>
              <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-medium tracking-tight text-zinc-400 tabular-nums">
                {currentFuelLitres.toFixed(currentFuelLitres % 1 === 0 ? 0 : 1)}/{maxTankLitres}L
              </span>
            </div>
          </div>
        </div>
        <div className="relative mt-2 flex w-full flex-col items-center justify-center py-2 select-none">
          <CarGraphic
            carType={vehicle.carType}
            imageUrl={vehicle.imageUrl}
            colorName={vehicle.colorName}
            engineOn={telemetry.engineOn}
            className="w-full max-w-[560px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)]"
          />
        </div>

        {/* Interior & Exterior Temperatures */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Interior</span>
            <span className="font-semibold text-white">{telemetry.interiorTemp}°C</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Exterior</span>
            <span className="font-semibold text-white">{telemetry.exteriorTemp}°C</span>
          </div>
        </div>

        {/* Average Speed */}
        <div className="mt-1.5 flex items-center justify-center text-xs">
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Avg Speed</span>
            <span className="font-semibold text-white">{telemetry.avgSpeedKmh ?? 48} km/h</span>
          </div>
        </div>

        {/* Progress Bar: Service Schedule */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] px-1 flex flex-col gap-3">
          {/* Next Service Scheduled */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Next Service Scheduled</span>
              <span className="text-xs font-semibold text-white">{formatNumber(telemetry.serviceKm)} km</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${servicePercent}%` }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="h-full rounded-full bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. MIDDLE: Diagnostics & Stats */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          Diagnostics & Stats
        </h2>
        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.06 + index * 0.03 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"
            >
              <p className="text-[11px] tracking-widest text-zinc-500 uppercase">{stat.label}</p>
              <div className="mt-1.5 flex items-center gap-2 text-lg font-semibold text-white">
                {stat.dot ? (
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      stat.dot === "green"
                        ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                        : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                    }`}
                  />
                ) : null}
                <span>
                  {stat.label === "Efficiency" ? (
                    <>
                      {telemetry.efficiencyLPer100.toFixed(1)}
                      <span className="ml-1 text-xs font-normal text-zinc-400">L / 100 km</span>
                    </>
                  ) : stat.label === "Battery" ? (
                    <>
                      {batteryVoltage.toFixed(1)}
                      <span className="ml-1 text-xs font-normal text-zinc-400">V</span>
                    </>
                  ) : (
                    stat.value
                  )}
                </span>
              </div>
            </motion.div>
          ))}
        </section>
      </div>

      {/* 3. BOTTOM: Remote Control, Climate, Car Status, Find My Car Buttons */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          Quick Actions
        </h2>
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {modules.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.href}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.12 + index * 0.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => go(item.href)}
                className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-left transition-all hover:border-white/[0.16] hover:bg-white/[0.07] active:scale-[0.98] cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between mb-3 w-full">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-200 group-hover:bg-white/[0.12] group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
                <div className="min-w-0 w-full">
                  <span className="block font-semibold text-white tracking-tight text-sm sm:text-base">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-zinc-400 leading-tight truncate">{item.copy}</span>
                </div>
              </motion.button>
            );
          })}
        </section>
      </div>

      <button
        type="button"
        onClick={() => setDonate(true)}
        className="mx-auto text-xs text-zinc-500 transition hover:text-zinc-200 cursor-pointer pt-1"
      >
        Support me ✨
      </button>

      <AnimatePresence>
        {donate ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
            onClick={() => setDonate(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Support Developer"
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/10 bg-[#121216]/95 p-5 text-center shadow-2xl backdrop-blur-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setDonate(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 hover:bg-white/[0.12] hover:text-white transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="w-full pr-6 text-left">
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">Support Developer</p>
                <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">Maybank DuitNow QR</h3>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed text-left">
                I&apos;m also a proton user who got tired of getting stuck with old and outdated user interface. Feel free to support me by donating. Any amount is appreciated.
              </p>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white p-2 shadow-inner">
                <img
                  src="/maybank-qr.jpg"
                  alt="Maybank QR, Muhammad Daniel Aniq Bin"
                  className="h-auto max-h-[40vh] w-full rounded-xl object-contain"
                />
              </div>

              {/* Bank Transfer Details Card */}
              <div className="mt-3.5 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400">Manual Transfer</span>
                  <span className="text-xs font-semibold text-amber-300">Maybank</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Account Number</p>
                    <p className="font-mono text-sm font-semibold tracking-wider text-white select-all">
                      1520-6907-4266
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        void navigator.clipboard.writeText("152069074266");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.12] hover:text-white cursor-pointer active:scale-95 shadow-sm"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-300" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="mt-2 pt-2 border-t border-white/[0.06] text-xs text-zinc-400">
                  Account Name: <span className="text-white font-medium">Muhammad Daniel Aniq</span>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
