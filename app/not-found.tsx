import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#08080a] px-6 text-zinc-100">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-sm text-zinc-400">Page not found</p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
