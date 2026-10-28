import { extractCarType } from "./car-type";
import { resolveProtonColorName } from "./color";
import type { Telemetry, Vehicle } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function flagOn(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const token = value.trim().toLowerCase();
    if (["1", "true", "on", "open", "running", "engine_running", "start", "started", "locked"].includes(token)) {
      return true;
    }
    if (["0", "false", "off", "close", "closed", "stop", "stopped", "unlocked", "parking"].includes(token)) {
      return false;
    }
  }
  return null;
}

function pickImage(record: Record<string, unknown>): string | null {
  const direct =
    str(record.imageUrl) ||
    str(record.vehicleModelUrl) ||
    str(record.pictureUrl) ||
    str(record.carResourcePath) ||
    str(record.modelPictureUrl) ||
    str(record.coverImageUrl) ||
    str(record.carPicture) ||
    str(record.avatarUrl);
  return direct || null;
}

export function extractPlate(record: Record<string, unknown>): string {
  const candidates = [
    record.customPlateNo,
    record.licensePlateNo,
    record.plateNo,
    record.userPlateNum,
    record.plateNum,
    record.licensePlate,
    record.carPlate,
    record.carPlateNo,
    record.plate,
    record.plateNumber,
    record.carNo,
    record.regNo,
    record.numberPlate,
  ];
  for (const c of candidates) {
    const val = str(c);
    if (val && val !== "null" && val !== "undefined" && val !== "--") {
      return val;
    }
  }
  return "";
}

export function vehicleFromLegacy(raw: unknown): Vehicle | null {
  const record = asRecord(raw);
  if (!record) return null;
  const vin = str(record.vin);
  if (!vin) return null;
  const modelName = str(record.modelName);
  const seriesName = str(record.seriesName);
  const matName = str(record.matName);
  const carType = extractCarType(modelName, seriesName, matName, str(record.modelCode), str(record.vehicleName));
  const rawColor =
    str(record.userColorName) ||
    str(record.colorName) ||
    str(record.bodyColorName) ||
    str(record.bodyColorCode) ||
    str(record.colorCode);
  const colorName = resolveProtonColorName(rawColor, carType);

  return {
    vin,
    modelCode: str(record.modelCode),
    modelName,
    seriesName,
    matName,
    matCode: str(record.matCode),
    bodyColorCode: str(record.bodyColorCode) || str(record.colorCode),
    topColorCode: str(record.topColorCode),
    vehicleName: str(record.vehicleName) || modelName || seriesName,
    plate: extractPlate(record),
    colorName,
    imageUrl: pickImage(record),
    carType,
    isDefault: record.isDefault === true,
    backend: "ecarx",
  };
}

export function vehicleFromAtlas(raw: unknown): Vehicle | null {
  const record = asRecord(raw);
  if (!record) return null;
  const vin = str(record.vin);
  if (!vin) return null;
  const modelName = str(record.modelName);
  const vehicleName = str(record.vehicleName);
  const matName = str(record.matName);
  const carType = extractCarType(modelName, vehicleName, matName, str(record.modelCode));
  const rawColor =
    str(record.userColorName) ||
    str(record.colorName) ||
    str(record.bodyColorName) ||
    str(record.bodyColorCode);
  const colorName = resolveProtonColorName(rawColor, carType);

  return {
    vin,
    modelCode: str(record.modelCode),
    modelName,
    seriesName: modelName,
    matName,
    matCode: str(record.matCode) || str(record.seriesCode) || str(record.modelCode),
    bodyColorCode:
      str(record.bodyColorCode) ||
      str(record.colorCode) ||
      str(record.userColorCode) ||
      str(record.exteriorColorCode),
    topColorCode: str(record.topColorCode),
    vehicleName: vehicleName || modelName,
    plate: extractPlate(record),
    colorName,
    imageUrl: pickImage(record),
    carType,
    isDefault: record.isDefault === true,
    backend: "atlas",
  };
}

