"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Fuel, Gauge, MapPin, Navigation, Route } from "lucide-react";
import type { TripRecord } from "@/lib/types";
import { formatTripDate } from "@/lib/format";

export function TripLog({ vin }: { vin: string }) {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/vehicles/${encodeURIComponent(vin)}/trips`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { trips?: TripRecord[] }) => {
        if (!active) return;
        setTrips(data.trips ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setTrips([]);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [vin]);

  const totalDistance = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  const totalDuration = trips.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
  const avgEfficiency =
    trips.filter((t) => typeof t.fuelEfficiencyLPer100Km === "number").length > 0
      ? (
          trips.reduce((sum, t) => sum + (t.fuelEfficiencyLPer100Km || 0), 0) /
          trips.filter((t) => typeof t.fuelEfficiencyLPer100Km === "number").length
        ).toFixed(1)
      : null;

  return (
    <div className="flex w-full flex-col gap-3 sm:gap-4">
      {/* Header and Summary stats */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400">
            Journey History
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Recorded trips, route summaries, and driving metrics
          </p>
        </div>

        {trips.length > 0 && !loading ? (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-zinc-300">
              <strong className="text-white font-semibold">{trips.length}</strong> trips
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-zinc-300">
              <strong className="text-white font-semibold">{totalDistance.toFixed(1)}</strong> km
            </span>
            {avgEfficiency ? (
              <span className="rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-2.5 py-1 text-[#f3e2ae]">
                avg <strong className="font-semibold">{avgEfficiency}</strong> L/100km
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-2.5">
          <div className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          <div className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
          <Route className="h-8 w-8 text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-zinc-300">No journey records yet</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Trips recorded by your vehicle telematics will appear here automatically after driving.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {trips.map((trip, index) => {
            const isExpanded = selectedTrip === trip.id;
            const mapsUrl =
              trip.startCoords && trip.endCoords
                ? `https://www.google.com/maps/dir/?api=1&origin=${trip.startCoords.lat},${trip.startCoords.lng}&destination=${trip.endCoords.lat},${trip.endCoords.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.endPlace)}`;

            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.035 }}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                <div
                  onClick={() => setSelectedTrip(isExpanded ? null : trip.id)}
                  className="flex flex-col gap-3 p-4 sm:p-4.5 cursor-pointer"
                >
                  {/* Top line: Date and Distance */}
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                      <Clock className="h-3.5 w-3.5 text-[#d4af37]" />
                      {formatTripDate(trip.startTime)}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {trip.distanceKm} km · {trip.durationMinutes} min
                    </span>
                  </div>

                  {/* Route points */}
                  <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-zinc-300 truncate">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">{trip.startPlace}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white font-medium truncate">
                      <MapPin className="h-3.5 w-3.5 text-[#d4af37] shrink-0" />
                      <span className="truncate">{trip.endPlace}</span>
                    </div>
                  </div>

                  {/* Metrics bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.05] text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-zinc-500" />
                      Avg <strong className="text-zinc-200 font-semibold">{trip.avgSpeedKmh}</strong> km/h
                    </span>
                    {trip.fuelEfficiencyLPer100Km ? (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className="flex items-center gap-1">
                          <Fuel className="h-3 w-3 text-zinc-500" />
                          <strong className="text-zinc-200 font-semibold">
                            {trip.fuelEfficiencyLPer100Km}
                          </strong>{" "}
                          L/100km
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Expanded Action Section */}
                <AnimatePresence>
                  {isExpanded ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/[0.06] bg-black/25 px-4 py-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="text-xs text-zinc-400">
                          <span>Departed: {new Date(trip.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="mx-1.5 text-zinc-600">|</span>
                          <span>Arrived: {new Date(trip.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95 cursor-pointer self-start sm:self-auto"
                        >
                          <Navigation className="h-3.5 w-3.5 text-[#d4af37]" />
                          Open Route on Google Maps
                        </a>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
