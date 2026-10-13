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
    <div className="flex w-full flex-col gap-4 sm:gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(17rem,24rem)] xl:items-start">
      <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-gradient-to-b from-white/[0.05] to-transparent px-3 pt-5 pb-2 sm:px-4 sm:pt-6">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="truncate text-xs tracking-[0.2em] text-zinc-500 uppercase">{vehicle.colorName || "Proton"}</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{vehicle.carType}</h1>
            <p className="mt-1 truncate text-sm text-zinc-400">{vehicle.plate || vehicle.vin}</p>
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
        <motion.div layoutId="vehicle-photo" transition={{ type: "spring", stiffness: 260, damping: 32 }}>
          <CarGraphic carType={vehicle.carType} imageUrl={vehicle.imageUrl} />
        </motion.div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:col-start-1">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] tracking-widest text-zinc-500 uppercase">{stat.label}</p>
            <p className="mt-2 text-lg font-medium">
              {stat.label === "Efficiency" ? (
                <>
                  {telemetry.efficiencyLPer100.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-zinc-400">L / 100 km</span>
                </>
              ) : (
                stat.value
              )}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:grid-cols-1">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                go(item.href);
              }}
              className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.06]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.title}</span>
                <span className="block text-sm text-zinc-500">{item.copy}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-600 transition group-hover:translate-x-0.5" />
            </a>
          );
        })}
        <button
          type="button"
          onClick={() => setDonate(true)}
          className="mx-auto text-xs text-zinc-500 transition hover:text-zinc-200"
        >
          Help improve this app ✨
        </button>
      </section>

      <AnimatePresence>
        {donate ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
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
