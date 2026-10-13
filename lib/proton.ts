import { createHash, randomUUID } from "crypto";
import { listFromEnvelope, mergeVehicles, objectFromEnvelope, vehicleFromAtlas, vehicleFromLegacy } from "./normalize";
import { clampClimateMinutes } from "./mock";
import type { ApiEnvelope, ControlAction, LoginEntity, Session, Vehicle } from "./types";

const LEGACY = process.env.PROTON_LEGACY_BASE ?? "https://app.acotech.my:8443";
const ATLAS = process.env.PROTON_ATLAS_BASE ?? "https://app-atlas.acotech.my:8443";
const AGENT = process.env.PROTON_AGENT_TYPE || "android";
const DEVICE_ID = (process.env.PROTON_DEVICE_ID || randomUUID()).replace(/-/g, "");
const VERSION_NAME = "2.1.0";
const VERSION_CODE = "210";
const AGENT_VERSION = "34";

function md5(value: string): string {
  return createHash("md5").update(value, "utf8").digest("hex");
}

function normalizeMsisdn(raw: string): string {
  let digits = raw.replace(/[\s()-]/g, "").replace(/^\+/, "");
  if (digits.startsWith("60")) return digits;
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `60${digits}`;
}

export class ProtonError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function messageOf(payload: ApiEnvelope | null, fallback: string): string {
  return payload?.msg || payload?.message || payload?.exceptionCode || fallback;
}

function succeeded(payload: ApiEnvelope | null): boolean {
  if (!payload) return false;
  if (payload.isSuccess === true) return true;
  const code = payload.code;
  if (code === 0 || code === 200 || code === "0" || code === "200" || code === "0000") return true;
  if (payload.isSuccess === false) return false;
  if (typeof code === "number" && code >= 400) return false;
  return payload.originData != null || payload.data != null;
}

async function callProton(
  base: string,
  path: string,
  session: Session | null,
  init: RequestInit = {},
): Promise<ApiEnvelope | null> {
  const headers = new Headers(init.headers);
  const atlas = base.includes("app-atlas");
  if (atlas) {
    headers.set("ACCEPT-LANGUAGE", "en");
    headers.set("VERSION-NAME", VERSION_NAME);
    headers.set("VERSION-CODE", VERSION_CODE);
    headers.set("X-EQUIPMENT-TYPE", "Proton_Link");
    headers.set("X-EQUIPMENT-BRAND", "google");
    headers.set("X-EQUIPMENT-MODEL", "Pixel 7");
    headers.set("X-EQUIPMENT-OS-VERSION", "14");
    headers.set("X-AGENT-VERSION", AGENT_VERSION);
    headers.set("CLIENT-ID", AGENT);
    headers.set("TENANT-ID", "acotech");
    headers.set("APP-NAME", "Proton Link");
    headers.set("REQUEST-ID", randomUUID().replace(/-/g, ""));
    headers.set("Content-Type", "application/json");
    if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  } else {
    headers.set("X-AGENT-TYPE", AGENT);
    headers.set("Accept-Language", "en");
    headers.set("Connection", "close");
    headers.set("APP-NAME", "Proton Link");
    headers.set("Version-Name", VERSION_NAME);
    headers.set("Version-Code", VERSION_CODE);
    headers.set("X-APP-ID", "protonlink_01");
    headers.set("X-EQUIPMENT-TYPE", "proton link");
    headers.set("X-AGENT-VERSION", AGENT_VERSION);
    headers.set("Content-Type", "application/json");
    headers.set("AUTHORIZATION", session?.accessToken ?? "");
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "network error";
    throw new ProtonError(`Proton gateway unreachable (${reason})`);
  }

  const text = await response.text();
  let payload: ApiEnvelope | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope;
    } catch {
      payload = { msg: text.slice(0, 180) };
    }
  }
  if (!response.ok && !succeeded(payload)) {
    throw new ProtonError(messageOf(payload, `Gateway responded ${response.status}`), response.status);
  }
  return payload;
}

export async function loginWithPassword(mobilePhone: string, password: string): Promise<LoginEntity> {
  const payload = await callProton(LEGACY, "/app/v1/member/login", null, {
    method: "POST",
    body: JSON.stringify({
      mobilePhone: normalizeMsisdn(mobilePhone),
      password: md5(password),
      type: "1",
      clientType: "phone",
      deviceId: DEVICE_ID,
    }),
  });
  const bag = (payload?.originData ?? payload?.data ?? payload) as Record<string, unknown> | null;
  const accessToken = typeof bag?.accessToken === "string" ? bag.accessToken : typeof bag?.token === "string" ? bag.token : "";
  const userId = bag?.userId != null ? String(bag.userId) : "";
  if (!accessToken || !succeeded(payload)) {
    throw new ProtonError(messageOf(payload, "Login was rejected"), 401);
  }
  return {
    accessToken,
    userId: userId || mobilePhone,
    refreshToken: typeof bag?.refreshToken === "string" ? bag.refreshToken : undefined,
    expiresIn: bag?.expiresIn != null ? String(bag.expiresIn) : undefined,
    clientId: typeof bag?.clientId === "string" ? bag.clientId : undefined,
  };
}

