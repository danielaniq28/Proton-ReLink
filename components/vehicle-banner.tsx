"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatTime } from "@/lib/format";
import type { Telemetry, Vehicle } from "@/lib/types";
import { CarGraphic } from "./car-graphic";

const fade = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

export function VehicleBanner({ vehicle, telemetry, label }: { vehicle: Vehicle; telemetry: Telemetry; label: string }) {
  const updated = formatTime(telemetry.updatedAt);

  return (
    <section className="mb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-4 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} className="text-xs tracking-[0.2em] text-zinc-500 uppercase">
                {label}
              </motion.p>
            </AnimatePresence>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{vehicle.carType}</h1>
        </div>
        <p className="text-sm text-zinc-400 sm:text-right">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={telemetry.locked ? "locked" : "unlocked"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} className="inline-block">
              {telemetry.locked ? "Locked" : "Unlocked"}
            </motion.span>
          </AnimatePresence>
          <span className="mt-1 block text-xs text-zinc-500">Updated {updated}</span>
        </p>
      </div>
      <motion.div layoutId="vehicle-photo" data-vehicle-photo className="mt-2" transition={{ type: "spring", stiffness: 260, damping: 32 }}>
        <CarGraphic carType={vehicle.carType} imageUrl={vehicle.imageUrl} className="max-h-48" />
      </motion.div>
    </section>
  );
}
