"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Application error</p>
        <h1 className="mt-2 text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">Please retry the action. Sensitive error details are not shown in the browser.</p>
        <button onClick={reset} className="mt-5 inline-flex h-10 items-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">
          Try again
        </button>
      </div>
    </main>
  );
}
