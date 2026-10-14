"use client";

import { ClimatePanel } from "./climate-panel";
import { useVehicle } from "./vehicle-provider";
import { clampClimateMinutes } from "@/lib/mock";

export function ClimateView() {
  const { vehicle, telemetry, send, pendingAction, commandNote, commandFailed, commandAction, setTargetTemp, setClimateMinutes } = useVehicle();

  if (!vehicle || !telemetry) return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;

  const minutes = clampClimateMinutes(telemetry.climateMinutes ?? 10);
  const temperature = Math.min(31, Math.max(18, telemetry.targetTemp || 18));

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      {/* Consistent iOS Header */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">Climate</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-0.5">Climate Control</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          {vehicle.carType} · {vehicle.plate || vehicle.vin}
        </p>
      </div>

      <ClimatePanel
        telemetry={{ ...telemetry, targetTemp: temperature }}
        minutes={minutes}
        pendingAction={pendingAction}
        commandNote={commandNote}
        commandFailed={commandFailed}
        commandAction={commandAction}
        onTemp={setTargetTemp}
        onMinutes={setClimateMinutes}
        onToggle={() => void send(telemetry.climateOn ? "climate_off" : "climate_on", temperature, minutes)}
      />
    </div>
  );
}
