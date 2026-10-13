"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";

export function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"login" | "demo" | null>(null);

  function enter() {
    router.replace("/connecting");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending("login");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Login failed");
      enter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(null);
    }
  }

  async function preview() {
    setError(null);
    setPending("demo");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      if (!response.ok) throw new Error("Preview garage is unavailable");
      enter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <main data-connect-splash="1" className="flex min-h-screen items-start justify-center overflow-x-hidden bg-[#08080a] px-4 py-8 text-zinc-100 sm:items-center sm:px-6 sm:py-14">
      <div className="flex w-full max-w-[440px] flex-col items-center">
        <div className="mb-9 flex items-center gap-3">
          <img src="/da-mark.png" alt="" className="h-8 w-14 object-contain" />
          <span className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">Proton Re-Link</span>
        </div>

        <div className="w-full rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-10">
          <p className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase">Sign in</p>
          <h1 className="mt-2 mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Connect to Vehicle</h1>
          <p className="mb-8 text-sm leading-relaxed text-zinc-400">Use the same login as your Atlas app or Proton app.</p>

          <form onSubmit={submit} className="flex flex-col gap-5">
            <label className="block text-[11px] tracking-[0.18em] text-zinc-500 uppercase" htmlFor="username">
              Malaysia Phone Number
              <span className="relative mt-2 block normal-case tracking-normal">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[0.95rem] font-bold text-zinc-400">+6</span>
                <input
                  id="username"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="0173812323"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#08080a] pr-4 pl-[3.1rem] text-[0.95rem] outline-none transition focus:border-white/40"
                />
              </span>
              <span className="mt-2 block text-xs leading-relaxed font-normal tracking-normal text-zinc-500 normal-case">
                Malaysia only. Enter your mobile number starting with 01.
              </span>
            </label>

            <label className="block text-[11px] tracking-[0.18em] text-zinc-500 uppercase" htmlFor="password">
              Password
              <span className="relative mt-2 block normal-case tracking-normal">
                <Lock className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#08080a] pr-12 pl-11 text-[0.95rem] outline-none transition focus:border-white/40"
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow((value) => !value)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={pending != null}
              className="mt-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
            >
              <ArrowRight className="h-4 w-4" />
              {pending === "login" ? "Connecting…" : "Connect to Vehicle"}
            </button>
          </form>

          <button
            type="button"
            onClick={preview}
            disabled={pending != null}
            className="mx-auto mt-4 block rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-[11px] text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-60"
          >
            {pending === "demo" ? "Opening preview…" : "Preview the cockpit"}
          </button>

          <p className="mt-7 text-center text-xs leading-relaxed text-zinc-500">
            Use your credentials from the Proton Connected Services app.
            <br />
            Your password is sent only to sign in and is never stored.
          </p>
        </div>
        <a href="https://www.danielaniq.com" target="_blank" rel="noreferrer" className="mt-8 text-xs tracking-wide text-zinc-500 underline-offset-4 hover:text-white hover:underline">
          Reach out to developer
        </a>
      </div>
    </main>
  );
}
