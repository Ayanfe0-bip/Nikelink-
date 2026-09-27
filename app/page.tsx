"use client";

import Link from "next/link";

const avatars = [
  {
    name: "A",
    color: "from-pink-500 to-purple-600",
    top: "12%",
    left: "18%",
  },
  {
    name: "M",
    color: "from-blue-500 to-cyan-400",
    top: "22%",
    right: "12%",
  },
  {
    name: "J",
    color: "from-violet-500 to-fuchsia-500",
    bottom: "18%",
    left: "10%",
  },
  {
    name: "S",
    color: "from-cyan-400 to-blue-600",
    bottom: "10%",
    right: "18%",
  },
];

const features = [
  {
    icon: "🌍",
    title: "Connect globally",
    text: "Discover people and communities from different countries and cultures.",
  },
  {
    icon: "💬",
    title: "Share your world",
    text: "Create posts, conversations and moments that matter to you.",
  },
  {
    icon: "👥",
    title: "Find your people",
    text: "Build meaningful connections around interests, ideas and communities.",
  },
  {
    icon: "🔴",
    title: "Go live",
    text: "Experience social interaction through live communities and events.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-600/10 blur-[120px]" />
      </div>

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-white/10 bg-[#050816]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-blue-500 shadow-lg shadow-violet-500/30">
              <span className="text-lg font-black">N</span>
            </div>

            <div>
              <div className="text-xl font-black tracking-tight">Nikelink</div>
              <div className="hidden text-[10px] uppercase tracking-[0.25em] text-white/40 sm:block">
                Connect. Share. Belong.
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-white/60 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#communities"
              className="text-sm text-white/60 transition hover:text-white"
            >
              Communities
            </a>

            <a
              href="#about"
              className="text-sm text-white/60 transition hover:text-white"
            >
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Log in
            </Link>

            <Link
              href="/login"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#080b1d] shadow-lg shadow-white/10 transition hover:scale-[1.02] hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 lg:grid-cols-2 lg:px-8 lg:pb-32 lg:pt-24">
          {/* Hero text */}
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              A global community is waiting for you
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Connect with the world.
              <span className="mt-2 block bg-gradient-to-r from-pink-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                Belong.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/55 sm:text-lg">
              Nikelink is a global social platform built for meaningful
              connections, communities, conversations and shared experiences.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 px-7 py-4 text-sm font-bold shadow-xl shadow-violet-600/20 transition hover:-translate-y-0.5"
              >
                Get Started
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white/80 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                Log in
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/40">
              <span>✓ Global community</span>
              <span>✓ Discover people</span>
              <span>✓ Build connections</span>
            </div>
          </div>

          {/* Global network visual */}
          <div className="relative mx-auto h-[470px] w-full max-w-[560px]">
            {/* glow */}
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[90px]" />

            {/* outer ring */}
            <div className="absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/10" />

            {/* second ring */}
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/15" />

            {/* inner ring */}
            <div className="absolute left-1/2 top-1/2 h-[205px] w-[205px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-400/10" />

            {/* center */}
            <div className="absolute left-1/2 top-1/2 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500/20 via-[#10142c] to-blue-500/20 shadow-2xl shadow-violet-500/20">
              <div className="absolute inset-4 rounded-full border border-white/5" />

              <div className="relative text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-blue-500 text-xl font-black shadow-lg shadow-violet-500/30">
                  N
                </div>

                <div className="text-sm font-bold">Nikelink</div>
                <div className="mt-1 text-[10px] text-white/40">
                  Global connection
                </div>
              </div>
            </div>

            {/* connection lines */}
            <div className="absolute left-1/2 top-1/2 h-[2px] w-72 -translate-x-1/2 rotate-[22deg] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

            <div className="absolute left-1/2 top-1/2 h-[2px] w-72 -translate-x-1/2 -rotate-[30deg] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

            <div className="absolute left-1/2 top-1/2 h-[2px] w-64 -translate-x-1/2 rotate-[80deg] bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />

            {/* glowing nodes */}
            <span className="absolute left-[17%] top-[34%] h-3 w-3 rounded-full bg-pink-400 shadow-[0_0_25px_8px_rgba(236,72,153,0.35)]" />
            <span className="absolute right-[15%] top-[25%] h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_25px_8px_rgba(59,130,246,0.35)]" />
            <span className="absolute bottom-[20%] left-[23%] h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_25px_8px_rgba(139,92,246,0.35)]" />
            <span className="absolute bottom-[14%] right-[22%] h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_25px_8px_rgba(34,211,238,0.35)]" />

            {/* avatars */}
            {avatars.map((avatar, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  top: avatar.top,
                  left: avatar.left,
                  right: avatar.right,
                  bottom: avatar.bottom,
                }}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${avatar.color} text-sm font-black shadow-xl ring-4 ring-[#050816]`}
                >
                  {avatar.name}
                </div>
              </div>
            ))}

            {/* floating labels */}
            <div className="absolute left-0 top-[7%] rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
              <div className="text-[10px] uppercase tracking-widest text-white/35">
                Community
              </div>
              <div className="mt-1 text-sm font-bold">Worldwide</div>
            </div>

            <div className="absolute bottom-[4%] right-0 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
              <div className="text-[10px] uppercase tracking-widest text-white/35">
                People
              </div>
              <div className="mt-1 text-sm font-bold">Connected</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4 lg:px-8">
          {[
            ["Global", "Community"],
            ["24/7", "Connection"],
            ["∞", "Possibilities"],
            ["1", "World"],
          ].map(([number, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-black sm:text-3xl">{number}</div>
              <div className="mt-1 text-xs text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
              Everything connected
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              More than a social network.
            </h2>

            <p className="mt-5 leading-7 text-white/50">
              Nikelink brings people, communities and experiences together in
              one global social space.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-violet-400/20 hover:bg-white/[0.055]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-xl">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-lg font-bold">{feature.title}</h3>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITIES */}
      <section
        id="communities"
        className="relative z-10 scroll-mt-20 border-y border-white/10 bg-white/[0.015]"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-pink-400">
              Communities
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Find a place where you belong.
            </h2>

            <p className="mt-6 max-w-xl leading-8 text-white/50">
              Whether you're interested in education, technology, creativity,
              business, entertainment, sports or simply meeting new people,
              Nikelink is designed to help you find your community.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3.5 text-sm font-bold transition hover:bg-white/[0.1]"
            >
              Explore Nikelink →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              ["Technology", "💻"],
              ["Education", "📚"],
              ["Creativity", "🎨"],
              ["Business", "🚀"],
              ["Music", "🎵"],
              ["Sports", "⚽"],
            ].map(([name, emoji]) => (
              <div
                key={name}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 transition hover:border-violet-400/20"
              >
                <div className="text-2xl">{emoji}</div>
                <div className="mt-4 text-sm font-bold">{name}</div>
                <div className="mt-1 text-xs text-white/35">
                  Join the conversation
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative z-10 scroll-mt-20">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center lg:px-8">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            About Nikelink
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
            One platform. A world of people.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/50">
            Nikelink is being built as a global space where people can
            discover others, share their stories, build communities and create
            meaningful connections across borders.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600/20 via-white/[0.04] to-blue-600/20 p-8 text-center shadow-2xl shadow-violet-900/20 sm:p-14">
          <div className="mx-auto max-w-2xl">
            <div className="text-3xl font-black tracking-tight sm:text-5xl">
              Your world is waiting.
            </div>

            <p className="mt-5 leading-7 text-white/50">
              Start connecting, sharing and belonging on Nikelink.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex rounded-2xl bg-white px-7 py-4 text-sm font-black text-[#070918] shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-blue-500 text-xs font-black">
              N
            </div>
            <span className="font-bold">Nikelink</span>
          </Link>

          <div className="flex flex-wrap gap-5 text-xs text-white/35">
            <Link href="/login" className="transition hover:text-white">
              Log in
            </Link>

            <Link href="/settings/terms" className="transition hover:text-white">
              Terms
            </Link>

            <Link href="/settings/terms" className="transition hover:text-white">
              Privacy
            </Link>

            <Link href="/settings/help" className="transition hover:text-white">
              Help
            </Link>
          </div>

          <div className="text-xs text-white/25">
            © {new Date().getFullYear()} Nikelink
          </div>
        </div>
      </footer>
    </main>
  );
                }
