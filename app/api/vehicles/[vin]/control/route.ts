import { NextResponse } from "next/server";
import { applyMockCommand, clampClimateMinutes, mockTelemetry, mockVehicles } from "@/lib/mock";
import type { ControlAction } from "@/lib/types";
import { ProtonError, sendCommand } from "@/lib/proton";
import { readMockState, readSession, writeMockState } from "@/lib/session";

export const dynamic = "force-dynamic";

const ACTIONS = new Set<ControlAction>([
  "lock",
  "unlock",
  "engine_start",
  "engine_stop",
  "trunk_open",
  "trunk_close",
  "windows_open",
  "windows_close",
  "windows_vent",
  "climate_on",
  "climate_off",
  "horn",
]);

type Params = { params: Promise<{ vin: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await readSession();
  if (!session) return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  const { vin } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: ControlAction;
    temperature?: number;
    minutes?: number;
    fallback?: boolean;
  } | null;
  if (!body?.action || !ACTIONS.has(body.action)) {
    return NextResponse.json({ message: "Unknown command" }, { status: 400 });
  }

  const vehicle = mockVehicles().find((item) => item.vin === vin) ?? { ...mockVehicles()[0], vin };
  const useMock = session.demo || body.fallback === true;

  if (useMock) {
    const state = (await readMockState()) ?? {};
    const current = state[vin] ?? mockTelemetry(vehicle);
    const telemetry = applyMockCommand(current, body.action, body.temperature, body.minutes);
    state[vin] = telemetry;
    await writeMockState(state);
    return NextResponse.json({
      ok: true,
      applied: "mock",
      telemetry,
      message: session.demo ? "Preview command applied" : "Vehicle did not confirm the command. Preview state updated locally.",
    });
  }

  try {
    const result = await sendCommand(session, vin, body.action, body.temperature, clampClimateMinutes(body.minutes ?? 10));
    const state = (await readMockState()) ?? {};
    const current = state[vin] ?? mockTelemetry(vehicle);
    const telemetry = applyMockCommand(current, body.action, body.temperature, body.minutes);
    state[vin] = telemetry;
    await writeMockState(state);
    return NextResponse.json({
      ok: true,
      applied: "live",
      result,
      telemetry,
      message: "Command sent to the vehicle",
    });
  } catch (error) {
    const message = error instanceof ProtonError ? error.message : "Command failed";
    return NextResponse.json({ message }, { status: error instanceof ProtonError ? error.status : 502 });
  }
}