export function mergeVehicles(primary: Vehicle[], extra: Vehicle[]): Vehicle[] {
  const map = new Map<string, Vehicle>();
  for (const vehicle of [...extra, ...primary]) {
    const existing = map.get(vehicle.vin);
    if (!existing) {
      map.set(vehicle.vin, vehicle);
      continue;
    }
    map.set(vehicle.vin, {
      ...existing,
      ...vehicle,
      imageUrl: vehicle.imageUrl || existing.imageUrl,
      plate: vehicle.plate || existing.plate,
      colorName: vehicle.colorName || existing.colorName,
      carType: vehicle.carType !== "PROTON" ? vehicle.carType : existing.carType,
      isDefault: vehicle.isDefault || existing.isDefault,
    });
  }
  return [...map.values()];
}

const FUEL_TANKS: Record<string, number> = { S70: 50, X70: 60, X50: 45, X90: 60, IRIZ: 40, PERSONA: 40, SAGA: 40 };

function hatchOpen(value: unknown): boolean | null {
  const code = num(value);
  if (code == null) return null;
  return code !== 2;
}

function paneOpen(value: unknown): boolean | null {
  const code = num(value);
  if (code == null) return null;
  return code !== 0;
}

function doorIsLocked(value: unknown): boolean {
  const code = num(value);
  return code == null || code === 2 || code === 3;
}

function kpa(value: unknown): number | null {
  const parsed = num(value);
  if (parsed == null) return null;
  if (parsed > 0 && parsed < 10) return Math.round(parsed * 100);
  return Math.round(parsed);
}

