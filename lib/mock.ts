import type { Telemetry, Vehicle } from "./types";

const now = () => Date.now();

function tires(base: number, temp: number): Telemetry["tires"] {
  return {
    fl: { pressureKpa: base, tempC: temp, warning: false },
    fr: { pressureKpa: base + 2, tempC: temp + 0.4, warning: false },
    rl: { pressureKpa: base - 4, tempC: temp - 0.6, warning: false },
    rr: { pressureKpa: base - 1, tempC: temp, warning: false },
  };
}

export function mockVehicles(): Vehicle[] {
  return [
    {
      vin: "DEMOX70PROTON0001",
      modelCode: "X70",
      modelName: "X70",
      seriesName: "X70",
      matName: "X70 Flagship",
      matCode: "",
      bodyColorCode: "",
      topColorCode: "",
      vehicleName: "X70",
      plate: "VCC 7070",
      colorName: "Snow White",
      imageUrl: null,
      carType: "X70",
      isDefault: true,
    },
    {
      vin: "DEMOS70PROTON0002",
      modelCode: "S70",
      modelName: "S70",
      seriesName: "S70",
      matName: "S70 Flagship",
      matCode: "",
      bodyColorCode: "",
      topColorCode: "",
      vehicleName: "S70",
      plate: "VBB 7070",
      colorName: "Armour Silver",
      imageUrl: null,
      carType: "S70",
      isDefault: false,
    },
    {
      vin: "DEMOX50PROTON0003",
      modelCode: "X50",
      modelName: "X50",
      seriesName: "X50",
      matName: "X50 Flagship",
      matCode: "",
      bodyColorCode: "",
      topColorCode: "",
      vehicleName: "X50",
      plate: "VA 5050",
      colorName: "Ocean Blue",
      imageUrl: null,
      carType: "X50",
      isDefault: false,
    },
    {
      vin: "DEMOX90PROTON0004",
      modelCode: "X90",
      modelName: "X90",
      seriesName: "X90",
      matName: "X90 Flagship",
      matCode: "",
      bodyColorCode: "",
      topColorCode: "",
      vehicleName: "X90",
      plate: "WA 9090",
      colorName: "Deep Marine Blue",
      imageUrl: null,
      carType: "X90",
      isDefault: false,
    },
  ];
}

export function mockTelemetry(vehicle: Vehicle): Telemetry {
  const profiles: Record<string, Partial<Telemetry>> = {
    X70: {
      fuelPercent: 68,
      efficiencyLPer100: 7.4,
      rangeKm: 512,
      odometerKm: 28440,
      serviceKm: 4200,
      serviceDays: 86,
      latitude: 3.1579,
      longitude: 101.7116,
      place: "KLCC, Kuala Lumpur",
      interiorTemp: 24,
      exteriorTemp: 31,
    },
    S70: {
      fuelPercent: 41,
      efficiencyLPer100: 6.2,
      rangeKm: 348,
      odometerKm: 11280,
      serviceKm: 7800,
      serviceDays: 140,
      latitude: 3.139,
      longitude: 101.6869,
      place: "Bukit Bintang, Kuala Lumpur",
      interiorTemp: 23,
      exteriorTemp: 32,
    },
    X50: {
      fuelPercent: 82,
      efficiencyLPer100: 6.6,
      rangeKm: 470,
      odometerKm: 18650,
      serviceKm: 2100,
      serviceDays: 34,
      latitude: 3.0738,
      longitude: 101.5183,
      place: "Subang Jaya, Selangor",
      interiorTemp: 22,
      exteriorTemp: 30,
    },
    X90: {
      fuelPercent: 55,
      efficiencyLPer100: 7.9,
      rangeKm: 580,
      odometerKm: 9400,
      serviceKm: 6500,
      serviceDays: 110,
      latitude: 3.1612,
      longitude: 101.7072,
      place: "Ampang, Kuala Lumpur",
      interiorTemp: 23,
      exteriorTemp: 31,
    },
  };
  const profile = profiles[vehicle.carType] ?? profiles.X70;
  return {
    vin: vehicle.vin,
    updatedAt: now(),
    source: "mock",
    engineOn: false,
    locked: true,
    trunkOpen: false,
    hoodOpen: false,
    windowsOpen: false,
    windowsVent: false,
    climateOn: false,
    targetTemp: 22,
    climateMinutes: 10,
    interiorTemp: profile.interiorTemp ?? 24,
    exteriorTemp: profile.exteriorTemp ?? 31,
    fuelPercent: profile.fuelPercent ?? 60,
    fuelLitres: null,
    batteryVoltage: 12.6,
    efficiencyLPer100: profile.efficiencyLPer100 ?? 7,
    rangeKm: profile.rangeKm ?? 400,
    odometerKm: profile.odometerKm ?? 10000,
    speedKmh: 0,
    serviceKm: profile.serviceKm ?? 5000,
    serviceDays: profile.serviceDays ?? 90,
    coolantC: 42,
    oilOk: true,
    latitude: profile.latitude ?? 3.139,
    longitude: profile.longitude ?? 101.6869,
    heading: 42,
    place: profile.place ?? "Kuala Lumpur",
    tires: tires(vehicle.carType === "X50" ? 230 : 240, 34),
    doorsOpen: { fl: false, fr: false, rl: false, rr: false },
  };
}

export function seedMockGarage(vehicles: Vehicle[]): Record<string, Telemetry> {
  return Object.fromEntries(vehicles.map((vehicle) => [vehicle.vin, mockTelemetry(vehicle)]));
}

export const CLIMATE_MINUTES = [3, 5, 8, 10, 15, 20] as const;

export function clampClimateMinutes(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return CLIMATE_MINUTES.reduce((best, option) => (Math.abs(option - value) < Math.abs(best - value) ? option : best));
}

export function applyMockCommand(
  telemetry: Telemetry,
  action: string,
  temperature?: number,
  minutes?: number,
): Telemetry {
  const next: Telemetry = { ...telemetry, updatedAt: Date.now(), source: "mock" };
  switch (action) {
    case "lock":
      next.locked = true;
      next.doorsOpen = { fl: false, fr: false, rl: false, rr: false };
      next.trunkOpen = false;
      break;
    case "unlock":
      next.locked = false;
      break;
    case "engine_start":
      next.engineOn = true;
      next.coolantC = 78;
      break;
    case "engine_stop":
      next.engineOn = false;
      next.speedKmh = 0;
      next.coolantC = 48;
      break;
    case "trunk_open":
      next.trunkOpen = true;
      break;
    case "trunk_close":
      next.trunkOpen = false;
      break;
    case "windows_open":
      next.windowsOpen = true;
      next.windowsVent = false;
      break;
    case "windows_close":
      next.windowsOpen = false;
      next.windowsVent = false;
      break;
    case "windows_vent":
      next.windowsOpen = false;
      next.windowsVent = true;
      break;
    case "climate_on":
      next.climateOn = true;
      if (typeof temperature === "number") next.targetTemp = Math.min(31, Math.max(18, Math.round(temperature)));
      if (typeof minutes === "number") next.climateMinutes = clampClimateMinutes(minutes);
      next.interiorTemp = next.targetTemp;
      break;
    case "climate_off":
      next.climateOn = false;
      break;
    case "horn":
      break;
    default:
      break;
  }
  return next;
}
