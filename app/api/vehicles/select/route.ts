import { NextResponse } from "next/server";
import { readSession, writeSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { vin?: string } | null;
  if (!body?.vin) return NextResponse.json({ message: "Choose a vehicle" }, { status: 400 });
  await writeSession({ ...session, selectedVin: body.vin });
  return NextResponse.json({ ok: true, selectedVin: body.vin });
}