export function telemetryFromAtlas(
  vin: string,
  atlas: unknown,
  fallback: Telemetry,
  carType = "",
): Telemetry {
  const atlasStatus = asRecord(atlas) ?? {};
  const next: Telemetry = { ...fallback, vin, source: "live", backend: "atlas", updatedAt: Date.now() };

  if (atlasStatus.engineStatus != null) {
    next.engineOn = String(atlasStatus.engineStatus) === "0";
  }

  const lockFields = [
    atlasStatus.doorLockStatusLeftFront,
    atlasStatus.doorLockStatusRightFront,
    atlasStatus.doorLockStatusLeftRear,
    atlasStatus.doorLockStatusRightRear,
  ];
  if (lockFields.some((value) => value != null)) {
    next.locked = lockFields.every(doorIsLocked);
  }

  const trunk = hatchOpen(atlasStatus.trunkOpenStatus);
  if (trunk != null) next.trunkOpen = trunk;
  const hood = hatchOpen(atlasStatus.engineHoodOpenStatus);
  if (hood != null) next.hoodOpen = hood;

  if (atlasStatus.preClimateActive != null) {
    next.climateOn = atlasStatus.preClimateActive === "true" || atlasStatus.preClimateActive === true || atlasStatus.preClimateActive === "1";
  }

  const panes = [
    paneOpen(atlasStatus.winStatusLeftFront),
    paneOpen(atlasStatus.winStatusRightFront),
    paneOpen(atlasStatus.winStatusLeftRear),
    paneOpen(atlasStatus.winStatusRightRear),
  ].filter((value): value is boolean => value != null);
  if (panes.length) next.windowsOpen = panes.some(Boolean);

  const winPositions = [
    num(atlasStatus.winPosLeftFront),
    num(atlasStatus.winPosLeftRear),
    num(atlasStatus.winPosRightFront),
    num(atlasStatus.winPosRightRear),
  ].filter((value): value is number => value != null);
  const ventCode = num(atlasStatus.ventilateStatus);
  if (ventCode != null || winPositions.length === 4) {
    next.windowsVent = ventCode === 1 || (winPositions.length === 4 && winPositions.every((value) => value === 8));
  }

  const litres = num(atlasStatus.fuelLevel);
  if (litres != null) {
    next.fuelLitres = litres;
    const tank = FUEL_TANKS[carType];
    if (tank) next.fuelPercent = Math.max(0, Math.min(100, Math.round((litres / tank) * 100)));
  }

  const voltage = num(atlasStatus.voltage);
  if (voltage != null) next.batteryVoltage = voltage;

  const range = num(atlasStatus.distanceToEmpty);
  if (range != null) next.rangeKm = Math.round(range);

  const efficiency = num(atlasStatus.aveFuelConsumption);
  if (efficiency != null) next.efficiencyLPer100 = Math.round(efficiency * 10) / 10;

  const odo = num(atlasStatus.odometer);
  if (odo != null) next.odometerKm = Math.round(odo);

  const speed = num(atlasStatus.speed);
  if (speed != null) next.speedKmh = Math.round(speed);
  const avgSpeed = num(atlasStatus.aveSpeed ?? atlasStatus.averageSpeed ?? atlasStatus.avgSpeed);
  if (avgSpeed != null) next.avgSpeedKmh = Math.round(avgSpeed);

  const serviceKm = num(atlasStatus.distanceToService);
  if (serviceKm != null) next.serviceKm = Math.round(serviceKm);
  const serviceDays = num(atlasStatus.daysToService);
  if (serviceDays != null) next.serviceDays = Math.round(serviceDays);

  const interior = num(atlasStatus.interiorTemp);
  if (interior != null) next.interiorTemp = Math.round(interior);
  const exterior = num(atlasStatus.exteriorTemp);
  if (exterior != null) next.exteriorTemp = Math.round(exterior);
  const acTemp = num(atlasStatus.airConditionTemperature);
  if (acTemp != null) next.targetTemp = Math.round(acTemp);

  const coolantValidity = atlasStatus.engineCoolantTemperatureValidity;
  const coolant = num(atlasStatus.engineCoolantTemperature);
  if (coolant != null && String(coolantValidity ?? "1") !== "0") {
    next.coolantC = Math.round(coolant);
  }

  const lat = num(atlasStatus.latitude);
  const lng = num(atlasStatus.longitude);
  if (lat != null && lng != null && Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01) {
    next.latitude = lat;
    next.longitude = lng;
    next.place = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
  const heading = num(atlasStatus.direction);
  if (heading != null) next.heading = heading;

  const updated = num(atlasStatus.updateTime);
  if (updated != null) next.updatedAt = updated > 10_000_000_000 ? updated : updated * 1000;

  const corners: Array<["fl" | "fr" | "rl" | "rr", string, string, string]> = [
    ["fl", "tyreStatusLeftFront", "tyreTempLeftFront", "tyrePreWarningLeftFront"],
    ["fr", "tyreStatusRightFront", "tyreTempRightFront", "tyrePreWarningRightFront"],
    ["rl", "tyreStatusLeftRear", "tyreTempLeftRear", "tyrePreWarningLeftRear"],
    ["rr", "tyreStatusRightRear", "tyreTempRightRear", "tyrePreWarningRightRear"],
  ];
  for (const [key, pressureKey, tempKey, warnKey] of corners) {
    const pressure = kpa(atlasStatus[pressureKey]);
    const temp = num(atlasStatus[tempKey]);
    const warningCode = num(atlasStatus[warnKey]);
    const warning = warningCode != null ? warningCode !== 0 : undefined;
    next.tires[key] = {
      pressureKpa: pressure ?? next.tires[key].pressureKpa,
      tempC: temp != null ? Math.round(temp) : next.tires[key].tempC,
      warning: warning ?? next.tires[key].warning,
    };
  }

  const doors: Array<["fl" | "fr" | "rl" | "rr", string]> = [
    ["fl", "doorOpenStatusLeftFront"],
    ["fr", "doorOpenStatusRightFront"],
    ["rl", "doorOpenStatusLeftRear"],
    ["rr", "doorOpenStatusRightRear"],
  ];
  for (const [key, field] of doors) {
    const open = hatchOpen(atlasStatus[field]);
    if (open != null) next.doorsOpen[key] = open;
  }

  return next;
}

export function telemetryFromEcarx(
  vin: string,
  legacy: unknown,
  fallback: Telemetry,
  carType = "",
): Telemetry {
  const legacyRoot = asRecord(legacy);
  const legacyStatus = asRecord(legacyRoot?.vehicleStatus) ?? legacyRoot;
  const basic = asRecord(legacyStatus?.basicVehicleStatus);
  const additional = asRecord(legacyStatus?.additionalVehicleStatus);
  const running = asRecord(additional?.runningStatus);
  const maintenance = asRecord(additional?.maintenanceStatus);
  const climate = asRecord(additional?.climateStatus);
  const position = asRecord(basic?.position);

  const next: Telemetry = { ...fallback, vin, source: "live", backend: "ecarx", updatedAt: Date.now() };

  const engine = flagOn(basic?.engineStatus);
  if (engine != null) next.engineOn = engine;

  const lock = flagOn(basic?.lockStatus);
  if (lock != null) next.locked = lock;

  const trunk = flagOn(basic?.trunkStatus);
  if (trunk != null) next.trunkOpen = trunk;
  const hood = flagOn(basic?.hoodStatus);
  if (hood != null) next.hoodOpen = hood;

  const climateOn = flagOn(climate?.preClimateActive);
  if (climateOn != null) next.climateOn = climateOn;
  const acTemp = num(climate?.airConditionTemperature);
  if (acTemp != null) next.targetTemp = Math.round(acTemp);

  const litres = num(running?.fuelLevel);
  if (litres != null) {
    next.fuelLitres = litres;
    const tank = FUEL_TANKS[carType];
    if (tank) next.fuelPercent = Math.max(0, Math.min(100, Math.round((litres / tank) * 100)));
  }

  const range = num(basic?.distanceToEmpty);
  if (range != null) next.rangeKm = Math.round(range);

  const efficiency = num(running?.aveFuelConsumption);
  if (efficiency != null) next.efficiencyLPer100 = Math.round(efficiency * 10) / 10;

  const odo = num(maintenance?.odometer);
  if (odo != null) next.odometerKm = Math.round(odo);

  const speed = num(basic?.speed);
  if (speed != null) next.speedKmh = Math.round(speed);
  const avgSpeed = num(running?.aveSpeed ?? running?.averageSpeed ?? basic?.aveSpeed ?? basic?.averageSpeed);
  if (avgSpeed != null) next.avgSpeedKmh = Math.round(avgSpeed);

  const serviceKm = num(maintenance?.distanceToService);
  if (serviceKm != null) next.serviceKm = Math.round(serviceKm);

  const interior = num(climate?.interiorTemp);
  if (interior != null) next.interiorTemp = Math.round(interior);
  const exterior = num(climate?.exteriorTemp);
  if (exterior != null) next.exteriorTemp = Math.round(exterior);

  const coolant = num(running?.engineCoolantTemperature);
  if (coolant != null) next.coolantC = Math.round(coolant);
  const oil = flagOn(running?.engineOilPressureWarning);
  if (oil != null) next.oilOk = !oil;

  const lat = num(position?.latitude);
  const lng = num(position?.longitude);
  if (lat != null && lng != null && Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01) {
    next.latitude = lat;
    next.longitude = lng;
    next.place = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
  const heading = num(basic?.direction);
  if (heading != null) next.heading = heading;

  const updated = num(legacyStatus?.updateTime);
  if (updated != null) next.updatedAt = updated > 10_000_000_000 ? updated : updated * 1000;

  const legacyCorners: Record<"fl" | "fr" | "rl" | "rr", [string, string, string]> = {
    fl: ["tyreStatusDriver", "tyreTempDriver", "tyrePreWarningDriver"],
    fr: ["tyreStatusPassenger", "tyreTempPassenger", "tyrePreWarningPassenger"],
    rl: ["tyreStatusDriverRear", "tyreTempDriverRear", "tyrePreWarningDriverRear"],
    rr: ["tyreStatusPassengerRear", "tyreTempPassengerRear", "tyrePreWarningPassengerRear"],
  };
  for (const cornerKey of ["fl", "fr", "rl", "rr"] as const) {
    const [pressureKey, tempKey, warnKey] = legacyCorners[cornerKey];
    const pressure = kpa(maintenance?.[pressureKey]);
    const temp = num(maintenance?.[tempKey]);
    const warning = flagOn(maintenance?.[warnKey]);
    next.tires[cornerKey] = {
      pressureKpa: pressure ?? next.tires[cornerKey].pressureKpa,
      tempC: temp != null ? Math.round(temp) : next.tires[cornerKey].tempC,
      warning: warning ?? next.tires[cornerKey].warning,
    };
  }

  return next;
}

export function parseFlowToGb(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    if (value > 10_000_000) return value / (1024 * 1024 * 1024);
    if (value > 10_000) return value / (1024 * 1024);
    if (value > 50) return value / 1024;
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "--" || trimmed === "null") return null;

    const gbMatch = trimmed.match(/^([0-9.]+)\s*g(?:b)?$/i);
    if (gbMatch) return Number(gbMatch[1]);

    const mbMatch = trimmed.match(/^([0-9.]+)\s*m(?:b)?$/i);
    if (mbMatch) return Number(mbMatch[1]) / 1024;

    const kbMatch = trimmed.match(/^([0-9.]+)\s*k(?:b)?$/i);
    if (kbMatch) return Number(kbMatch[1]) / (1024 * 1024);

    const bytesMatch = trimmed.match(/^([0-9.]+)\s*b(?:ytes)?$/i);
    if (bytesMatch) return Number(bytesMatch[1]) / (1024 * 1024 * 1024);

    const numVal = Number(trimmed);
    if (Number.isFinite(numVal) && numVal >= 0) {
      if (numVal > 10_000_000) return numVal / (1024 * 1024 * 1024);
      if (numVal > 10_000) return numVal / (1024 * 1024);
      if (numVal > 50) return numVal / 1024;
      return numVal;
    }
  }
  return null;
}

