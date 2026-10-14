"use client";

import { motion } from "framer-motion";
import { formatDateTime } from "@/lib/format";
import { useVehicle } from "./vehicle-provider";

export function MapView() {
  const { vehicle, telemetry, refresh } = useVehicle();
  if (!vehicle || !telemetry) return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;

  const pad = 0.012;
  const bbox = `${telemetry.longitude - pad},${telemetry.latitude - pad},${telemetry.longitude + pad},${telemetry.latitude + pad}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${telemetry.latitude}%2C${telemetry.longitude}`;
  const maps = `https://www.google.com/maps/search/?api=1&query=${telemetry.latitude},${telemetry.longitude}`;
  const updated = formatDateTime(telemetry.updatedAt);

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.2em] text-[#d4af37] uppercase font-medium">Find my car</p>
          <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl text-white">{telemetry.place}</h1>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => void refresh()}
          className="text-sm text-zinc-400 underline-offset-4 hover:text-white hover:underline cursor-pointer"
        >
          Refresh
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[28px] border border-white/10"
      >
        <iframe title="Vehicle location" src={src} className="h-64 w-full sm:h-[420px] [filter:grayscale(1)_invert(0.92)_contrast(0.9)]" />
      </motion.div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Latitude", value: telemetry.latitude.toFixed(5) },
          { label: "Longitude", value: telemetry.longitude.toFixed(5) },
          { label: "Updated", value: updated },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.08 + index * 0.035 }}
            className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
          >
            <p className="text-[11px] tracking-widest text-zinc-500 uppercase">{item.label}</p>
            <p className="mt-1 font-medium break-words text-white">{item.value}</p>
          </motion.div>
        ))}
      </section>

      <motion.a
        href={maps}
        target="_blank"
        rel="noreferrer"
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        className="flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
      >
        Open directions in Google Maps
      </motion.a>

      <p className="text-sm text-zinc-500 text-center sm:text-left">
        {vehicle.carType} · heading {Math.round(telemetry.heading)}° · speed {telemetry.speedKmh} km/h
      </p>
    </div>
  );
}
