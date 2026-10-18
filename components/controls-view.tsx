"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AirVent, DoorClosed, DoorOpen, LocateFixed, Lock, Power, RectangleHorizontal, Unlock, X } from "lucide-react";
import type { ControlAction, Telemetry } from "@/lib/types";
import { useVehicle } from "./vehicle-provider";

type Tone = "ok" | "alert" | null;
type StatusDot = "green" | "amber" | null;

type ControlItem = {
  id: string;
  action: ControlAction | "window_prompt";
  label: string;
  detail: string;
  statusText: string;
  statusDot: StatusDot;
  icon: typeof Lock;
  tone: Tone;
};

function controlsFor(telemetry: Telemetry): Array<ControlItem> {
  const isWindowActive = telemetry.windowsOpen || telemetry.windowsVent;

  return [
    {
      id: "lock",
      action: telemetry.locked ? "unlock" : "lock",
      label: telemetry.locked ? "Unlock" : "Lock",
      detail: telemetry.locked ? "All doors locked" : "Doors unlocked",
      statusText: telemetry.locked ? "Locked" : "Unlocked",
      statusDot: telemetry.locked ? "green" : "amber",
      icon: telemetry.locked ? Unlock : Lock,
      tone: telemetry.locked ? "ok" : null,
    },
    {
      id: "engine",
      action: telemetry.engineOn ? "engine_stop" : "engine_start",
      label: telemetry.engineOn ? "Stop engine" : "Start engine",
      detail: telemetry.engineOn ? "Engine running" : "Engine off",
      statusText: telemetry.engineOn ? "Running" : "Off",
      statusDot: telemetry.engineOn ? "amber" : "green",
      icon: Power,
      tone: telemetry.engineOn ? null : "alert",
    },
    {
      id: "find",
      action: "horn",
      label: "Find car",
      detail: "Horn & flashers",
      statusText: "Ready",
      statusDot: null,
      icon: LocateFixed,
      tone: null,
    },
    {
      id: "trunk",
      action: telemetry.trunkOpen ? "trunk_close" : "trunk_open",
      label: telemetry.trunkOpen ? "Close trunk" : "Open trunk",
      detail: telemetry.trunkOpen ? "Trunk open" : "Trunk closed",
      statusText: telemetry.trunkOpen ? "Open" : "Closed",
      statusDot: telemetry.trunkOpen ? "amber" : "green",
      icon: telemetry.trunkOpen ? DoorClosed : DoorOpen,
      tone: telemetry.trunkOpen ? null : "ok",
    },
    {
      id: "windows",
      action: isWindowActive ? "windows_close" : "window_prompt",
      label: isWindowActive ? "Close windows" : "Open windows",
      detail: isWindowActive
        ? telemetry.windowsOpen
          ? "Tap to close all windows"
          : "Tap to close vented windows"
        : "Tap for vent or full open",
      statusText: isWindowActive ? (telemetry.windowsOpen ? "Open" : "Vented") : "Closed",
      statusDot: isWindowActive ? "amber" : "green",
      icon: RectangleHorizontal,
      tone: isWindowActive ? "alert" : "ok",
    },
  ];
}

type ConfirmPrompt = {
  action: ControlAction;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  confirmLabel: string;
  badgeText: string;
  icon: typeof Lock;
};

