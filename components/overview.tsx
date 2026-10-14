"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronRight, Fan, LocateFixed, SlidersHorizontal } from "lucide-react";
import { CarGraphic } from "./car-graphic";
import { useDashboardNav } from "./dashboard-nav";
import { FuelArc, rangeTone } from "./fuel-arc";
import { formatNumber } from "@/lib/format";
import { useVehicle } from "./vehicle-provider";

const modules = [
  { href: "/dashboard/controls", title: "Remote Control", copy: "Locks, engine, windows, trunk", icon: SlidersHorizontal },
  { href: "/dashboard/climate", title: "Climate", copy: "Cabin temperature", icon: Fan },
  { href: "/dashboard/health", title: "Car Status", copy: "Pressures, fluids, service interval", icon: Activity },
  { href: "/dashboard/map", title: "Find My Car", copy: "Last parked position", icon: LocateFixed },
];

export function Overview() {
  const { vehicle, telemetry, loading } = useVehicle();
  const { go } = useDashboardNav();
  const [donate, setDonate] = useState(false);
  if (loading || !vehicle || !telemetry) {
    return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;
  }

  const stats = [
    { label: "Engine", value: telemetry.engineOn ? "Running" : "Off" },
    { label: "Efficiency", value: `${telemetry.efficiencyLPer100.toFixed(1)} L / 100 km` },
    { label: "Fuel", value: telemetry.fuelLitres != null ? `${telemetry.fuelLitres} L` : `${Math.round(telemetry.fuelPercent)}%` },
    { label: "Service in", value: `${formatNumber(telemetry.serviceKm)} km` },
  ];
  const tone = rangeTone(telemetry.rangeKm);

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-6">
      {/* 1. TOP: Vehicle Hero Card with Range Arc and Car Photo */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-gradient-to-b from-white/[0.05] to-transparent px-4 pt-5 pb-3 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="truncate text-xs tracking-[0.2em] text-[#d4af37] uppercase font-medium">{vehicle.colorName || "Proton"}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl text-white">{vehicle.carType}</h1>
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
        <motion.div
          layoutId="vehicle-photo"
          data-vehicle-photo
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="mt-3 flex items-center justify-center py-2"
        >
          <CarGraphic
            carType={vehicle.carType}
            imageUrl={vehicle.imageUrl}
            colorName={vehicle.colorName}
            className="max-h-36 sm:max-h-48 md:max-h-56 w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)]"
          />
        </motion.div>
      </section>

      {/* 2. MIDDLE: Remote Control, Climate, Car Status, Find My Car Buttons */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {modules.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.href}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.08 + index * 0.035 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => go(item.href)}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.06] cursor-pointer shadow-lg shadow-black/20"
            >
              <div className="flex items-center justify-between mb-3 w-full">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white group-hover:bg-[#d4af37]/20 group-hover:text-[#d4af37] transition-colors">
                  <Icon className="h-5 w-5" />
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <div className="min-w-0 w-full">
                <span className="block font-semibold text-white tracking-tight text-sm sm:text-base">{item.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-400 leading-tight truncate">{item.copy}</span>
              </div>
            </motion.button>
          );
        })}
      </section>

      {/* 3. BOTTOM: Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.16 + index * 0.03 }}
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
          >
            <p className="text-[11px] tracking-widest text-zinc-500 uppercase">{stat.label}</p>
            <p className="mt-1.5 text-lg font-semibold text-white">
              {stat.label === "Efficiency" ? (
                <>
                  {telemetry.efficiencyLPer100.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-zinc-400">L / 100 km</span>
                </>
              ) : (
                stat.value
              )}
            </p>
          </motion.div>
        ))}
      </section>

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
