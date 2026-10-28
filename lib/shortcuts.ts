import { createHmac } from "crypto";
import type { ControlAction, Session, Telemetry, Vehicle } from "./types";
import { applyMockCommand, clampClimateMinutes, mockTelemetry, mockVehicles } from "./mock";
import { ProtonError, sendCommand } from "./proton";

const SECRET = process.env.SHORTCUTS_SECRET || "proton_relink_siri_secret_key_v1";

export type ShortcutTokenPayload = {
  userId: string;
  vin: string;
  carType: string;
  plate: string;
  backend: "atlas" | "ecarx";
  demo: boolean;
  accessToken: string;
  refreshToken?: string;
  issuedAt: number;
};

export function createShortcutToken(session: Session, vehicle?: Vehicle): string {
  const payload: ShortcutTokenPayload = {
    userId: session.userId,
    vin: vehicle?.vin || session.selectedVin || "DEFAULT",
    carType: vehicle?.carType || "Proton",
    plate: vehicle?.plate || "",
    backend: vehicle?.backend || session.backend || "atlas",
    demo: Boolean(session.demo),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    issuedAt: Date.now(),
  };

  const json = JSON.stringify(payload);
  const data = Buffer.from(json, "utf8").toString("base64url");
  const signature = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function parseShortcutToken(tokenString: string): ShortcutTokenPayload | null {
  if (!tokenString || typeof tokenString !== "string") return null;
  const parts = tokenString.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
  if (signature !== expected) return null;

  try {
    const raw = Buffer.from(data, "base64url").toString("utf8");
    return JSON.parse(raw) as ShortcutTokenPayload;
  } catch {
    return null;
  }
}

export function formatSiriSpeech(
  action: ControlAction | "status",
  vehicleName: string,
  plate: string,
  telemetry?: Telemetry | null
): string {
  const name = vehicleName ? `Proton ${vehicleName}` : "your Proton";

  switch (action) {
    case "lock":
      return `${name} is now locked. All doors are secure.`;
    case "unlock":
      return `${name} has been unlocked.`;
    case "engine_start":
      return `Engine started for ${name}. Air conditioning is set to 22 degrees for 10 minutes.`;
    case "engine_stop":
      return `Engine stopped for ${name}.`;
    case "climate_on":
      return `Climate control turned on for ${name}.`;
    case "climate_off":
      return `Climate control turned off for ${name}.`;
    case "trunk_open":
      return `Boot release triggered for ${name}.`;
    case "trunk_close":
      return `Boot closed for ${name}.`;
    case "windows_open":
      return `Windows opened for ${name}.`;
    case "windows_close":
      return `Windows closed for ${name}.`;
    case "windows_vent":
      return `Windows set to ventilation mode for ${name}.`;
    case "status": {
      if (!telemetry) return `${name} status retrieved successfully.`;
      const lockState = telemetry.locked ? "locked" : "unlocked";
      const engineState = telemetry.engineOn ? "running" : "off";
      const fuel = telemetry.fuelPercent != null ? `${telemetry.fuelPercent}% fuel` : "";
      const range = telemetry.rangeKm != null ? `${telemetry.rangeKm} kilometers range` : "";
      const stats = [fuel, range].filter(Boolean).join(" and ");
      return `${name} is ${lockState} with the engine ${engineState}.${stats ? ` You have ${stats}.` : ""}`;
    }
    default:
      return `Command ${action} sent to ${name}.`;
  }
}
