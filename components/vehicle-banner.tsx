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

  return (
    <section className="mb-2.5 sm:mb-4">
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Page Label, Car Name, Status */}
        <div className="min-w-0 flex-1">
          <div className="h-4 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={label}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={fade}
                className="text-[11px] font-semibold tracking-[0.2em] text-[#d4af37] uppercase"
              >
                {label}
              </motion.p>
            </AnimatePresence>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl truncate leading-tight">
            {vehicle.carType}
          </h1>
          <p className="mt-0.5 text-[11px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={telemetry.locked ? "locked" : "unlocked"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
                className={`font-medium ${telemetry.locked ? "text-emerald-400" : "text-amber-400"}`}
              >
                {telemetry.locked ? "Locked" : "Unlocked"}
              </motion.span>
            </AnimatePresence>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">Updated {updated}</span>
          </p>
        </div>

        {/* Right Side: Compact Car Photo with Fluid Animation */}
        <motion.div
          layoutId="vehicle-photo"
          data-vehicle-photo
          className="relative shrink-0 w-28 sm:w-40 md:w-52 flex items-center justify-end"
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
        >
          <CarGraphic
            carType={vehicle.carType}
            imageUrl={vehicle.imageUrl}
            className="max-h-12 sm:max-h-16 md:max-h-20 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
          />
        </motion.div>
      </div>
    </section>
  );
}
