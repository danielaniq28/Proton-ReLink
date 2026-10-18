"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Phone } from "lucide-react";

export function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"login" | "demo" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "no_vehicles") {
        setError("No vehicles found for your account. Please check your credentials or Proton app.");
      }
    }
  }, []);

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
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#08080a] px-4 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+1.5rem))] pb-[max(2.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] text-zinc-100 sm:px-6">
      <div className="flex w-full max-w-[480px] flex-col items-center">
        {/* Header Branding */}
        <div className="mb-8 flex items-center gap-3">
          <img src="/da-mark.png" alt="Proton Re-Link" className="h-8 w-14 object-contain" />
          <span className="text-xs font-medium tracking-[0.22em] text-zinc-400 uppercase">Proton Re-Link</span>
        </div>

        {/* Login Card */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:p-10 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Sign In</h1>
          <p className="mt-2 mb-8 text-sm text-zinc-400">
            Enter your Proton Connected Services credentials to access your dashboard.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-6">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-2" htmlFor="username">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  id="username"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="01XXXXXXXX (e.g. 0195007428)"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#0e0e12] pl-12 pr-4 text-base sm:text-lg text-white placeholder:text-zinc-600 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#0e0e12] pl-12 pr-12 text-base sm:text-lg text-white placeholder:text-zinc-600 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/10"
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow((value) => !value)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-2 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pending != null}
              className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-base font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-lg shadow-white/5"
            >
              <span>{pending === "login" ? "Signing In…" : "Sign In"}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {/* Hidden demo trigger kept in DOM and process logic intact */}
          <button
            type="button"
            onClick={preview}
            disabled={pending != null}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          >
            {pending === "demo" ? "Opening preview…" : "Explore simulated demo garage"}
          </button>
        </div>

        <a
          href="https://www.danielaniq.com"
          target="_blank"
          rel="noreferrer"
          className="mt-8 text-xs tracking-wide text-zinc-500 underline-offset-4 hover:text-white hover:underline"
        >
          Reach out to developer
        </a>
      </div>
    </main>
  );
}
