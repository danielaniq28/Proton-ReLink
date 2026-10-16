"use client";

import { motion } from "framer-motion";
import { formatDateTime } from "@/lib/format";
import { useVehicle } from "./vehicle-provider";
import { TripLog } from "./trip-log";

export function MapView() {
  const { vehicle, telemetry, refresh } = useVehicle();
  if (!vehicle || !telemetry) return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;

  const pad = 0.012;
  const bbox = `${telemetry.longitude - pad},${telemetry.latitude - pad},${telemetry.longitude + pad},${telemetry.latitude + pad}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${telemetry.latitude}%2C${telemetry.longitude}`;
  const maps = `https://www.google.com/maps/search/?api=1&query=${telemetry.latitude},${telemetry.longitude}`;
  const updated = formatDateTime(telemetry.updatedAt);

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      {/* Consistent iOS Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">Location</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-0.5">Find My Car</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {telemetry.place || "Parked position"} · Updated {updated}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95 cursor-pointer shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* 1. Live Map Section */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          Live Map
        </h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08]"
        >
          <iframe title="Vehicle location" src={src} className="h-64 w-full sm:h-[400px] [filter:grayscale(1)_invert(0.92)_contrast(0.9)]" />
        </motion.div>

        <motion.a
          href={maps}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.98 }}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] shadow-sm cursor-pointer"
        >
          Open directions in Google Maps
        </motion.a>
      </div>

      {/* 2. Coordinates & Telemetry Section */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          Coordinates & Telemetry
        </h2>
        <section className="grid gap-2.5 sm:gap-3.5 sm:grid-cols-3">
          {[
            { label: "Latitude", value: telemetry.latitude.toFixed(5) },
            { label: "Longitude", value: telemetry.longitude.toFixed(5) },
            { label: "Updated", value: updated },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.03 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"
            >
              <p className="text-[10px] sm:text-[11px] font-medium tracking-wider text-zinc-400 uppercase">{item.label}</p>
              <p className="mt-1 font-semibold break-words text-white">{item.value}</p>
            </motion.div>
          ))}
        </section>

        <p className="mt-3 text-xs text-zinc-500 text-center sm:text-left">
          {vehicle.carType} · heading {Math.round(telemetry.heading)}° · speed {telemetry.speedKmh} km/h
        </p>
      </div>

      {/* 3. Trip Log Section */}
      <div className="pt-2 border-t border-white/[0.06]">
        <TripLog vin={vehicle.vin} />
      </div>
    </div>
  );
}
