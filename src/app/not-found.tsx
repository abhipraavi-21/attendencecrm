import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The page may have moved or you may not have access to it.</p>
        <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
