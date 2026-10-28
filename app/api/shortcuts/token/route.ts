import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { createShortcutToken } from "@/lib/shortcuts";
import { mockVehicles } from "@/lib/mock";
import { fetchVehicles } from "@/lib/proton";
import type { Vehicle } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  }

  let vehicle: Vehicle | undefined;
  if (session.demo) {
    const list = mockVehicles();
    vehicle = list.find((v) => v.vin === session.selectedVin) || list[0];
  } else {
    try {
      const list = await fetchVehicles(session);
      vehicle = list.find((v) => v.vin === session.selectedVin) || list[0];
    } catch {
      vehicle = undefined;
    }
  }

  const token = createShortcutToken(session, vehicle);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  return NextResponse.json({
    ok: true,
    token,
    vin: vehicle?.vin || session.selectedVin || "",
    carType: vehicle?.carType || "Proton",
    plate: vehicle?.plate || "",
    origin,
    sampleEndpoints: {
      engine_start: `${origin}/api/shortcuts?action=engine_start&token=${encodeURIComponent(token)}`,
      lock: `${origin}/api/shortcuts?action=lock&token=${encodeURIComponent(token)}`,
      unlock: `${origin}/api/shortcuts?action=unlock&token=${encodeURIComponent(token)}`,
      status: `${origin}/api/shortcuts?action=status&token=${encodeURIComponent(token)}`,
    },
  });
}
