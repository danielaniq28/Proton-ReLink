import { createHash, randomUUID } from "crypto";
import { listFromEnvelope, objectFromEnvelope, vehicleFromAtlas, vehicleFromLegacy } from "./normalize";
import { clampClimateMinutes } from "./mock";
import { getDefaultCarImage } from "./vehicle-art";
import type { ApiEnvelope, ControlAction, LoginEntity, Session, TelemetryBackend, Vehicle } from "./types";

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

export async function refreshProtonToken(session: Session): Promise<Session | null> {
  if (!session.refreshToken || !session.userId) return null;
  try {
    const payload = await callProton(
      LEGACY,
      "/app/v1/member/tokenRefresh",
      null,
      {
        method: "POST",
        body: JSON.stringify({
          userId: session.userId,
          refreshToken: session.refreshToken,
          clientType: "phone",
          deviceId: DEVICE_ID,
        }),
      },
      true,
    );

    const bag = (payload?.originData ?? payload?.data ?? payload) as Record<string, unknown> | null;
    const accessToken = typeof bag?.accessToken === "string" ? bag.accessToken : typeof bag?.token === "string" ? bag.token : "";
    if (!accessToken || !succeeded(payload)) {
      return null;
    }

    const updated: Session = {
      ...session,
      accessToken,
      refreshToken: typeof bag?.refreshToken === "string" ? bag.refreshToken : session.refreshToken,
      expiresIn: bag?.expiresIn != null ? String(bag.expiresIn) : session.expiresIn,
    };
    return updated;
  } catch {
    return null;
  }
}

async function callProton(
  base: string,
  path: string,
  session: Session | null,
  init: RequestInit = {},
  isRetry = false,
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
    if (session?.accessToken) {
      headers.set("AUTHORIZATION", session.accessToken);
      headers.set("Authorization", session.accessToken);
      headers.set("token", session.accessToken);
    }
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

  const isAuthError =
    response.status === 401 ||
    payload?.code === 401 ||
    payload?.code === "401" ||
    payload?.code === 40001 ||
    payload?.code === "40001";

  // Transparently refresh expired tokens and retry the request
  if (isAuthError && !isRetry && session?.refreshToken) {
    const refreshed = await refreshProtonToken(session);
    if (refreshed?.accessToken) {
      session.accessToken = refreshed.accessToken;
      if (refreshed.refreshToken) session.refreshToken = refreshed.refreshToken;
      if (refreshed.expiresIn) session.expiresIn = refreshed.expiresIn;

      try {
        const { writeSession } = await import("./session");
        await writeSession(session);
      } catch {
        /* Session persistence if within request context */
      }

      return callProton(base, path, session, init, true);
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

  // 1. Try ATLAS 45-degree isometric car picture (standard in Proton Link)
  try {
    const payload = await callProton(ATLAS, "/basic/model/bodyCode/queryFortyFiveColorPicture", session, {
      method: "POST",
      body: JSON.stringify({
        modelCode: vehicle.modelCode || vehicle.carType,
        bodyColorCode: vehicle.bodyColorCode || "",
        topColorCode: vehicle.topColorCode || null,
        matCode: vehicle.matCode || "",
        vin: vehicle.vin,
      }),
    });
    const data = objectFromEnvelope(payload) as { url?: string; md5?: string } | null;
    if (data?.url) return data.url;
  } catch {
    /* forty-five degree picture optional */
  }

  // 2. Try ATLAS body picture list
  try {
    const payload = await callProton(ATLAS, "/basic/mat/model/bodyPictureList", session, {
      method: "POST",
      body: JSON.stringify({
        matCode: vehicle.matCode || vehicle.modelCode || vehicle.carType,
        modelCode: vehicle.modelCode || vehicle.carType,
        bodyColorCode: vehicle.bodyColorCode || "",
        topColorCode: vehicle.topColorCode || null,
      }),
    });
    const data = objectFromEnvelope(payload) as { fileUrls?: Array<{ url?: string }> } | null;
    const url = data?.fileUrls?.find((file) => file.url)?.url;
    if (url) return url;
  } catch {
    /* factory render is optional */
  }

  // 3. Try LEGACY model image
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

  // 4. Fall back to curated authentic image for the specific model and color
  const fallback = getDefaultCarImage(vehicle.carType, vehicle.colorName);
  if (fallback) return fallback;

  return null;
}

export async function fetchVehicles(session: Session): Promise<Vehicle[]> {
  // If the account/vehicle has compatibility with newer ACO Tech / ATLAS, use that one.
  // If one only supports legacy ECARX, use that one. Do not implement both and merge.
  let list: Vehicle[] = [];
  let backendUsed: TelemetryBackend = "atlas";

  try {
    const atlasList = await atlasVehicles(session);
    if (atlasList && atlasList.length > 0) {
      list = atlasList;
      backendUsed = "atlas";
    }
  } catch {
    // ATLAS not supported or unavailable for this vehicle
  }

  if (list.length === 0) {
    try {
      const legacyList = await legacyVehicles(session);
      if (legacyList && legacyList.length > 0) {
        list = legacyList;
        backendUsed = "ecarx";
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Vehicle list failed";
      throw new ProtonError(reason);
    }
  }

  if (list.length === 0) {
    throw new ProtonError("No vehicles were returned for your account");
  }

  const withArt = await Promise.all(
    list.map(async (vehicle) => ({
      ...vehicle,
      backend: backendUsed,
      imageUrl: await graphicFor(session, vehicle),
    })),
  );
  return withArt;
}

export async function fetchVehicleFlow(
  session: Session,
  vin: string,
): Promise<unknown> {
  const query = new URLSearchParams({
    userId: session.userId,
    vin,
  }).toString();

  try {
    const payload = await callProton(LEGACY, `/app/v1/vehicle/flow?${query}`, session);
    const data = objectFromEnvelope(payload);
    if (data && typeof data === "object") return data;
  } catch {
    /* Fallback to ATLAS */
  }

  try {
    const payload = await callProton(ATLAS, `/app/v1/vehicle/flow?${query}`, session);
    const data = objectFromEnvelope(payload);
    if (data && typeof data === "object") return data;
  } catch {
    /* Flow endpoint unavailable */
  }

  return null;
}

export async function fetchStatusPayloads(
  session: Session,
  vin: string,
  backend: TelemetryBackend = "atlas",
): Promise<{ legacy: unknown; atlas: unknown; flow: unknown }> {
  const flowPromise = fetchVehicleFlow(session, vin);
  if (backend === "ecarx") {
    const legacy = await callProton(
      LEGACY,
      `/app/v1/vehicle/realtimeData?${new URLSearchParams({
        userId: session.userId,
        vin,
        envType: "production",
        appId: "protonlink_01",
      }).toString()}`,
      session,
    );
    const flow = await flowPromise;
    return { legacy: objectFromEnvelope(legacy), atlas: null, flow };
  }

  const atlas = await callProton(ATLAS, "/iot/function/getVehicleStatus", session, {
    method: "POST",
    body: JSON.stringify({ vin }),
  });
  const flow = await flowPromise;
  return { legacy: null, atlas: objectFromEnvelope(atlas), flow };
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
