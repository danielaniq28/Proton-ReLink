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
