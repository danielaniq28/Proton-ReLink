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

function Frame() {
  const router = useRouter();
  const { path, go } = useDashboardNav();
  const { vehicle, vehicles, telemetry, selectVehicle, demo, warning } = useVehicle();
  const [signingOut, setSigningOut] = useState(false);
  const stage = path === "/dashboard/controls" || path === "/dashboard/climate";

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

      <div className={`min-h-screen bg-[#08080a] text-zinc-100 ${path === "/dashboard/controls" ? "h-dvh max-h-dvh overflow-hidden md:h-auto md:max-h-none md:overflow-visible" : ""}`}>
        <div className={`flex min-h-screen w-full flex-col md:flex-row ${path === "/dashboard/controls" ? "h-dvh max-h-dvh md:h-auto md:max-h-none" : ""}`}>
          <aside className="sticky top-0 hidden h-screen w-[clamp(4.75rem,8vw,6.5rem)] shrink-0 flex-col items-center border-r border-white/5 py-6 md:flex">
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
              className="mx-1.5 flex w-[calc(100%-0.75rem)] flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[10px] tracking-wide text-zinc-500 uppercase hover:bg-white/5 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </aside>

        <div className="flex min-w-0 flex-1 flex-col h-full min-h-0">
          <header className="shrink-0 px-4 py-2.5 sm:py-3.5 sm:px-5 md:px-[clamp(1.25rem,3vw,2.5rem)] border-b border-white/5">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* 1. Brand with 'Powered by' and da-mark.png */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                    Proton Re-Link
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium">
                    Powered by
                  </span>
                  <img
                    src="/da-mark.png"
                    alt="Powered by mark"
                    className="h-3 sm:h-3.5 w-auto object-contain inline-block"
                  />
                </div>

                {/* 2. Vehicle Model & Plate */}
                <div className="mt-1 min-w-0">
                  {vehicles.length > 1 ? (
                    <>
                      <label className="sr-only" htmlFor="vehicle">
                        Vehicle
                      </label>
                      <select
                        id="vehicle"
                        value={vehicle?.vin ?? ""}
                        onChange={(event) => void selectVehicle(event.target.value)}
                        className="w-full max-w-full truncate bg-transparent text-base sm:text-xl font-bold tracking-tight text-white outline-none cursor-pointer"
                      >
                        {vehicles.map((item) => (
                          <option key={item.vin} value={item.vin} className="bg-[#111114]">
                            {item.carType} · {item.plate || item.vin}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <h2 className="truncate text-base sm:text-xl font-bold tracking-tight text-white">
                      {vehicle ? `${vehicle.carType} · ${vehicle.plate || vehicle.vin}` : "Proton"}
                    </h2>
                  )}
                </div>

                {/* 3. Live / Preview status */}
                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className={`h-2 w-2 rounded-full ${demo || warning ? "bg-[#d4af37]" : "bg-emerald-400"}`} />
                  <span className="text-xs font-medium text-zinc-300">
                    {demo ? "Preview" : warning ? "Simulated" : "Live"}
                  </span>
                </div>
              </div>

              {/* 4. Sign Out button (styled like reference screenshot) */}
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={logout}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                </button>
              </div>
            </div>
          </header>

          {warning ? (
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-5 md:px-0">
              <p className="mt-2 rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#f3e2ae]">
                {warning}
              </p>
            </div>
          ) : null}

          <div className={`flex-1 flex flex-col min-h-0 px-3.5 sm:px-5 pt-2 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:px-[clamp(1.25rem,3vw,2.5rem)] md:pt-6 md:pb-10 ${path === "/dashboard/controls" ? "overflow-hidden" : ""}`}>
            <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col min-h-0">
              {stage && vehicle && telemetry ? <VehicleBanner vehicle={vehicle} telemetry={telemetry} label={path === "/dashboard/climate" ? "Climate" : "Controls"} /> : null}
              <DashboardPanels />
            </div>
          </div>
        </div>
      </div>

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
