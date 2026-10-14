"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AirVent, DoorClosed, DoorOpen, LocateFixed, Lock, Power, RectangleHorizontal, Unlock } from "lucide-react";
import type { ControlAction, Telemetry } from "@/lib/types";
import { useVehicle } from "./vehicle-provider";

type Tone = "ok" | "alert" | null;

function controlsFor(telemetry: Telemetry): Array<{ id: string; action: ControlAction; label: string; detail: string; icon: typeof Lock; tone: Tone }> {
  return [
    {
      id: "lock",
      action: telemetry.locked ? "unlock" : "lock",
      label: telemetry.locked ? "Unlock" : "Lock",
      detail: telemetry.locked ? "Locked" : "Unlocked",
      icon: telemetry.locked ? Unlock : Lock,
      tone: telemetry.locked ? "ok" : null,
    },
    {
      id: "engine",
      action: telemetry.engineOn ? "engine_stop" : "engine_start",
      label: telemetry.engineOn ? "Stop engine" : "Start engine",
      detail: telemetry.engineOn ? "Engine running" : "Engine off",
      icon: Power,
      tone: telemetry.engineOn ? null : "alert",
    },
    {
      id: "find",
      action: "horn",
      label: "Find car",
      detail: "Horn & lights",
      icon: LocateFixed,
      tone: null,
    },
    {
      id: "trunk",
      action: telemetry.trunkOpen ? "trunk_close" : "trunk_open",
      label: telemetry.trunkOpen ? "Close trunk" : "Open trunk",
      detail: telemetry.trunkOpen ? "Trunk open" : "Trunk closed",
      icon: telemetry.trunkOpen ? DoorClosed : DoorOpen,
      tone: telemetry.trunkOpen ? null : "ok",
    },
    {
      id: "windows",
      action: telemetry.windowsOpen ? "windows_close" : "windows_open",
      label: telemetry.windowsOpen ? "Close windows" : "Open windows",
      detail: telemetry.windowsOpen ? "Windows open" : "Windows closed",
      icon: RectangleHorizontal,
      tone: telemetry.windowsOpen ? "alert" : "ok",
    },
    {
      id: "vent",
      action: telemetry.windowsVent ? "windows_close" : "windows_vent",
      label: telemetry.windowsVent ? "Close vent" : "Vent windows",
      detail: telemetry.windowsVent ? "Windows vented" : "Windows closed",
      icon: AirVent,
      tone: telemetry.windowsVent || telemetry.windowsOpen ? "alert" : "ok",
    },
  ];
}

const TONE = {
  ok: "text-emerald-400",
  alert: "text-amber-400",
} as const;

export function ControlsView() {
  const { vehicle, telemetry, send, pendingAction, commandNote, commandFailed } = useVehicle();

  if (!vehicle || !telemetry) return <div className="h-64 animate-pulse rounded-3xl bg-white/5" />;

  const actions = controlsFor(telemetry);

  return (
    <div className="flex w-full flex-col gap-2.5 sm:gap-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        {actions.map((item, index) => {
          const Icon = item.icon;
          const sending = pendingAction === item.action;
          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.24,
                delay: index * 0.035,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.015, borderColor: "rgba(255,255,255,0.2)" }}
              disabled={pendingAction != null}
              onClick={() => void send(item.action)}
              className="relative flex h-[4.35rem] sm:h-24 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-3.5 text-left text-white disabled:opacity-60 transition-colors"
            >
              <div className="flex w-full items-center justify-between">
                <Icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${item.tone ? TONE[item.tone] : "text-zinc-400"}`} />
                {sending ? (
                  <span className="h-2 w-2 rounded-full bg-[#d4af37] animate-ping" />
                ) : null}
              </div>
              <div className="w-full min-w-0">
                <div className="h-4 sm:h-5 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={item.label}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16 }}
                      className="block truncate text-xs sm:text-sm font-semibold tracking-tight leading-tight"
                    >
                      {item.label}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <span className="block truncate text-[10px] sm:text-xs text-zinc-400 leading-none mt-0.5">
                  {sending ? "Sending command…" : item.detail}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {commandNote ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border px-3.5 py-2.5 text-xs sm:text-sm ${
            commandFailed
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-white/10 bg-white/[0.04] text-zinc-300"
          }`}
        >
          {commandNote}
        </motion.div>
      ) : null}
    </div>
  );
}
