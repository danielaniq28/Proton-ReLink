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

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      {/* 1. Target Temperature Section */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          Target Temperature
        </h2>
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 text-center shadow-sm">
          {/* Interior & Exterior Temperatures Enclosed in Pills (matches Overview) */}
          <div className="flex items-center justify-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Interior</span>
              <span className="font-semibold text-white">{telemetry.interiorTemp}°C</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Exterior</span>
              <span className="font-semibold text-white">{telemetry.exteriorTemp}°C</span>
            </div>
          </div>

          {/* Temperature Selector with Fixed Geometry (buttons do not move when changing temperature) */}
          <div className="mt-6 flex items-center justify-center gap-4 sm:gap-6 text-zinc-100">
            {/* Subtle Blue Decrement Button */}
            <button
              type="button"
              aria-label="Decrease temperature"
              disabled={temperature <= MIN_TEMP}
              onClick={() => onTemp(temperature - 1)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky-400/25 bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.08)] transition-all hover:bg-sky-500/20 hover:border-sky-400/40 hover:text-sky-300 active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Strict Fixed Width Container to prevent any button shifting */}
            <div className="relative flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden [perspective:600px]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={temperature}
                  initial={{ rotateX: -90, opacity: 0, y: -6 }}
                  animate={{ rotateX: 0, opacity: 1, y: 0 }}
                  exit={{ rotateX: 90, opacity: 0, y: 6 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    transformOrigin: "center center",
                  }}
                  className="absolute inset-0 flex items-center justify-center text-6xl font-light tracking-tight text-white tabular-nums select-none"
                >
                  {temperature}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Subtle Red Increment Button */}
            <button
              type="button"
              aria-label="Increase temperature"
              disabled={temperature >= MAX_TEMP}
              onClick={() => onTemp(temperature + 1)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-rose-500/25 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.08)] transition-all hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-2 text-xs tracking-[0.16em] text-zinc-500 uppercase">18–31°C</p>

          <button
            type="button"
            onClick={onToggle}
            disabled={pendingAction != null}
            className={`mx-auto mt-6 flex items-center gap-2.5 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              telemetry.climateOn
                ? "bg-white text-black shadow-lg shadow-white/10 hover:bg-zinc-200"
                : "border border-white/[0.08] bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] hover:text-white"
            }`}
          >
            <Power className="h-4 w-4" strokeWidth={2} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={telemetry.climateOn ? "on" : "off"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {telemetry.climateOn ? "Air Conditioning On" : "Air Conditioning Off"}
              </motion.span>
            </AnimatePresence>
          </button>
        </section>
      </div>

      {/* 2. Duration & Schedule Section with Circle Preset Buttons */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          Preset Duration
        </h2>
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-zinc-300">
            <div>
              <span className="font-medium text-white text-sm">Auto-off Timer</span>
              <p className="text-xs text-zinc-500 mt-0.5">Shuts down cabin A/C after preset runtime ({run} min)</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {CLIMATE_MINUTES.map((m) => {
                const isSelected = run === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onMinutes(m)}
                    className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? "bg-white text-zinc-950 font-bold shadow-md shadow-white/10 ring-2 ring-white/50"
                        : "border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                    }`}
                    aria-label={`Set auto-off to ${m} minutes`}
                  >
                    {m}
                  </button>
                );
              })}
              <span className="text-xs font-medium text-zinc-400 pl-1">min</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
