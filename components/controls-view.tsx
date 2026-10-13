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
      detail: "Horn and lights",
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
  ok: "text-[#b8e0c4]",
  alert: "text-[#f2a3a0]",
} as const;

export function ControlsView() {
  const { vehicle, telemetry, send, pendingAction, commandNote, commandFailed } = useVehicle();

  if (!vehicle || !telemetry) return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;

  const actions = controlsFor(telemetry);

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {actions.map((item) => {
          const Icon = item.icon;
          const sending = pendingAction === item.action;
          return (
            <motion.button
              key={item.id}
              type="button"
              layout
              whileTap={{ scale: 0.98 }}
              disabled={pendingAction != null}
              onClick={() => void send(item.action)}
              className="relative flex min-h-24 flex-col items-start justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-white disabled:opacity-60 sm:px-4"
            >
              <Icon className="h-5 w-5" />
              <span className="w-full">
                <span className="block h-5 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={item.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="block text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className={`block h-4 overflow-hidden text-xs ${item.tone ? TONE[item.tone] : "text-zinc-500"}`}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={item.detail} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="block">
                      {sending ? "Sending…" : item.detail}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {commandNote ? (
          <motion.p key={commandFailed ? "fail" : "ok"} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`overflow-hidden text-sm ${commandFailed ? "text-rose-300" : "text-zinc-400"}`}>
            {commandNote}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
