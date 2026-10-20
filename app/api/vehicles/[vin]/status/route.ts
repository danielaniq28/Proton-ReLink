import { NextResponse } from "next/server";
import { mockTelemetry, mockVehicles } from "@/lib/mock";
import { telemetryFromPayloads } from "@/lib/normalize";
import { ProtonError, fetchStatusPayloads } from "@/lib/proton";
import { readMockState, readSession, writeMockState } from "@/lib/session";
import type { TelemetryBackend } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ vin: string }> };

export async function GET(request: Request, { params }: Params) {
  const session = await readSession();
  if (!session) return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  const { vin } = await params;
  const url = new URL(request.url);
  const requestedBackend = url.searchParams.get("backend") as TelemetryBackend | null;
  const vehicle = mockVehicles().find((item) => item.vin === vin) ?? {
    ...mockVehicles()[0],
    vin,
    carType: "X70",
    backend: requestedBackend || "atlas",
  };
  const backend: TelemetryBackend = requestedBackend || vehicle.backend || session.backend || "atlas";
  const carType = url.searchParams.get("carType") || vehicle.carType;

  if (session.demo) {
    const state = (await readMockState()) ?? {};
    const base = state[vin] ?? mockTelemetry(vehicle);
    const telemetry = { ...base, backend };
    return NextResponse.json({ telemetry, fallback: false, warning: null });
  }

  try {
    const payloads = await fetchStatusPayloads(session, vin, backend);
    const state = (await readMockState()) ?? {};
    const baseline = state[vin] ?? mockTelemetry(vehicle);
    const telemetry = telemetryFromPayloads(vin, payloads.legacy, payloads.atlas, baseline, carType, backend, payloads.flow);
    state[vin] = telemetry;
    await writeMockState(state);
    return NextResponse.json({ telemetry, fallback: false, warning: null });
  } catch (error) {
    const message = error instanceof ProtonError ? error.message : "Live telemetry unavailable";
    const state = (await readMockState()) ?? {};
    if (state[vin]) {
      return NextResponse.json({
        telemetry: { ...state[vin], backend },
        fallback: false,
        warning: `${message}. Showing the last status retrieved.`,
      });
    }
    const status = error instanceof ProtonError && error.status === 401 ? 401 : 502;
    return NextResponse.json({ message, telemetry: null, fallback: false }, { status });
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