export function applyFlowData(telemetry: Telemetry, flowRaw: unknown): Telemetry {
  const record = asRecord(flowRaw);
  if (!record) return telemetry;

  // OpenAPI schema FlowEntity: { residueFlow: string, usedFlow: string }
  const rawResidue = str(record.residueFlow ?? record.remainingFlow ?? record.residue);
  const rawUsed = str(record.usedFlow ?? record.used);

  const parsedReportedMax = parseFlowToGb(rawResidue);
  const parsedUsed = parseFlowToGb(rawUsed) ?? 0;

  // In Proton Connected Services, the reported quota figure (residueFlow e.g. "2.00GB")
  // represents the total allocated plan cap. The actual remaining data is this maximum
  // minus the recorded consumption (usedFlow e.g. "3MB").
  const maxQuotaGb = parsedReportedMax ?? telemetry.totalDataGb ?? 2.0;
  const actualRemainingGb = Math.max(0, Math.round((maxQuotaGb - parsedUsed) * 10000) / 10000);

  return {
    ...telemetry,
    totalDataGb: maxQuotaGb,
    remainingDataGb: actualRemainingGb,
    usedDataGb: parsedUsed,
    rawResidueFlow: rawResidue || null,
    rawUsedFlow: rawUsed || null,
  };
}

export function telemetryFromPayloads(
  vin: string,
  legacy: unknown,
  atlas: unknown,
  fallback: Telemetry,
  carType = "",
  backend: "atlas" | "ecarx" = "atlas",
  flow?: unknown,
): Telemetry {
  let base: Telemetry;
  if (backend === "ecarx") {
    base = telemetryFromEcarx(vin, legacy, fallback, carType);
  } else {
    base = telemetryFromAtlas(vin, atlas, fallback, carType);
  }
  if (flow) {
    base = applyFlowData(base, flow);
  }
  return base;
}

export function listFromEnvelope(payload: unknown): unknown[] {
  const record = asRecord(payload);
  const data = record?.originData ?? record?.data ?? payload;
  return Array.isArray(data) ? data : [];
}

export function objectFromEnvelope(payload: unknown): unknown {
  const record = asRecord(payload);
  if (!record) return null;
  return record.originData ?? record.data ?? record;
}