async function legacyVehicles(session: Session): Promise<Vehicle[]> {
  const query = new URLSearchParams({
    userId: session.userId,
    onlySearchDefault: "false",
    isPage: "false",
  });
  const payload = await callProton(LEGACY, `/app/v1/vehicle?${query.toString()}`, session);
  return listFromEnvelope(payload).map(vehicleFromLegacy).filter((item): item is Vehicle => item != null);
}

async function atlasVehicles(session: Session): Promise<Vehicle[]> {
  const payload = await callProton(ATLAS, "/basic/user/vehicle/list", session);
  return listFromEnvelope(payload).map(vehicleFromAtlas).filter((item): item is Vehicle => item != null);
}

async function graphicFor(session: Session, vehicle: Vehicle): Promise<string | null> {
  if (vehicle.imageUrl) return vehicle.imageUrl;
  try {
    const query = new URLSearchParams({ vin: vehicle.vin, isPage: "false" });
    const pics = await callProton(LEGACY, `/app/v1/vehicle/modelImage?${query.toString()}`, session);
    const list = listFromEnvelope(pics);
    const first = list.find((item) => {
      const record = item as { imageUrl?: string };
      return Boolean(record?.imageUrl);
    }) as { imageUrl?: string } | undefined;
    if (first?.imageUrl) return first.imageUrl;
  } catch {
    /* picture catalog is optional */
  }
  if (vehicle.matCode && vehicle.modelCode && vehicle.bodyColorCode) {
    try {
      const payload = await callProton(ATLAS, "/basic/mat/model/bodyPictureList", session, {
        method: "POST",
        body: JSON.stringify({
          matCode: vehicle.matCode,
          modelCode: vehicle.modelCode,
          bodyColorCode: vehicle.bodyColorCode,
          topColorCode: vehicle.topColorCode || null,
        }),
      });
      const data = objectFromEnvelope(payload) as { fileUrls?: Array<{ url?: string }> } | null;
      const url = data?.fileUrls?.find((file) => file.url)?.url;
      if (url) return url;
    } catch {
      /* factory render is optional */
    }
  }
  return null;
}

export async function fetchVehicles(session: Session): Promise<Vehicle[]> {
  const [legacy, atlas] = await Promise.allSettled([legacyVehicles(session), atlasVehicles(session)]);
  const legacyList = legacy.status === "fulfilled" ? legacy.value : [];
  const atlasList = atlas.status === "fulfilled" ? atlas.value : [];
  if (!legacyList.length && !atlasList.length) {
    const reason =
      legacy.status === "rejected"
        ? legacy.reason instanceof Error
          ? legacy.reason.message
          : "Vehicle list failed"
        : "No vehicles were returned";
    throw new ProtonError(reason);
  }
  const merged = mergeVehicles(atlasList, legacyList);
  const withArt = await Promise.all(
    merged.map(async (vehicle) => ({
      ...vehicle,
      imageUrl: await graphicFor(session, vehicle),
    })),
  );
  return withArt;
}

export async function fetchStatusPayloads(session: Session, vin: string): Promise<{ legacy: unknown; atlas: unknown }> {
  const atlas = await callProton(ATLAS, "/iot/function/getVehicleStatus", session, {
    method: "POST",
    body: JSON.stringify({ vin }),
  });
  return { legacy: null, atlas: objectFromEnvelope(atlas) };
}

export async function sendCommand(
  session: Session,
  vin: string,
  action: ControlAction,
  temperature?: number,
  minutes?: number,
): Promise<unknown> {
  const climateMinutes = clampClimateMinutes(minutes ?? 10);
  const temp = typeof temperature === "number" ? String(Math.min(31, Math.max(18, Math.round(temperature)))) : "22";
  const bodies: Record<ControlAction, { serviceKey: string; duration?: number; parameters?: Array<{ key: string; stringVal: string }> }> = {
    lock: { serviceKey: "RDL-OFF" },
    unlock: { serviceKey: "RDU-ON" },
    engine_start: { serviceKey: "RES-Engine-ON", duration: climateMinutes },
    engine_stop: { serviceKey: "RES-Engine-OFF" },
    trunk_open: { serviceKey: "RDU-TargetON" },
    trunk_close: { serviceKey: "RDU-TargetOFF" },
    windows_open: { serviceKey: "RWS-ON" },
    windows_close: { serviceKey: "RWS-OFF" },
    windows_vent: { serviceKey: "RWS-BreathableON" },
    climate_on: { serviceKey: "RCE-ON", duration: climateMinutes * 60, parameters: [{ key: "rce.temp", stringVal: temp }] },
    climate_off: { serviceKey: "RCE-OFF" },
    horn: { serviceKey: "RHL-HornAndLight" },
  };
  const command = bodies[action];
  const payload = await callProton(ATLAS, "/iot/function/vehicleControl", session, {
    method: "POST",
    body: JSON.stringify({
      vin,
      scheduledTime: null,
      endTime: null,
      duration: command.duration ?? null,
      parameters: command.parameters ?? null,
      timerData: null,
      serviceKey: command.serviceKey,
    }),
  });
  if (!succeeded(payload)) {
    throw new ProtonError(messageOf(payload, "Command was not accepted"), 400);
  }
  return objectFromEnvelope(payload);
}
