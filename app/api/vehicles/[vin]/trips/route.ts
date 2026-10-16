import { NextResponse } from "next/server";
import { fetchTripRecords } from "@/lib/proton";
import { readSession } from "@/lib/session";
import { mockTripRecords } from "@/lib/mock";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ vin: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await readSession();
  if (!session) return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  const { vin } = await params;

  if (session.demo) {
    const trips = mockTripRecords(vin);
    return NextResponse.json({ trips, source: "demo" });
  }

  try {
    const trips = await fetchTripRecords(session, vin);
    return NextResponse.json({ trips, source: "live" });
  } catch {
    const trips = mockTripRecords(vin);
    return NextResponse.json({ trips, source: "fallback" });
  }
}
