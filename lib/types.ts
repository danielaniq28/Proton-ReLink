export type LoginEntity = {
  accessToken: string;
  userId: string;
  refreshToken?: string;
  expiresIn?: string;
  clientId?: string;
};

export type TelemetryBackend = "atlas" | "ecarx";

export type Vehicle = {
  vin: string;
  modelCode: string;
  modelName: string;
  seriesName: string;
  matName: string;
  matCode: string;
  bodyColorCode: string;
  topColorCode: string;
  vehicleName: string;
  plate: string;
  colorName: string;
  imageUrl: string | null;
  carType: string;
  isDefault: boolean;
  backend: TelemetryBackend;
};

export type TireCorner = {
  pressureKpa: number;
  tempC: number | null;
  warning: boolean;
};

export type Telemetry = {
  vin: string;
  updatedAt: number;
  source: "live" | "mock";
  backend: TelemetryBackend;
  engineOn: boolean;
  locked: boolean;
  trunkOpen: boolean;
  hoodOpen: boolean;
  windowsOpen: boolean;
  windowsVent: boolean;
  climateOn: boolean;
  targetTemp: number;
  climateMinutes: number;
  interiorTemp: number;
  exteriorTemp: number;
  fuelPercent: number;
  fuelLitres: number | null;
  batteryVoltage: number | null;
  efficiencyLPer100: number;
  rangeKm: number;
  odometerKm: number;
  speedKmh: number;
  serviceKm: number;
  serviceDays: number;
  coolantC: number;
  oilOk: boolean;
  latitude: number;
  longitude: number;
  heading: number;
  place: string;
  tires: {
    fl: TireCorner;
    fr: TireCorner;
    rl: TireCorner;
    rr: TireCorner;
  };
  doorsOpen: { fl: boolean; fr: boolean; rl: boolean; rr: boolean };
};

export type ControlAction =
  | "lock"
  | "unlock"
  | "engine_start"
  | "engine_stop"
  | "trunk_open"
  | "trunk_close"
  | "windows_open"
  | "windows_close"
  | "windows_vent"
  | "climate_on"
  | "climate_off"
  | "horn";

export type Session = {
  accessToken: string;
  userId: string;
  refreshToken?: string;
  expiresIn?: string;
  demo: boolean;
  selectedVin?: string;
  backend?: TelemetryBackend;
};

export type ApiEnvelope = {
  code?: number | string;
  msg?: string;
  message?: string;
  isSuccess?: boolean;
  data?: unknown;
  originData?: unknown;
  exceptionCode?: string;
};
