"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Activity, Fan, Gauge, LocateFixed, LogOut, SlidersHorizontal } from "lucide-react";
import { LayoutGroup, motion } from "framer-motion";
import { DashboardNavProvider, useDashboardNav } from "./dashboard-nav";
import { DashboardPanels } from "./dashboard-panels";
import { VehicleProvider, useVehicle } from "./vehicle-provider";
import { VehicleBanner } from "./vehicle-banner";

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
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
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
              className="pointer-events-none absolute top-1.5 bottom-1.5 z-10 rounded-full bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
              style={{ width: frame.w }}
              initial={false}
              animate={{ x }}
              transition={dragX == null ? { type: "spring", stiffness: 700, damping: 42, mass: 0.4 } : { duration: 0 }}
            />
          ) : null}
          {NAV.map((item, itemIndex) => {
            const Icon = item.icon;
            const active = itemIndex === shown;
            return (
              <a
                key={item.href}
                ref={(node) => {
                  linksRef.current[itemIndex] = node;
                }}
                href={item.href}
                onClick={(event) => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    event.preventDefault();
                    return;
                  }
                  intercept(event, item.href, go);
                }}
                onPointerDown={() => {
                  if (dragRef.current?.moved) return;
                  setIndex(itemIndex);
                }}
                className={`relative z-20 flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[10px] tracking-wide uppercase ${active ? "text-white" : "text-zinc-400"}`}
              >
                <Icon className="relative h-5 w-5" />
                <span className="relative">{item.label}</span>
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
  const stage = path === "/dashboard/controls" || path === "/dashboard/climate";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <LayoutGroup>
    <div className="min-h-screen bg-[#08080a] text-zinc-100">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <aside className="sticky top-0 hidden h-screen w-[clamp(4.75rem,8vw,6.5rem)] shrink-0 flex-col items-center border-r border-white/5 py-6 md:flex">
          <img src="/da-mark.png" alt="Proton Re-Link" className="mb-10 h-auto w-[55%] max-w-[2.75rem] object-contain" />
          <nav className="flex w-full flex-1 flex-col items-center gap-2 px-1.5">
            {NAV.map((item) => {
              const active = path === item.href;
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(event) => intercept(event, item.href, go)}
                  onPointerDown={() => go(item.href)}
                  className={`relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[10px] tracking-wide uppercase ${active ? "text-black" : "text-zinc-500 hover:text-white"}`}
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
                </a>
              );
            })}
          </nav>
          <button type="button" onClick={logout} className="mx-1.5 flex w-[calc(100%-0.75rem)] flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[10px] tracking-wide text-zinc-500 uppercase hover:bg-white/5 hover:text-white">
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-[clamp(1.25rem,3vw,2.5rem)]">
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-2 text-[11px] tracking-[0.18em] text-zinc-500 uppercase sm:tracking-[0.22em]">
                <span className="shrink-0">Proton Re-Link</span>
                <span className="flex items-center gap-1.5 font-normal normal-case tracking-normal md:hidden">
                  Powered by
                  <img src="/da-mark.png" alt="" className="h-3 w-7 object-contain" />
                </span>
              </p>
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
                      className="w-full max-w-full truncate bg-transparent text-base font-semibold tracking-tight outline-none sm:text-lg"
                    >
                      {vehicles.map((item) => (
                        <option key={item.vin} value={item.vin} className="bg-[#111114]">
                          {item.carType} {item.plate ? `· ${item.plate}` : ""}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <p className="truncate text-base font-semibold tracking-tight sm:text-lg">
                    {vehicle ? `${vehicle.carType}${vehicle.plate ? ` · ${vehicle.plate}` : ""}` : "Vehicle"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className={`h-2 w-2 rounded-full ${demo || warning ? "bg-[#d4af37]" : "bg-emerald-400"}`} />
                {demo ? "Preview" : warning ? "Simulated" : "Live"}
              </div>
              <button type="button" onClick={logout} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white md:hidden">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </header>
          {warning ? <p className="mx-4 mb-2 rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#f3e2ae] sm:mx-5 md:mx-[clamp(1.25rem,3vw,2.5rem)]">{warning}</p> : null}
          <div className="flex-1 px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] sm:px-5 md:px-[clamp(1.25rem,3vw,2.5rem)] md:pb-10">
            {stage && vehicle && telemetry ? <VehicleBanner vehicle={vehicle} telemetry={telemetry} label={path === "/dashboard/climate" ? "Climate" : "Controls"} /> : null}
            <DashboardPanels />
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
