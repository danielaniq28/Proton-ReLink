import { NextResponse } from "next/server";
import { mockVehicles } from "@/lib/mock";
import { ProtonError, fetchVehicles } from "@/lib/proton";
import { clearSession, readSession, writeSession } from "@/lib/session";

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
    if (!vehicles || vehicles.length === 0) {
      await clearSession();
      return NextResponse.json(
        { message: "No vehicles returned for your account", vehicles: [], error: "no_vehicles" },
        { status: 404 }
      );
    }
    const selected =
      vehicles.find((vehicle) => vehicle.vin === session.selectedVin)?.vin ??
      vehicles.find((vehicle) => vehicle.isDefault)?.vin ??
      vehicles[0]?.vin;
    const backend = vehicles.find((vehicle) => vehicle.vin === selected)?.backend ?? vehicles[0]?.backend;
    if (selected && (selected !== session.selectedVin || backend !== session.backend)) {
      await writeSession({ ...session, selectedVin: selected, backend });
    }
    return NextResponse.json({ demo: false, vehicles, selectedVin: selected ?? null, warning: null });
  } catch (error) {
    await clearSession();
    const message = error instanceof ProtonError ? error.message : "Vehicle list unavailable";
    const status = error instanceof ProtonError && error.status === 401 ? 401 : 404;
    return NextResponse.json(
      {
        message,
        vehicles: [],
        error: "no_vehicles",
      },
      { status }
    );
  }
}
