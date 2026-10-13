import { NextResponse } from "next/server";
import { mockTelemetry, mockVehicles } from "@/lib/mock";
import { telemetryFromPayloads } from "@/lib/normalize";
import { ProtonError, fetchStatusPayloads } from "@/lib/proton";
import { readMockState, readSession, writeMockState } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ vin: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await readSession();
  if (!session) return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  const { vin } = await params;
  const vehicle = mockVehicles().find((item) => item.vin === vin) ?? {
    ...mockVehicles()[0],
    vin,
    carType: "X70",
  };

  if (session.demo) {
    const state = (await readMockState()) ?? {};
    const telemetry = state[vin] ?? mockTelemetry(vehicle);
    return NextResponse.json({ telemetry, fallback: false, warning: null });
  }

  try {
    const payloads = await fetchStatusPayloads(session, vin);
    const state = (await readMockState()) ?? {};
    const baseline = state[vin] ?? mockTelemetry(vehicle);
    const carType = new URL(_request.url).searchParams.get("carType") || vehicle.carType;
    const telemetry = telemetryFromPayloads(vin, payloads.legacy, payloads.atlas, baseline, carType);
    state[vin] = telemetry;
    await writeMockState(state);
    return NextResponse.json({ telemetry, fallback: false, warning: null });
  } catch (error) {
    const message = error instanceof ProtonError ? error.message : "Live telemetry unavailable";
    const state = (await readMockState()) ?? {};
    if (state[vin]) {
      return NextResponse.json({
        telemetry: state[vin],
        fallback: false,
        warning: `${message}. Showing the last status retrieved.`,
      });
    }
    const telemetry = mockTelemetry(vehicle);
    state[vin] = telemetry;
    await writeMockState(state);
    return NextResponse.json({
      telemetry,
      fallback: true,
      warning: `${message}. Simulated readings are shown until the vehicle responds.`,
    });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const session = await readSession();
  if (!session?.demo) return NextResponse.json({ message: "Mock state is only stored for preview sessions" }, { status: 400 });
  const { vin } = await params;
  const body = (await request.json().catch(() => null)) as { telemetry?: Record<string, unknown> } | null;
  if (!body?.telemetry) return NextResponse.json({ message: "Missing telemetry" }, { status: 400 });
  const state = (await readMockState()) ?? {};
  state[vin] = body.telemetry as never;
  await writeMockState(state);
  return NextResponse.json({ ok: true });
}
