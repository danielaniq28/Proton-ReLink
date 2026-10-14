import { NextResponse } from "next/server";
import { mockVehicles, seedMockGarage } from "@/lib/mock";
import { normalizeMalaysiaPhone } from "@/lib/phone";
import { ProtonError, loginWithPassword } from "@/lib/proton";
import { writeMockState, writeSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: string; password?: string; demo?: boolean } | null;
  if (!body) return NextResponse.json({ message: "Invalid login request" }, { status: 400 });

  if (body.demo) {
    const vehicles = mockVehicles();
    await writeSession({
      accessToken: "demo",
      userId: "demo",
      demo: true,
      selectedVin: vehicles[0].vin,
    });
    await writeMockState(seedMockGarage(vehicles));
    return NextResponse.json({ ok: true, demo: true });
  }

  const phone = normalizeMalaysiaPhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json({ message: "Enter a Malaysia mobile number starting with 01." }, { status: 400 });
  }
  const password = body.password ?? "";
  if (password.length < 4) {
    return NextResponse.json({ message: "Enter the password from your Proton app." }, { status: 400 });
  }

  try {
    const login = await loginWithPassword(phone, password);
    await writeSession({
      accessToken: login.accessToken,
      userId: login.userId,
      refreshToken: login.refreshToken,
      expiresIn: login.expiresIn,
      demo: false,
    });
    return NextResponse.json({ ok: true, demo: false });
  } catch (error) {
    console.error("[Login Error]", error);
    const message = error instanceof ProtonError ? error.message : "Unable to reach Proton Connected Services";
    const status = error instanceof ProtonError ? error.status : 502;
    return NextResponse.json({ message }, { status: status === 401 ? 401 : 502 });
  }
}
