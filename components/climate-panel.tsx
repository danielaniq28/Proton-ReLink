"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Power } from "lucide-react";
import { CLIMATE_MINUTES, clampClimateMinutes } from "@/lib/mock";
import type { ControlAction, Telemetry } from "@/lib/types";

const MIN_TEMP = 18;
const MAX_TEMP = 31;

export function ClimatePanel({
  telemetry,
  minutes,
  pendingAction,
  commandNote,
  commandFailed,
  commandAction,
  onTemp,
  onMinutes,
  onToggle,
}: {
  telemetry: Telemetry;
  minutes: number;
  pendingAction: ControlAction | null;
  commandNote: string | null;
  commandFailed: boolean;
  commandAction: ControlAction | null;
  onTemp: (value: number) => void;
  onMinutes: (value: number) => void;
  onToggle: () => void;
}) {
  const temperature = Math.min(MAX_TEMP, Math.max(MIN_TEMP, telemetry.targetTemp || MIN_TEMP));
  const climateFailed = commandFailed && (commandAction === "climate_on" || commandAction === "climate_off");
  const run = clampClimateMinutes(minutes);
  const runIndex = CLIMATE_MINUTES.indexOf(run as (typeof CLIMATE_MINUTES)[number]);

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#101114] px-4 py-6 sm:px-8">
      <p className="text-center text-sm text-zinc-300">
        Interior {telemetry.interiorTemp}°C · Exterior {telemetry.exteriorTemp}°C
      </p>

      <div className="mt-8 flex items-center justify-center gap-6 text-zinc-100">
        <button type="button" aria-label="Decrease temperature" disabled={temperature <= MIN_TEMP} onClick={() => onTemp(temperature - 1)} className="disabled:opacity-30">
          <ChevronLeft className="h-7 w-7" />
        </button>
        <span className="relative block h-16 min-w-16 overflow-hidden text-center text-6xl font-light tracking-wide">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={temperature} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }} className="block">
              {temperature}
            </motion.span>
          </AnimatePresence>
        </span>
        <button type="button" aria-label="Increase temperature" disabled={temperature >= MAX_TEMP} onClick={() => onTemp(temperature + 1)} className="disabled:opacity-30">
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs tracking-[0.18em] text-zinc-500 uppercase">18–31°C</p>

      <button
        type="button"
        onClick={onToggle}
        disabled={pendingAction != null}
        className="mx-auto mt-8 flex items-center gap-3 rounded-2xl border border-white/10 px-6 py-3 text-zinc-100 disabled:opacity-50"
      >
        <Power className="h-5 w-5" strokeWidth={1.5} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={telemetry.climateOn ? "on" : "off"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            {telemetry.climateOn ? "On" : "Off"}
          </motion.span>
        </AnimatePresence>
      </button>

      <div className="mx-auto mt-8 flex max-w-xs items-center justify-between text-sm text-zinc-400">
        <span>Run time</span>
        <span className="flex items-center gap-3">
          <button type="button" aria-label="Shorter run" disabled={runIndex <= 0} onClick={() => onMinutes(CLIMATE_MINUTES[runIndex - 1])} className="px-2 text-lg disabled:opacity-30">
            −
          </button>
          <span className="block min-w-12 overflow-hidden text-center text-zinc-100">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={run} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="block">
                {run} min
              </motion.span>
            </AnimatePresence>
          </span>
          <button type="button" aria-label="Longer run" disabled={runIndex >= CLIMATE_MINUTES.length - 1} onClick={() => onMinutes(CLIMATE_MINUTES[runIndex + 1])} className="px-2 text-lg disabled:opacity-30">
            +
          </button>
        </span>
      </div>

      {climateFailed && commandNote ? (
        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#2a2d33] px-4 py-4">
          <p className="font-semibold">{commandAction === "climate_off" ? "Climate Off failed" : "Climate On failed"}</p>
          <p className="mt-1 text-sm text-zinc-400">{commandNote}</p>
        </div>
      ) : null}
      {commandNote && !climateFailed && (commandAction === "climate_on" || commandAction === "climate_off") ? (
        <p className="mt-6 text-center text-sm text-zinc-400">{commandNote}</p>
      ) : null}
    </section>
  );
}
