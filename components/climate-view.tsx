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
    <div className="flex w-full flex-1 flex-col justify-between min-h-0 gap-3 sm:gap-4">
      {/* Consistent iOS Header */}
      <div className="shrink-0">
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400">Climate</p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-white mt-0.5">Climate Control</h1>
        <p className="mt-0.5 text-xs text-zinc-400">
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
