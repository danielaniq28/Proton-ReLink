"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ControlAction, Telemetry, Vehicle } from "@/lib/types";
import { applyMockCommand, clampClimateMinutes } from "@/lib/mock";
import { performAutoRelogin } from "@/lib/local-store";

const BROADCAST_NAME = "proton_vehicle_channel";

function broadcastTelemetry(telemetry: Telemetry) {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(BROADCAST_NAME);
      bc.postMessage({ type: "TELEMETRY_SYNC", telemetry });
      bc.close();
    }
  } catch {}
}

type GarageResponse = {
  vehicles: Vehicle[];
  selectedVin: string | null;
  warning: string | null;
  demo: boolean;
  fallback?: boolean;
  error?: string;
};

type StatusResponse = {
  telemetry: Telemetry;
  warning: string | null;
  fallback: boolean;
};

type CommandResponse = {
  message?: string;
  applied?: "live" | "mock";
  telemetry?: Telemetry;
};

type VehicleContextValue = {
  vehicles: Vehicle[];
  vehicle: Vehicle | null;
  telemetry: Telemetry | null;
  warning: string | null;
  demo: boolean;
  fallback: boolean;
  loading: boolean;
  pendingAction: ControlAction | null;
  commandNote: string | null;
  commandFailed: boolean;
  commandAction: ControlAction | null;
  selectVehicle: (vin: string) => Promise<void>;
  refresh: () => Promise<void>;
  send: (action: ControlAction, temperature?: number, minutes?: number) => Promise<void>;
  setTargetTemp: (value: number) => void;
  setClimateMinutes: (value: number) => void;
  updatePlate: (plate: string) => void;
};

const VehicleContext = createContext<VehicleContextValue | null>(null);
const STATUS_CACHE = "pl_last_status";

function readCachedStatus(vin: string): Telemetry | null {
  try {
    const raw = window.localStorage.getItem(STATUS_CACHE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, Telemetry>;
    return parsed[vin] ?? null;
  } catch {
    return null;
  }
}

function writeCachedStatus(telemetry: Telemetry) {
  try {
    const raw = window.localStorage.getItem(STATUS_CACHE);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Telemetry>) : {};
    parsed[telemetry.vin] = telemetry;
    window.localStorage.setItem(STATUS_CACHE, JSON.stringify(parsed));
    broadcastTelemetry(telemetry);
  } catch {
    /* private mode can block storage; the server still keeps the last status */
  }
}

