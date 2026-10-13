import { NextResponse } from "next/server";
import { mockVehicles } from "@/lib/mock";
import { ProtonError, fetchVehicles } from "@/lib/proton";
import { readSession, writeSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ message: "Sign in required" }, { status: 401 });

  if (session.demo) {
    const vehicles = mockVehicles();
    return NextResponse.json({
      demo: true,
      vehicles,
      selectedVin: session.selectedVin ?? vehicles[0].vin,
      warning: null,
    });
  }

  try {
    const vehicles = await fetchVehicles(session);
    const selected =
      vehicles.find((vehicle) => vehicle.vin === session.selectedVin)?.vin ??
      vehicles.find((vehicle) => vehicle.isDefault)?.vin ??
      vehicles[0]?.vin;
    if (selected && selected !== session.selectedVin) {
      await writeSession({ ...session, selectedVin: selected });
    }
    return NextResponse.json({ demo: false, vehicles, selectedVin: selected ?? null, warning: null });
  } catch (error) {
    const vehicles = mockVehicles();
    const message = error instanceof ProtonError ? error.message : "Vehicle list unavailable";
    return NextResponse.json({
      demo: false,
      fallback: true,
      vehicles,
      selectedVin: vehicles[0].vin,
      warning: `${message}. Showing a simulated garage so the cockpit stays usable.`,
    });
  }
}