export function ControlsView() {
  const { vehicle, telemetry, send, pendingAction } = useVehicle();
  const [showWindowPrompt, setShowWindowPrompt] = useState(false);
  const [confirmPrompt, setConfirmPrompt] = useState<ConfirmPrompt | null>(null);

  if (!vehicle || !telemetry) return <div className="h-64 animate-pulse rounded-3xl bg-white/5" />;

  const actions = controlsFor(telemetry);
  const isWindowPending =
    pendingAction === "windows_open" || pendingAction === "windows_close" || pendingAction === "windows_vent";

  const handleAction = (item: ControlItem) => {
    if (pendingAction != null) return;
    if (item.action === "window_prompt") {
      setShowWindowPrompt(true);
      return;
    }

    // Critical actions requiring confirmation:
    // 1. Unlock vehicle (locking requires NO confirmation)
    if (item.action === "unlock") {
      setConfirmPrompt({
        action: "unlock",
        eyebrow: "Security",
        title: "Unlock Vehicle",
        subtitle: `${vehicle.carType} · ${vehicle.plate || vehicle.vin}`,
        description: "Are you sure you want to unlock all doors? Anyone nearby will be able to enter the vehicle until it is locked again.",
        confirmLabel: "Unlock Doors",
        badgeText: "Vehicle Access",
        icon: Unlock,
      });
      return;
    }

    // 2. Start engine (stopping engine requires NO confirmation)
    if (item.action === "engine_start") {
      setConfirmPrompt({
        action: "engine_start",
        eyebrow: "Remote Ignition",
        title: "Start Engine Remotely",
        subtitle: `${vehicle.carType} · ${vehicle.plate || vehicle.vin}`,
        description: "Are you sure you want to start the engine? Ensure the vehicle is parked safely in a well-ventilated outdoor location.",
        confirmLabel: "Start Engine",
        badgeText: "Engine Ignition",
        icon: Power,
      });
      return;
    }

    // 3. Open trunk (closing trunk requires NO confirmation)
    if (item.action === "trunk_open") {
      setConfirmPrompt({
        action: "trunk_open",
        eyebrow: "Cargo Access",
        title: "Open Trunk",
        subtitle: `${vehicle.carType} · ${vehicle.plate || vehicle.vin}`,
        description: "Are you sure you want to unlatch and open the tailgate? Ensure there is sufficient clearance behind the vehicle.",
        confirmLabel: "Open Trunk",
        badgeText: "Tailgate Unlatch",
        icon: DoorOpen,
      });
      return;
    }

    // Immediate non-critical actions (no confirmation needed):
    // - lock
    // - engine_stop
    // - trunk_close
    // - windows_close
    // - horn
    void send(item.action as ControlAction);
  };

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      {/* Consistent iOS Header */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">Controls</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-0.5">Vehicle Controls</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          {vehicle.carType} · {vehicle.plate || vehicle.vin}
        </p>
      </div>

      {/* Primary Section */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2.5 sm:mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-3">
          {actions.map((item, index) => {
            const Icon = item.icon;
            const sending = item.id === "windows" ? isWindowPending : pendingAction === item.action;
            const isLastOdd = index === 4;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={pendingAction != null}
                onClick={() => handleAction(item)}
                className={`group relative flex min-h-[114px] sm:min-h-[128px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-left text-white transition-colors duration-150 hover:border-white/[0.16] hover:bg-white/[0.07] disabled:opacity-50 cursor-pointer shadow-sm ${
                  isLastOdd ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-200 transition-colors group-hover:bg-white/[0.12] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    {sending ? (
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    ) : item.statusDot ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                            item.statusDot === "green"
                              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                              : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                          }`}
                        />
                        <span className="text-[10px] font-medium tracking-tight text-zinc-400">
                          {item.statusText}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="w-full min-w-0 mt-2">
                  <span className="block truncate text-sm sm:text-base font-semibold tracking-tight text-white leading-tight">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-zinc-400 mt-0.5">
                    {sending ? "Sending…" : item.detail}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Window Opening Mode Prompt / Modal */}
      <AnimatePresence>
        {showWindowPrompt && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
              onClick={() => setShowWindowPrompt(false)}
            />

            {/* Modal Container */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="window-prompt-title"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative z-10 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] border border-white/[0.12] bg-[#121316] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl"
            >
              {/* Sheet handle on mobile */}
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">Windows</p>
                  <h3 id="window-prompt-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                    Open Windows
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    Choose how to open the windows on your {vehicle.carType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWindowPrompt(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 hover:bg-white/[0.12] hover:text-white transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Option Cards */}
              <div className="mt-5 grid grid-cols-1 gap-3">
                {/* 1. Vent Windows Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowWindowPrompt(false);
                    void send("windows_vent");
                  }}
                  className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-left transition hover:border-white/[0.16] hover:bg-white/[0.08] active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-zinc-200 transition group-hover:bg-white/[0.14] group-hover:text-white">
                    <AirVent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-semibold text-white">Vent Opening</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">
                        Airflow
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                      Lowers windows slightly (~10%) to ventilate the cabin while keeping vehicle secure
                    </p>
                  </div>
                </button>

                {/* 2. Full Opening Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowWindowPrompt(false);
                    void send("windows_open");
                  }}
                  className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-left transition hover:border-white/[0.16] hover:bg-white/[0.08] active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-zinc-200 transition group-hover:bg-white/[0.14] group-hover:text-white">
                    <RectangleHorizontal className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-semibold text-white">Full Opening</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">
                        100% Down
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                      Rolls down all four side windows completely
                    </p>
                  </div>
                </button>
              </div>

              {/* Cancel Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowWindowPrompt(false)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3 text-xs sm:text-sm font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition active:scale-[0.99] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Critical Action Confirmation Prompt / Modal */}
      <AnimatePresence>
        {confirmPrompt && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
              onClick={() => setConfirmPrompt(null)}
            />

            {/* Modal Container */}
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-prompt-title"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative z-10 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] border border-white/[0.12] bg-[#121316] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl"
            >
              {/* Sheet handle on mobile */}
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-white">
                    <confirmPrompt.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">
                      {confirmPrompt.eyebrow}
                    </p>
                    <h3 id="confirm-prompt-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                      {confirmPrompt.title}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmPrompt(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 hover:bg-white/[0.12] hover:text-white transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Target Vehicle & Warning Card */}
              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-200">{confirmPrompt.subtitle}</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">
                    {confirmPrompt.badgeText}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {confirmPrompt.description}
                </p>
              </div>

              {/* Action Buttons: Confirm & Cancel */}
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const actionToRun = confirmPrompt.action;
                    setConfirmPrompt(null);
                    void send(actionToRun);
                  }}
                  className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-black hover:bg-zinc-200 transition active:scale-[0.99] cursor-pointer shadow-md"
                >
                  {confirmPrompt.confirmLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPrompt(null)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3 text-xs sm:text-sm font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition active:scale-[0.99] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

