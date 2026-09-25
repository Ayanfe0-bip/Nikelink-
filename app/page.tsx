const communities = [
  {
    name: "Technology",
    members: "24.8K members",
    icon: "⌘",
  },
  {
    name: "Education",
    members: "18.2K members",
    icon: "✦",
  },
  {
    name: "Business",
    members: "31.6K members",
    icon: "↗",
  },
  {
    name: "Creativity",
    members: "12.4K members",
    icon: "✎",
  },
  {
    name: "Music",
    members: "28.7K members",
    icon: "♪",
  },
  {
    name: "Lifestyle",
    members: "16.9K members",
    icon: "♡",
  },
];

const avatars = [
  { initials: "AO", position: "left-[7%] top-[28%]" },
  { initials: "MK", position: "right-[9%] top-[20%]" },
  { initials: "TS", position: "left-[17%] bottom-[22%]" },
  { initials: "JA", position: "right-[15%] bottom-[18%]" },
  { initials: "NK", position: "left-[35%] top-[9%]" },
  { initials: "DM", position: "right-[35%] bottom-[7%]" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-[#050816] shadow-lg shadow-white/10">
              N
            </div>

            <span className="text-xl font-bold tracking-tight">
              Nikelink
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#communities" className="transition hover:text-white">
              Communities
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
          </nav>

          <button className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#050816] transition hover:scale-105 hover:bg-white/90">
            Join Nikelink
          </button>
        </div>
      </header>

      {/* HERO */}
<section className="relative overflow-hidden">
  <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[140px]" />

  <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
    <div className="relative z-10">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
        A global community is waiting for you
      </div>

      <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
        Connect.
        <br />
        Share.
        <br />
        <span className="bg-gradient-to-r from-white via-white/80 to-white/35 bg-clip-text text-transparent">
          Belong.
        </span>
      </h1>

      <p className="mt-7 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
        Nikelink brings people, communities, ideas and opportunities together
        in one connected world.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button className="rounded-full bg-white px-7 py-3.5 font-bold text-[#050816] transition hover:-translate-y-0.5 hover:bg-white/90">
          Get Started
        </button>

        <a
          href="#communities"
          className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-center font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Explore communities
        </a>
      </div>
    </div>

    <div className="relative mx-auto h-[430px] w-full max-w-[600px]">
      <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/10" />

      <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

      <div className="absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />

      <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-blue-400/25 via-blue-500/10 to-transparent shadow-[0_0_100px_rgba(59,130,246,0.35)] backdrop-blur-xl">
        <img
  src="/images/nikelink-hero.svg"
  alt="Nikelink global community network"
  className="h-full w-full object-cover"
 />
      </div>
      
      <div className="absolute left-[25%] top-[17%] h-3 w-3 rounded-full bg-blue-300 shadow-[0_0_25px_#60a5fa]" />

      <div className="absolute right-[23%] top-[42%] h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_25px_#67e8f9]" />

      <div className="absolute bottom-[27%] left-[34%] h-3 w-3 rounded-full bg-white shadow-[0_0_25px_white]" />

      <div className="absolute bottom-[31%] right-[31%] h-3 w-3 rounded-full bg-blue-300 shadow-[0_0_25px_#60a5fa]" />

      <div className="absolute left-[4%] top-[49%] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[10px] text-white/60 shadow-xl backdrop-blur-xl">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Community online
      </div>

      <div className="absolute bottom-[39%] right-[3%] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[10px] text-white/60 shadow-xl backdrop-blur-xl">
        + Connect
      </div>
    </div>
  </div>
</section>

      {/* TRUST / STATS */}
      <section className="border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
          <Stat value="Global" label="Community" />
          <Stat value="24/7" label="Connection" />
          <Stat value="∞" label="Possibilities" />
          <Stat value="1" label="Connected World" />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
              The Nikelink experience
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Built around people.
            </h2>

            <p className="mt-5 text-lg leading-8 text-white/50">
              A new way to discover people, ideas, communities and
              opportunities.
            </p>
          </div>

         <div className="mt-14 grid gap-5 md:grid-cols-3">
            <FeatureCard
              number="01"
              title="Connect"
              icon="◎"
              description="Meet people who share your interests, goals and passions."
            />

            <FeatureCard
              number="02"
              title="Share"
              icon="↗"
              description="Share your ideas, experiences, creativity and knowledge."
            />

            <FeatureCard
              number="03"
              title="Belong"
              icon="♡"
              description="Find communities where you feel understood and connected."
            />
          </div>
        </div>
      </section>

      {/* COMMUNITIES */}
      <section id="communities" className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
                Discover
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Find your people.
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-white/50">
                Explore communities built around the things you care about.
              </p>
            </div>

            <button className="w-fit rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10">
              View all
            </button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => (
              <div
                key={community.name}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] text-xl">
                    {community.icon}
                  </div>

                  <span className="text-xs text-white/25">EXPLORE</span>
                </div>

                <h3 className="mt-8 text-xl font-bold">
                  {community.name}
                </h3>

                <p className="mt-2 text-sm text-white/40">
                  {community.members}
                </p>

                <div className="mt-6 flex -space-x-2">
                  {["AO", "MK", "TS", "JA"].map((initials) => (
                    <div
                      key={initials}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#101322] bg-white/10 text-[9px] font-bold"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PREVIEW */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
              Your social world
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Share what matters.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/50">
              Your ideas, moments, conversations and communities — all in one
              connected experience.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                AO
              </div>

              <div>
                <p className="text-sm font-bold">Ayo Oladipo</p>
                <p className="text-xs text-white/35">2h · Technology</p>
              </div>

              <span className="ml-auto text-white/30">•••</span>
            </div>

            <p className="mt-5 leading-7 text-white/75">
              Building something new and connecting with amazing people along
              the way. 🌍
            </p>

            <div className="mt-5 h-44 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-white/[0.03] to-cyan-400/10" />

            <div className="mt-5 flex items-center gap-6 text-sm text-white/40">
              <span>♡ 248</span>
              <span>◯ 36 comments</span>
              <span>↗ Share</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / CTA */}
      <section id="about">
        <div className="mx-auto max-w-5xl px-5 py-28 text-center sm:px-6">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white p-1 shadow-[0_0_60px_rgba(255,255,255,0.12)]">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#050816] text-2xl font-black">
              N
            </div>
          </div>

          <h2 className="mt-8 text-4xl font-black tracking-tight sm:text-6xl">
            One world.
            <br />
            Many connections.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/50">
            Nikelink is being built to make discovering people, ideas and
            communities feel natural, meaningful and global.
          </p>

          <button className="mt-9 rounded-full bg-white px-8 py-4 font-bold text-[#050816] transition hover:-translate-y-0.5 hover:bg-white/90">
            Join the Nikelink community
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 Ayanfe Innovation Labs Limited.</p>
          <p>Nikelink — Connect. Share. Belong.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  number,
  title,
  icon,
  description,
}: {
  number: string;
  title: string;
  icon: string;
  description: string;
}) {
  return (
    <div className="group rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest text-white/25">
          {number}
        </span>

        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg text-white/70">
          {icon}
        </div>
      </div>

      <h3 className="mt-16 text-2xl font-bold">{title}</h3>

<p className="mt-3 leading-7 text-white/45">{description}</p>
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="px-4 py-7 text-center sm:py-9">
      <p className="text-2xl font-black sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-white/30">
        {label}
      </p>
    </div>
  );
}
