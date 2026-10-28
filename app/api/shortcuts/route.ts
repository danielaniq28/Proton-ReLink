import { NextResponse } from "next/server";
import { formatSiriSpeech, parseShortcutToken } from "@/lib/shortcuts";
import { readMockState, readSession, writeMockState } from "@/lib/session";
import { applyMockCommand, clampClimateMinutes, mockTelemetry, mockVehicles } from "@/lib/mock";
import { ProtonError, fetchStatusPayloads, sendCommand } from "@/lib/proton";
import type { ControlAction, Session, Telemetry, Vehicle } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = new Set<string>([
  "lock",
  "unlock",
  "engine_start",
  "engine_stop",
  "climate_on",
  "climate_off",
  "trunk_open",
  "trunk_close",
  "windows_open",
  "windows_close",
  "windows_vent",
  "status",
]);

async function handleShortcut(request: Request, searchParams: URLSearchParams, bodyData?: Record<string, unknown>) {
  const token =
    searchParams.get("token") ||
    searchParams.get("key") ||
    (typeof bodyData?.token === "string" ? bodyData.token : "") ||
    (request.headers.get("authorization")?.replace(/^bearer\s+/i, "") ?? "");

  const action = (searchParams.get("action") || bodyData?.action || "status") as string;
  const minutes = Number(searchParams.get("minutes") || bodyData?.minutes || 10);
  const temperature = Number(searchParams.get("temperature") || bodyData?.temperature || 22);

  if (!VALID_ACTIONS.has(action)) {
    return NextResponse.json(
      { ok: false, message: `Invalid action: ${action}`, speech: `Action ${action} is not supported.` },
      { status: 400 }
    );
  }

  // 1. Resolve session: from Shortcut token, or fallback to session cookie
  let session: Session | null = null;
  let carType = "Proton";
  let plate = "";
  let vin = searchParams.get("vin") || (typeof bodyData?.vin === "string" ? bodyData.vin : "");

  if (token) {
    const payload = parseShortcutToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid or expired Siri Shortcut token",
          speech: "Your Siri shortcut token is invalid. Please open Proton Re-Link and copy your updated shortcut.",
        },
        { status: 401 }
      );
    }
    session = {
      accessToken: payload.accessToken,
      userId: payload.userId,
      refreshToken: payload.refreshToken,
      demo: payload.demo,
      selectedVin: vin || payload.vin,
      backend: payload.backend,
    };
    carType = payload.carType || "Proton";
    plate = payload.plate || "";
    if (!vin) vin = payload.vin;
  } else {
    // Check cookie session
    session = await readSession();
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          message: "Authentication required",
          speech: "Please configure your Siri Shortcut token in Proton Re-Link first.",
        },
        { status: 401 }
      );
    }
    if (!vin) vin = session.selectedVin || "";
  }

  const isDemo = Boolean(session.demo);
  const isStatus = action === "status";

  // 2. Handle Status Query
  if (isStatus) {
    if (isDemo) {
      const state = (await readMockState()) ?? {};
      const vehicle = mockVehicles().find((v) => v.vin === vin) || mockVehicles()[0];
      const telemetry = state[vin] ?? mockTelemetry(vehicle);
      const speech = formatSiriSpeech("status", carType || vehicle.carType, plate || vehicle.plate, telemetry);

      return formatResponse(request, {
        ok: true,
        action: "status",
        speech,
        telemetry,
        carType: carType || vehicle.carType,
        plate: plate || vehicle.plate,
      });
    }

    try {
      const statusPayload = await fetchStatusPayloads(session, vin, session.backend || "atlas");
      const { telemetryFromPayloads } = await import("@/lib/normalize");
      const vehicle = { vin, carType, plate, backend: session.backend || "atlas" } as Vehicle;
      const fallback = mockTelemetry(vehicle);
      const telemetry = telemetryFromPayloads(vin, statusPayload.legacy, statusPayload.atlas, fallback, carType, session.backend, statusPayload.flow);
      const speech = formatSiriSpeech("status", carType, plate, telemetry);

      return formatResponse(request, {
        ok: true,
        action: "status",
        speech,
        telemetry,
        carType,
        plate,
      });
    } catch {
      const speech = `Your ${carType} status could not be retrieved from the Proton gateway right now.`;
      return formatResponse(request, { ok: false, action: "status", speech, message: "Status query failed" }, 502);
    }
  }

  // 3. Handle Control Commands (lock, unlock, engine_start, etc.)
  const controlAction = action as ControlAction;

  if (isDemo) {
    const state = (await readMockState()) ?? {};
    const vehicle = mockVehicles().find((v) => v.vin === vin) || mockVehicles()[0];
    const current = state[vin] ?? mockTelemetry(vehicle);
    const telemetry = applyMockCommand(current, controlAction, temperature, minutes);
    state[vin] = telemetry;
    await writeMockState(state);
    const speech = formatSiriSpeech(controlAction, carType || vehicle.carType, plate || vehicle.plate, telemetry);

    return formatResponse(request, {
      ok: true,
      action: controlAction,
      speech,
      telemetry,
      message: `Preview command ${controlAction} applied successfully.`,
    });
  }

  // Live Vehicle Command
  try {
    const result = await sendCommand(
      session,
      vin,
      controlAction,
      temperature,
      clampClimateMinutes(minutes)
    );

    const state = (await readMockState()) ?? {};
    const vehicle = { vin, carType, plate, backend: session.backend || "atlas" } as Vehicle;
    const current = state[vin] ?? mockTelemetry(vehicle);
    const telemetry = applyMockCommand(current, controlAction, temperature, minutes);
    state[vin] = telemetry;
    await writeMockState(state);

    const speech = formatSiriSpeech(controlAction, carType, plate, telemetry);
    return formatResponse(request, {
      ok: true,
      action: controlAction,
      speech,
      result,
      telemetry,
      message: "Command executed by vehicle",
    });
  } catch (error) {
    const message = error instanceof ProtonError ? error.message : "Command failed";
    const speech = `Failed to send ${controlAction} to your ${carType}. ${message}.`;
    return formatResponse(request, { ok: false, action: controlAction, speech, message }, error instanceof ProtonError ? error.status : 502);
  }
}

function formatResponse(request: Request, data: Record<string, unknown>, status = 200) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/plain")) {
    return new Response(String(data.speech || data.message || "OK"), {
      status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.json(data, { status });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return handleShortcut(request, url.searchParams);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return handleShortcut(request, url.searchParams, body);
}
