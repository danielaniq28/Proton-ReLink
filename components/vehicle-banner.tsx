"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatTime } from "@/lib/format";
import type { Telemetry, Vehicle } from "@/lib/types";
import { CarGraphic } from "./car-graphic";

const fade = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

export function VehicleBanner({
  vehicle,
  telemetry,
  label,
}: {
  vehicle: Vehicle;
  telemetry: Telemetry;
  label: string;
}) {
  const updated = formatTime(telemetry.updatedAt);

  const statusText =
    label === "Climate"
      ? telemetry.climateOn
        ? `A/C Running (${telemetry.targetTemp}°C)`
        : "A/C Off"
      : telemetry.locked
      ? "Locked"
      : "Unlocked";

  const statusTone =
    label === "Climate"
      ? telemetry.climateOn
        ? "text-sky-400"
        : "text-zinc-400"
      : telemetry.locked
      ? "text-zinc-300"
      : "text-amber-400";

  return (
    <section className="mb-1.5 sm:mb-2.5 shrink-0">
      {/* 1. Header Text: Label, Car Model, Status, Updated */}
      <div className="flex flex-col">
        <div className="h-4 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={fade}
              className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase"
            >
              {label}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
            {vehicle.carType}
          </h1>
          {vehicle.plate ? (
            <span className="inline-flex items-center rounded-md border border-white/20 bg-black/80 px-2 py-0.5 text-xs font-bold tracking-wider text-white font-mono shadow-sm">
              {vehicle.plate}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-xs text-zinc-400 flex items-center gap-1.5 flex-wrap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={statusText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade}
              className={`font-medium ${statusTone}`}
            >
              {statusText}
            </motion.span>
          </AnimatePresence>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500">Updated {updated}</span>
        </div>
      </div>

      {/* 2. Centered Car Photo Preview with Fluid Animation */}
      <div className="relative my-1 sm:my-2 flex w-full items-center justify-center">
        <motion.div
          layoutId="vehicle-photo"
          data-vehicle-photo
          className="relative w-full max-w-xs sm:max-w-sm md:max-w-md flex items-center justify-center py-0.5"
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <CarGraphic
            carType={vehicle.carType}
            imageUrl={vehicle.imageUrl}
            colorName={vehicle.colorName}
            className="w-full max-w-xs sm:max-w-sm md:max-w-md h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
          />
        </motion.div>
      </div>
    </section>
  );
}
