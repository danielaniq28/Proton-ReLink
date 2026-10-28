"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ConnectSplash() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const vehiclesPromise = fetch("/api/vehicles", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { vehicles?: unknown[]; fallback?: boolean; demo?: boolean };
      })
      .catch(() => null);

    let frame = 0;
    const tick = (now: number) => {
      const value = Math.min(1, (now - started) / 2200);
      setProgress(value);
      if (value < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      void vehiclesPromise.then((data) => {
        if (!data || !data.vehicles || data.vehicles.length === 0 || (data.fallback && !data.demo)) {
          router.replace("/login?signout=1&error=no_vehicles");
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      });
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [router]);

  const width = `${Math.round(progress * 100)}%`;

  return (
    <main className="safe-top-screen fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08080a] px-6 pt-6 pb-6 text-zinc-100">
      <p className="text-sm tracking-[0.22em] text-zinc-400 uppercase">Connecting to</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Proton Re-Link</h1>
      <div className="relative mt-10 h-24 w-72" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Connecting">
        <img src="/da-mark.png" alt="" className="absolute inset-0 h-full w-full object-contain opacity-20" />
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width }}>
          <img src="/da-mark.png" alt="" className="absolute top-0 left-0 h-24 w-72 max-w-none object-contain" />
        </div>
      </div>
    </main>
  );
}
