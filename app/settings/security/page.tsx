"use client";

import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-10">

        <header className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#050816]/95 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">

            <button
              onClick={() => router.push("/settings")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-white/70"
            >
              ←
            </button>

            <div>
              <h1 className="text-lg font-bold">
                Security
              </h1>

              <p className="text-xs text-white/40">
                Manage your account security
              </p>
            </div>

          </div>
        </header>

        <section className="pt-6">

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
              🔐
            </div>

            <h2 className="text-xl font-bold">
              Account security
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/45">
              Manage your Nikelink account security settings.
            </p>

          </div>

          <button
            onClick={() =>
              router.push("/settings/login-security")
            }
            className="mt-5 flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-left transition hover:bg-white/[0.06]"
          >
            <div>
              <p className="font-semibold">
                Login & security
              </p>

              <p className="mt-1 text-sm text-white/40">
                Manage your password and login security
              </p>
            </div>

            <span className="text-white/30">
              →
            </span>
          </button>

          <button
            onClick={() => router.push("/settings")}
            className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60"
          >
            Back to Settings
          </button>

        </section>

      </div>
    </main>
  );
}
