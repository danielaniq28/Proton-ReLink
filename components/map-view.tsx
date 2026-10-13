"use client";

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase">Find my car</p>
          <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">{telemetry.place}</h1>
        </div>
        <button type="button" onClick={() => void refresh()} className="text-sm text-zinc-400 underline-offset-4 hover:underline">
          Refresh
        </button>
      </div>
      <div className="overflow-hidden rounded-[28px] border border-white/10">
        <iframe title="Vehicle location" src={src} className="h-64 w-full sm:h-[420px] [filter:grayscale(1)_invert(0.92)_contrast(0.9)]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 px-4 py-4">
          <p className="text-[11px] tracking-widest text-zinc-500 uppercase">Latitude</p>
          <p className="mt-1 font-medium">{telemetry.latitude.toFixed(5)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 px-4 py-4">
          <p className="text-[11px] tracking-widest text-zinc-500 uppercase">Longitude</p>
          <p className="mt-1 font-medium">{telemetry.longitude.toFixed(5)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 px-4 py-4">
          <p className="text-[11px] tracking-widest text-zinc-500 uppercase">Updated</p>
          <p className="mt-1 font-medium break-words">{updated}</p>
        </div>
      </div>
      <a href={maps} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black">
        Open directions
      </a>
      <p className="text-sm text-zinc-500">
        {vehicle.carType} · heading {Math.round(telemetry.heading)}° · speed {telemetry.speedKmh} km/h
      </p>
    </div>
  );
}
