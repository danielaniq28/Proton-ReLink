"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Activity, Fan, Gauge, LocateFixed, LogOut, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { DashboardNavProvider, useDashboardNav } from "./dashboard-nav";
import { DashboardPanels } from "./dashboard-panels";
import { VehicleProvider, useVehicle } from "./vehicle-provider";
import { VehicleBanner } from "./vehicle-banner";
import { SignOutSplash } from "./signout-splash";
import { PWAInstallPrompt } from "./pwa-install-prompt";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/dashboard/controls", label: "Controls", icon: SlidersHorizontal },
  { href: "/dashboard/climate", label: "Climate", icon: Fan },
  { href: "/dashboard/health", label: "Health", icon: Activity },
  { href: "/dashboard/map", label: "Find", icon: LocateFixed },
];

function intercept(event: MouseEvent<HTMLAnchorElement>, href: string, go: (href: string) => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  go(href);
}

function MobileNav() {
  const { path, go } = useDashboardNav();
  const trackRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const dragRef = useRef<{ pointerId: number; offset: number; startX: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [frames, setFrames] = useState<Array<{ x: number; w: number }>>([]);
  const [index, setIndex] = useState(() => Math.max(0, NAV.findIndex((item) => item.href === path)));
  const [dragX, setDragX] = useState<number | null>(null);

  useEffect(() => {
    const next = NAV.findIndex((item) => item.href === path);
    if (next >= 0) setIndex(next);
  }, [path]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      setFrames(
        linksRef.current.map((link) =>
          link ? { x: link.offsetLeft, w: link.offsetWidth } : { x: 0, w: 0 },
        ),
      );
    };
    measure();
    const frameId = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const frame = frames[index];
  const x = dragX ?? frame?.x ?? 0;
  const shown = dragX == null ? index : nearest(dragX);

  function clamp(value: number) {
    const first = frames[0];
    const last = frames[frames.length - 1];
    if (!first || !last) return value;
    return Math.min(last.x, Math.max(first.x, value));
  }

  function nearest(value: number) {
    const width = frame?.w ?? 0;
    const center = value + width / 2;
    let chosen = index;
    let best = Number.POSITIVE_INFINITY;
    frames.forEach((item, itemIndex) => {
      const distance = Math.abs(item.x + item.w / 2 - center);
      if (distance < best) {
        best = distance;
        chosen = itemIndex;
      }
    });
    return chosen;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!frame) return;
    const rect = trackRef.current?.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offset: event.clientX - (rect?.left ?? 0) - frame.x,
      startX: event.clientX,
      moved: false,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.abs(event.clientX - drag.startX) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* Pointer capture is only available for a real press. */
      }
    }
    const rect = trackRef.current?.getBoundingClientRect();
    setDragX(clamp(event.clientX - (rect?.left ?? 0) - drag.offset));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved = drag.moved;
    dragRef.current = null;
    if (!moved) return;
    suppressClick.current = true;
    const next = nearest(dragX ?? frame?.x ?? 0);
    setDragX(null);
    setIndex(next);
    go(NAV[next].href);
  }

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(0.7rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="w-full max-w-md overflow-hidden rounded-full">
        <div
          ref={trackRef}
          className="liquid-nav pointer-events-auto relative flex w-full items-stretch px-1.5 py-1.5"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {frame ? (
            <motion.span
              data-nav-blob
              className="pointer-events-none absolute left-0 top-1.5 bottom-1.5 z-10 rounded-full bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)]"
              style={{ width: frame.w }}
              initial={false}
              animate={{ x }}
              transition={dragX == null ? { type: "spring", stiffness: 700, damping: 42, mass: 0.4 } : { duration: 0 }}
            />
          ) : null}
          {NAV.map((item, itemIndex) => {
            const Icon = item.icon;
            const active = itemIndex === shown;
            const fontSize = itemIndex === 1 || itemIndex === 3 ? "text-[9px]" : "text-[10px]";
            return (
              <a
                key={item.href}
                ref={(node) => {
                  linksRef.current[itemIndex] = node;
                }}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  go(item.href);
                }}
                onPointerDown={() => {
                  if (dragRef.current?.moved) return;
                  setIndex(itemIndex);
                }}
                className={`relative z-20 flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 uppercase transition-colors cursor-pointer ${active ? "text-white" : "text-zinc-400"}`}
              >
                <Icon className="relative h-5 w-5 shrink-0" />
                <span className={`relative block w-full text-center leading-none tracking-normal truncate px-0.5 ${fontSize}`}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function CommandStatusFloating() {
  const { commandNote, commandFailed, pendingAction } = useVehicle();
  const [dismissed, setDismissed] = useState(false);
  const prevNoteRef = useRef<string | null>(null);

  useEffect(() => {
    if (commandNote && commandNote !== prevNoteRef.current) {
      prevNoteRef.current = commandNote;
      setDismissed(false);
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [commandNote]);

  const activeText = pendingAction ? "Executing command…" : commandNote;
  const isVisible = Boolean(activeText && (!dismissed || pendingAction));

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className="pointer-events-none fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-sm justify-center md:bottom-6 md:left-[clamp(4.75rem,8vw,6.5rem)] md:right-0"
        >
          <div
            onClick={() => setDismissed(true)}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-xl shadow-2xl transition-all cursor-pointer ${
              commandFailed
                ? "border-rose-500/25 bg-rose-950/90 text-rose-200 shadow-rose-950/40"
                : "border-white/10 bg-zinc-900/90 text-zinc-200 shadow-black/50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  pendingAction
                    ? "bg-white animate-pulse"
                    : commandFailed
                    ? "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]"
                    : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                }`}
              />
              <span className="truncate">{activeText}</span>
            </div>
            <span className="text-[10px] text-zinc-400 hover:text-white ml-1">✕</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Frame() {
  const router = useRouter();
  const { path, go } = useDashboardNav();
  const { vehicle, vehicles, telemetry, selectVehicle, demo, warning, refresh } = useVehicle();
  const [signingOut, setSigningOut] = useState(false);

  // Automatically refresh vehicle status when switching across tabs
  const lastPathRef = useRef(path);
  useEffect(() => {
    if (lastPathRef.current !== path) {
      lastPathRef.current = path;
      if (vehicle) {
        void refresh();
      }
    }
  }, [path, vehicle, refresh]);

  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      try {
        window.localStorage.removeItem("pl_last_status");
      } catch {}
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue navigation even if network failure
    }
    setTimeout(() => {
      window.location.href = "/login?signout=1";
    }, 650);
  }

  return (
    <LayoutGroup>
      <AnimatePresence>
        {signingOut ? <SignOutSplash key="signout-splash" /> : null}
      </AnimatePresence>

      <div className="min-h-screen bg-[#08080a] text-zinc-100">
        <div className="flex min-h-screen w-full flex-col md:flex-row">
          <aside className="sticky top-0 hidden h-screen w-[clamp(4.75rem,8vw,6.5rem)] shrink-0 flex-col items-center border-r border-white/5 pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-6 md:flex">
            <img src="/da-mark.png" alt="Proton Re-Link" className="mb-10 h-auto w-[55%] max-w-[2.75rem] object-contain" />
            <nav className="flex w-full flex-1 flex-col items-center gap-2 px-1.5">
              {NAV.map((item) => {
                const active = path === item.href;
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => go(item.href)}
                    className={`relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[10px] tracking-wide uppercase cursor-pointer ${active ? "text-black" : "text-zinc-500 hover:text-white"}`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-desktop"
                        initial={false}
                        className="absolute inset-0 rounded-2xl bg-white"
                        transition={{ type: "spring", stiffness: 700, damping: 42, mass: 0.4 }}
                      />
                    ) : null}
                    <Icon className="relative h-5 w-5" />
                    <span className="relative">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <button
              type="button"
              disabled={signingOut}
              onClick={logout}
              aria-label="Sign out"
              className="mx-1.5 flex w-[calc(100%-0.75rem)] flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] tracking-wide text-zinc-500 uppercase hover:bg-white/5 hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </aside>

        <div className="flex min-w-0 flex-1 flex-col h-full min-h-0">
          <header className="sticky top-0 z-30 shrink-0 border-b border-white/5 bg-[#08080a] px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-5 sm:pb-3 md:px-[clamp(1.25rem,3vw,2.5rem)] md:py-3.5">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* 1. Brand with 'Powered by' and da-mark.png */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                    Proton Re-Link
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium">
                    Powered by
                  </span>
                  <img
                    src="/da-mark.png"
                    alt="Powered by mark"
                    className="h-3 sm:h-3.5 w-auto object-contain inline-block opacity-80"
                  />
                </div>

                {/* 2. Vehicle Model & Plate */}
                <div className="mt-0.5 min-w-0">
                  {vehicles.length > 1 ? (
                    <>
                      <label className="sr-only" htmlFor="vehicle">
                        Vehicle
                      </label>
                      <select
                        id="vehicle"
                        value={vehicle?.vin ?? ""}
                        onChange={(event) => void selectVehicle(event.target.value)}
                        className="w-full max-w-full truncate bg-transparent text-sm sm:text-base font-semibold tracking-tight text-white outline-none cursor-pointer"
                      >
                        {vehicles.map((item) => (
                          <option key={item.vin} value={item.vin} className="bg-[#111114]">
                            {item.carType} · {item.plate || item.vin}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <p className="truncate text-sm sm:text-base font-semibold tracking-tight text-white">
                      {vehicle ? `${vehicle.carType} · ${vehicle.plate || vehicle.vin}` : "Proton"}
                    </p>
                  )}
                </div>

                {/* 3. Live / Preview status */}
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${demo || warning ? "bg-amber-400/80" : "bg-emerald-400"}`} />
                  <span className="text-[11px] font-medium text-zinc-400">
                    {demo ? "Preview" : warning ? "Simulated" : "Live"}
                  </span>
                </div>
              </div>

              {/* 4. Compact Apple-style Action buttons */}
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={logout}
                  aria-label="Sign out"
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  <LogOut className="h-3 w-3 text-zinc-400" />
                  <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                </button>
              </div>
            </div>
          </header>

          {warning ? (
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-5 md:px-0">
              <p className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs sm:text-sm text-amber-200/90">
                {warning}
              </p>
            </div>
          ) : null}

          <div className="flex-1 flex flex-col min-h-0 px-3.5 sm:px-5 pt-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:px-[clamp(1.25rem,3vw,2.5rem)] md:pt-6 md:pb-10">
            <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col min-h-0">
              <DashboardPanels />
            </div>
          </div>
        </div>
      </div>

      <CommandStatusFloating />
      <PWAInstallPrompt />
      <MobileNav />
    </div>
    </LayoutGroup>
  );
}

export function Shell() {
  return (
    <VehicleProvider>
      <DashboardNavProvider>
        <Frame />
      </DashboardNavProvider>
    </VehicleProvider>
  );
}