export function useVehicle() {
  const value = useContext(VehicleContext);
  if (!value) throw new Error("useVehicle must be used inside the dashboard");
  return value;
}

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<ControlAction | null>(null);
  const [commandNote, setCommandNote] = useState<string | null>(null);
  const [commandFailed, setCommandFailed] = useState(false);
  const [commandAction, setCommandAction] = useState<ControlAction | null>(null);
  const statusGeneration = useRef(0);
  const pendingRef = useRef<ControlAction | null>(null);
  const verificationTimers = useRef<number[]>([]);

  const clearVerificationTimers = useCallback(() => {
    verificationTimers.current.forEach((id) => window.clearTimeout(id));
    verificationTimers.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearVerificationTimers();
    };
  }, [clearVerificationTimers]);

  // Synchronize status across browser tabs and windows
  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        channel = new BroadcastChannel(BROADCAST_NAME);
        channel.onmessage = (event) => {
          const data = event.data;
          if (data?.type === "TELEMETRY_SYNC" && data.telemetry) {
            setTelemetry((current) => {
              if (current && current.vin !== data.telemetry.vin) return current;
              return data.telemetry;
            });
          }
        };
      }
    } catch {}

    const onStorage = (event: StorageEvent) => {
      if (event.key === STATUS_CACHE && event.newValue && vehicle) {
        try {
          const map = JSON.parse(event.newValue) as Record<string, Telemetry>;
          if (map[vehicle.vin]) {
            setTelemetry(map[vehicle.vin]);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [vehicle]);

  const isReauthenticating = useRef(false);

  const handleSessionExpired = useCallback(async (): Promise<boolean> => {
    if (isReauthenticating.current) return false;
    isReauthenticating.current = true;
    try {
      const ok = await performAutoRelogin();
      return ok;
    } catch {
      return false;
    } finally {
      isReauthenticating.current = false;
    }
  }, []);

  const loadStatus = useCallback(async (vin: string, carType?: string, backend?: string) => {
    const generation = ++statusGeneration.current;
    const params = new URLSearchParams();
    if (carType) params.set("carType", carType);
    if (backend) params.set("backend", backend);
    const query = params.toString() ? `?${params.toString()}` : "";
    try {
      const response = await fetch(`/api/vehicles/${encodeURIComponent(vin)}/status${query}`, { cache: "no-store" });
      if (generation !== statusGeneration.current) return;
      if (response.status === 401) {
        const refreshed = await handleSessionExpired();
        if (refreshed) {
          return loadStatus(vin, carType, backend);
        }
        window.location.href = "/login?session_expired=1";
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as StatusResponse;
      if (generation !== statusGeneration.current || !data?.telemetry) return;
      if (data.fallback && !demo) return;
      // Prevent in-flight optimistic command state from being clobbered by older polling packet
      if (pendingRef.current) return;

      setTelemetry((current) => {
        if (!current || current.vin !== data.telemetry.vin) return data.telemetry;
        return {
          ...data.telemetry,
          targetTemp: current.targetTemp,
          climateMinutes: current.climateMinutes,
        };
      });
      writeCachedStatus(data.telemetry);
      setFallback(Boolean(data.fallback));
      setWarning(data.warning);
    } catch {
      /* Suppress transient network poll failures */
    }
  }, [demo, handleSessionExpired]);

  const loadGarage = useCallback(async () => {
    try {
      const response = await fetch("/api/vehicles", { cache: "no-store" });
      if (response.status === 401) {
        const refreshed = await handleSessionExpired();
        if (refreshed) {
          return loadGarage();
        }
        try {
          window.localStorage.removeItem(STATUS_CACHE);
        } catch {}
        window.location.href = "/login?session_expired=1";
        return;
      }
      if (!response.ok) {
        setWarning("Temporarily unable to reach Proton services. Reconnecting…");
        return;
      }
      const data = (await response.json()) as GarageResponse;
      if (!data?.vehicles || data.vehicles.length === 0 || (data.fallback && !data.demo)) {
        if (response.status === 404 && data?.error === "no_vehicles") {
          try {
            window.localStorage.removeItem(STATUS_CACHE);
          } catch {}
          window.location.href = "/login?signout=1&error=no_vehicles";
          return;
        }
        setWarning("No vehicles currently returned by Proton gateway.");
        return;
      }
      const resolvedVehicles = data.vehicles.map((v) => {
        let plate = v.plate;
        if (!plate) {
          try {
            const stored = window.localStorage.getItem(`pl_plate_${v.vin}`);
            if (stored) plate = stored;
          } catch {}
        }
        return { ...v, plate };
      });
      setVehicles(resolvedVehicles);
      setDemo(data.demo);
      const selected = resolvedVehicles.find((item) => item.vin === data.selectedVin) ?? resolvedVehicles[0] ?? null;
      if (!selected) {
        try {
          window.localStorage.removeItem(STATUS_CACHE);
        } catch {}
        window.location.href = "/login?signout=1&error=no_vehicles";
        return;
      }
      setVehicle(selected);
      setWarning(data.warning);
      setFallback(Boolean(data.fallback));
      const cached = readCachedStatus(selected.vin);
      if (cached) setTelemetry(cached);
      await loadStatus(selected.vin, selected.carType, selected.backend);
    } catch {
      window.location.href = "/login?signout=1&error=no_vehicles";
    } finally {
      setLoading(false);
    }
  }, [loadStatus]);

  useEffect(() => {
    void loadGarage();
  }, [loadGarage]);

  useEffect(() => {
    if (!vehicle) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !pendingRef.current) {
        void loadStatus(vehicle.vin, vehicle.carType, vehicle.backend);
      }
    }, 18000);
    return () => window.clearInterval(timer);
  }, [vehicle, loadStatus]);

  useEffect(() => {
    if (!vehicle) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible" && !pendingRef.current) void loadStatus(vehicle.vin, vehicle.carType, vehicle.backend);
    };
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [vehicle, loadStatus]);

  const selectVehicle = useCallback(
    async (vin: string) => {
      const next = vehicles.find((item) => item.vin === vin);
      if (!next) return;
      setVehicle(next);
      const cached = readCachedStatus(vin);
      setTelemetry(cached);
      await fetch("/api/vehicles/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin }),
      });
      await loadStatus(vin, next.carType, next.backend);
    },
    [loadStatus, vehicles],
  );

  const send = useCallback(
    async (action: ControlAction, temperature?: number, minutes?: number) => {
      if (!vehicle) return;
      clearVerificationTimers();

      const previousTelemetry = telemetry;
      // 1. Instant optimistic update so all tabs reflect the status immediately
      if (telemetry) {
        const optimistic = applyMockCommand(telemetry, action, temperature, minutes);
        setTelemetry(optimistic);
        writeCachedStatus(optimistic);
      }

      pendingRef.current = action;
      setPendingAction(action);
      setCommandAction(action);
      setCommandNote(null);
      setCommandFailed(false);

      const targetVin = vehicle.vin;
      const targetCarType = vehicle.carType;

      try {
        const response = await fetch(`/api/vehicles/${encodeURIComponent(targetVin)}/control`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, temperature, minutes, fallback }),
        });
        const data = (await response.json()) as CommandResponse;
        if (!response.ok) throw new Error(data.message || "Command failed");
        statusGeneration.current += 1;
        if (data.telemetry) {
          setTelemetry(data.telemetry);
          writeCachedStatus(data.telemetry);
        } else {
          await loadStatus(targetVin, targetCarType, vehicle.backend);
        }
        setCommandFailed(false);
        setCommandNote(data.message ?? "Command sent");

        // 2. Multi-stage verification polling across all tabs
        // Vehicle TCU processes commands over cellular connection; verifying in stages ensures the updated physical state is confirmed.
        const targetBackend = vehicle.backend;
        const t1 = window.setTimeout(() => {
          void loadStatus(targetVin, targetCarType, targetBackend);
        }, 1800);
        const t2 = window.setTimeout(() => {
          void loadStatus(targetVin, targetCarType, targetBackend);
        }, 4500);
        const t3 = window.setTimeout(() => {
          void loadStatus(targetVin, targetCarType, targetBackend);
        }, 8500);
        verificationTimers.current = [t1, t2, t3];
      } catch (error) {
        // Roll back on failure
        if (previousTelemetry) {
          setTelemetry(previousTelemetry);
          writeCachedStatus(previousTelemetry);
        }
        setCommandFailed(true);
        setCommandNote(error instanceof Error ? error.message : "Command failed");
      } finally {
        pendingRef.current = null;
        setPendingAction(null);
      }
    },
    [clearVerificationTimers, fallback, loadStatus, telemetry, vehicle],
  );

  const setTargetTemp = useCallback((value: number) => {
    const temperature = Math.min(31, Math.max(18, Math.round(value)));
    setTelemetry((current) => (current ? { ...current, targetTemp: temperature } : current));
  }, []);

  const setClimateMinutes = useCallback((value: number) => {
    const minutes = clampClimateMinutes(value);
    setTelemetry((current) => (current ? { ...current, climateMinutes: minutes } : current));
  }, []);

  const refresh = useCallback(async () => {
    if (vehicle) await loadStatus(vehicle.vin, vehicle.carType, vehicle.backend);
  }, [loadStatus, vehicle]);

  const updatePlate = useCallback(
    (newPlate: string) => {
      if (!vehicle) return;
      const trimmed = newPlate.trim().toUpperCase();
      try {
        window.localStorage.setItem(`pl_plate_${vehicle.vin}`, trimmed);
      } catch {}
      const updatedVehicle = { ...vehicle, plate: trimmed };
      setVehicle(updatedVehicle);
      setVehicles((curr) => curr.map((v) => (v.vin === vehicle.vin ? updatedVehicle : v)));
    },
    [vehicle],
  );

  const value = useMemo<VehicleContextValue>(
    () => ({
      vehicles,
      vehicle,
      telemetry,
      warning,
      demo,
      fallback,
      loading,
      pendingAction,
      commandNote,
      commandFailed,
      commandAction,
      selectVehicle,
      refresh,
      send,
      setTargetTemp,
      setClimateMinutes,
      updatePlate,
    }),
    [commandAction, commandFailed, commandNote, demo, fallback, loading, pendingAction, refresh, selectVehicle, send, setClimateMinutes, setTargetTemp, telemetry, updatePlate, vehicle, vehicles, warning],
  );

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}
