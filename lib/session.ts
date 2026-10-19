import { cookies } from "next/headers";
import type { Session, Telemetry } from "./types";

export const SESSION_COOKIE = "pl_session";
export const MOCK_COOKIE = "pl_mock";

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decode<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const session = decode<Session>(jar.get(SESSION_COOKIE)?.value);
  if (!session?.accessToken || !session.userId) return null;
  return session;
}

export async function writeSession(session: Session) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encode(session), base);
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...base, maxAge: 0, expires: new Date(0) });
  jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0, expires: new Date(0) });
  jar.set(MOCK_COOKIE, "", { ...base, maxAge: 0, expires: new Date(0) });
  jar.set(MOCK_COOKIE, "", { path: "/", maxAge: 0, expires: new Date(0) });
  jar.delete(SESSION_COOKIE);
  jar.delete(MOCK_COOKIE);
}

export async function readMockState(): Promise<Record<string, Telemetry> | null> {
  const jar = await cookies();
  return decode<Record<string, Telemetry>>(jar.get(MOCK_COOKIE)?.value);
}

export async function writeMockState(state: Record<string, Telemetry>) {
  const jar = await cookies();
  jar.set(MOCK_COOKIE, encode(state), base);
}
