"use client";

import { useRouter } from "next/navigation";

export default function AboutNikelinkPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto min-h-screen max-w-2xl px-5 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-bold">About Nikelink</h1>
            <p className="mt-1 text-sm text-white/50">
              Learn more about Nikelink
            </p>
          </div>
        </div>

        {/* Brand Card */}
        <section className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
          <div className="relative overflow-hidden px-6 py-10 text-center">
            <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-500 via-violet-500 to-fuchsia-500 text-3xl font-black shadow-2xl shadow-violet-500/20">
              N
            </div>

            <h2 className="relative text-3xl font-bold tracking-tight">
              Nikelink
            </h2>

            <p className="relative mt-2 text-sm font-medium text-white/50">
              Connect. Share. Belong.
            </p>

            <div className="relative mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50">
              A global community platform
            </div>
          </div>
        </section>

        {/* About */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-semibold">About Nikelink</h2>

          <p className="text-sm leading-7 text-white/60">
            Nikelink is a global social and community platform designed to
            help people connect, share ideas, discover communities, build
            relationships, and belong.
          </p>

          <p className="mt-4 text-sm leading-7 text-white/60">
            Our goal is to create a welcoming digital space where people from
            different places and backgrounds can connect through meaningful
            conversations, communities, content, and experiences.
          </p>
        </section>

        {/* What you can do */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">
          <h2 className="mb-5 text-lg font-semibold">What you can do</h2>

          <div className="space-y-4">
            <div className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">
                🌍
              </div>
              <div>
                <h3 className="font-medium">Connect globally</h3>
                <p className="mt-1 text-sm leading-5 text-white/40">
                  Discover and connect with people from around the world.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-xl">
                👥
              </div>
              <div>
                <h3 className="font-medium">Build communities</h3>
                <p className="mt-1 text-sm leading-5 text-white/40">
                  Find communities and people who share your interests.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-xl">
                💬
              </div>
              <div>
                <h3 className="font-medium">Share and communicate</h3>
                <p className="mt-1 text-sm leading-5 text-white/40">
                  Share posts, ideas, conversations, and experiences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-5 rounded-3xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.08] to-blue-500/[0.04] p-6">
          <h2 className="mb-3 text-lg font-semibold">Our vision</h2>

          <p className="text-sm leading-7 text-white/60">
            Nikelink is being built around a simple idea:
          </p>

          <p className="mt-3 text-xl font-semibold leading-8 text-white">
            Everyone should have a place where they can connect, share, and
            belong.
          </p>
        </section>

        {/* Developer */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-3 text-lg font-semibold">Built by</h2>

          <p className="text-sm text-white/60">
            Nikelink is developed under
          </p>

          <p className="mt-2 font-semibold text-white">
            Ayanfe Innovation Labs Limited
          </p>

          <p className="mt-2 text-sm leading-6 text-white/40">
            Building digital products and platforms designed to connect people
            and create opportunities.
          </p>
        </section>

        {/* Version */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Nikelink
          </p>

          <p className="mt-2 text-sm text-white/40">
            Version 1.0
          </p>

          <p className="mt-1 text-xs text-white/25">
            Connect. Share. Belong.
          </p>
        </section>

        {/* Back */}
        <button
          onClick={() => router.push("/settings")}
          className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
        >
          ← Back to Settings
        </button>
      </div>
    </main>
  );
        }
