"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronRight, Fan, LocateFixed, SlidersHorizontal } from "lucide-react";
import { CarGraphic } from "./car-graphic";
import { useDashboardNav } from "./dashboard-nav";
import { FuelArc, rangeTone } from "./fuel-arc";
import { formatNumber } from "@/lib/format";
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
  const [triggerKey, setTriggerKey] = useState(1);
  const [isTriggering, setIsTriggering] = useState(false);

  function handleTriggerPlume() {
    setTriggerKey((k) => k + 1);
    setIsTriggering(true);
    setTimeout(() => {
      setIsTriggering(false);
    }, 2400);
  }

  if (loading || !vehicle || !telemetry) {
    return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;
  }

  const maxTankLitres = getMaxTankCapacity(vehicle.carType);
  const currentFuelLitres =
    telemetry.fuelLitres != null
      ? Math.min(maxTankLitres, telemetry.fuelLitres)
      : Math.round(((telemetry.fuelPercent ?? 0) / 100) * maxTankLitres * 10) / 10;
  const fuelPercent = Math.max(0, Math.min(100, telemetry.fuelPercent ?? (currentFuelLitres / maxTankLitres) * 100));

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

  const stats: Array<{ label: string; value: string; dot?: "green" | "amber" }> = [
    {
      label: "Engine",
      value: telemetry.engineOn ? "Running" : "Off",
      dot: telemetry.engineOn ? "amber" : "green",
    },
    { label: "Efficiency", value: `${telemetry.efficiencyLPer100.toFixed(1)} L / 100 km` },
    { label: "Fuel", value: `${currentFuelLitres.toFixed(currentFuelLitres % 1 === 0 ? 0 : 1)} / ${maxTankLitres} L` },
    { label: "Service in", value: `${formatNumber(telemetry.serviceKm)} km` },
  ];
  const tone = rangeTone(telemetry.rangeKm);

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-6">
      {/* 1. TOP: Vehicle Hero Card with Range Arc and Car Photo */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="truncate text-[11px] tracking-[0.16em] text-zinc-400 uppercase font-semibold">{vehicle.colorName || "Proton"}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-white mt-0.5">{vehicle.carType}</h1>
            <p className="mt-0.5 truncate text-xs sm:text-sm text-zinc-400">{vehicle.plate || vehicle.vin}</p>
          </div>
          <div className="relative shrink-0">
            <FuelArc percent={telemetry.fuelPercent} rangeKm={telemetry.rangeKm} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 sm:pt-4">
              <motion.span
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                animate={tone.level === "ok" ? { opacity: 1, color: tone.color } : { opacity: [1, 0.4, 1], color: tone.color }}
                transition={tone.level === "ok" ? { duration: 0.2 } : { duration: tone.level === "low" ? 0.9 : 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {telemetry.rangeKm}
              </motion.span>
              <span className="text-[11px] tracking-widest uppercase" style={{ color: tone.level === "ok" ? "#71717a" : tone.color }}>
                km
              </span>
            </div>
          </div>
        </div>
        <div
          onClick={handleTriggerPlume}
          className="group relative mt-2 flex cursor-pointer flex-col items-center justify-center py-2 select-none"
          title="Click to trigger smoke plume & vibration"
        >
          <CarGraphic
            carType={vehicle.carType}
            imageUrl={vehicle.imageUrl}
            colorName={vehicle.colorName}
            engineOn={telemetry.engineOn}
            triggerKey={triggerKey}
            className="max-h-36 sm:max-h-48 md:max-h-56 w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)] transition-transform duration-200 group-hover:scale-[1.01] active:scale-[0.99]"
          />
        </div>

        {/* Interior & Exterior Temperatures and Smoke Plume Trigger */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Interior</span>
            <span className="font-semibold text-white">{telemetry.interiorTemp}°C</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Exterior</span>
            <span className="font-semibold text-white">{telemetry.exteriorTemp}°C</span>
          </div>
          <button
            type="button"
            onClick={handleTriggerPlume}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 transition-all cursor-pointer active:scale-95 ${
              isTriggering
                ? "border-amber-400/50 bg-amber-500/20 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)]"
                : "border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white"
            }`}
          >
            <span className="text-xs">💨</span>
            <span className="text-[11px] font-medium">{isTriggering ? "Revving..." : "Smoke Plume"}</span>
          </button>
        </div>

        {/* Progress Bars: Service Schedule & Fuel Level */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] px-1 flex flex-col gap-3">
          {/* Next Service Scheduled */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Next Service Scheduled</span>
              <span className="text-xs font-semibold text-white">{formatNumber(telemetry.serviceKm)} km</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, Math.min(100, ((10000 - (telemetry.serviceKm % 10000)) / 10000) * 100))}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-white"
              />
            </div>
          </div>

          {/* Fuel Indicator Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">Fuel Level</span>
                <span className="text-[10px] text-zinc-500 font-normal">({maxTankLitres}L max tank)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">
                  {currentFuelLitres.toFixed(currentFuelLitres % 1 === 0 ? 0 : 1)} / {maxTankLitres} L
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">({Math.round(fuelPercent)}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fuelPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full transition-colors ${
                  fuelPercent <= 15 ? "bg-rose-400" : fuelPercent <= 25 ? "bg-amber-400" : "bg-white"
                }`}
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
        Help improve this app ✨
      </button>

      <AnimatePresence>
        {donate ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 cursor-pointer"
            onClick={() => setDonate(false)}
          >
            <motion.img
              src="/maybank-qr.jpg"
              alt="Maybank QR, Muhammad Daniel Aniq Bin"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[80vh] w-full max-w-sm rounded-[28px] object-contain"
            />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
