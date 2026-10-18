"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Clock, Fuel, Gauge, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { formatTripDate } from "@/lib/format";

type TripRecord = {
  id: string;
  startTime: number;
  endTime: number;
  from: string;
  to: string;
  distanceKm: number;
  durationMinutes: number;
  avgSpeedKmh: number;
  fuelUsedL: number;
  efficiencyLPer100: number;
};

function defaultTrips(vin: string): TripRecord[] {
  const now = Date.now();
  const h = 3600 * 1000;
  return [
    {
      id: `${vin}-trip-1`,
      startTime: now - 3.5 * h,
      endTime: now - 3.0 * h,
      from: "Mid Valley Megamall, KL",
      to: "Cyberjaya Innovation Hub",
      distanceKm: 28.4,
      durationMinutes: 32,
      avgSpeedKmh: 53.2,
      fuelUsedL: 1.9,
      efficiencyLPer100: 6.7,
    },
    {
      id: `${vin}-trip-2`,
      startTime: now - 26 * h,
      endTime: now - 25.2 * h,
      from: "Subang Jaya SS15",
      to: "KLCC Twin Towers",
      distanceKm: 21.8,
      durationMinutes: 45,
      avgSpeedKmh: 29.1,
      fuelUsedL: 1.7,
      efficiencyLPer100: 7.8,
    },
    {
      id: `${vin}-trip-3`,
      startTime: now - 52 * h,
      endTime: now - 50.5 * h,
      from: "Petaling Jaya, Section 14",
      to: "Genting Highlands Resort",
      distanceKm: 54.2,
      durationMinutes: 72,
      avgSpeedKmh: 45.1,
      fuelUsedL: 4.8,
      efficiencyLPer100: 8.8,
    },
  ];
}

export function TripLog({ vin }: { vin: string }) {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!vin) return;
    try {
      const stored = window.localStorage.getItem(`proton_trips_${vin}`);
      if (stored) {
        const parsed = JSON.parse(stored) as TripRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTrips(parsed);
          return;
        }
      }
    } catch {}
    const defaults = defaultTrips(vin);
    setTrips(defaults);
    try {
      window.localStorage.setItem(`proton_trips_${vin}`, JSON.stringify(defaults));
    } catch {}
  }, [vin]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400">
          Trip History
        </h2>
        <span className="text-[11px] text-zinc-500 font-medium">
          {trips.length} {trips.length === 1 ? "journey" : "journeys"} logged
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {trips.map((trip) => {
          const isExpanded = expandedId === trip.id;
          return (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5 sm:p-4 transition-all hover:border-white/[0.14]"
            >
              <div
                className="flex items-start justify-between gap-3 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : trip.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      {formatTripDate(trip.startTime)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white truncate">
                    <span className="truncate">{trip.from}</span>
                    <span className="text-zinc-500 shrink-0">→</span>
                    <span className="truncate text-zinc-200">{trip.to}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {trip.distanceKm} km
                    </span>
                    <span className="block text-[10px] text-zinc-400">
                      {trip.durationMinutes} min
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={isExpanded ? "Collapse trip" : "Expand trip"}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 pt-3 border-t border-white/[0.06] overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                      <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2.5">
                        <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Duration</p>
                          <p className="font-semibold text-white">{trip.durationMinutes} mins</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2.5">
                        <Gauge className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Avg Speed</p>
                          <p className="font-semibold text-white">{trip.avgSpeedKmh} km/h</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2.5">
                        <Fuel className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Fuel Used</p>
                          <p className="font-semibold text-white">{trip.fuelUsedL} L</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2.5">
                        <Navigation className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Efficiency</p>
                          <p className="font-semibold text-white">{trip.efficiencyLPer100} L/100km</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
