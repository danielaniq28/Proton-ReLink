import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    demo: session.demo,
    userId: session.demo ? "demo" : session.userId,
    selectedVin: session.selectedVin ?? null,
  });
}
