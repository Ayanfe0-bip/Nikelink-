export default function Home() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* Navigation */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-[#050816]">
              N
            </div>

            <span className="text-xl font-bold tracking-tight">
              Nikelink
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
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

          <button className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#050816] transition hover:bg-white/90">
            Join Nikelink
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.18),transparent_35%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:py-32">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              🌍 A global community is waiting for you
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Connect.
              <br />
              Share.
              <br />
              <span className="text-white/50">Belong.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
              Nikelink brings people, communities, ideas and opportunities
              together in one connected world.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <button className="rounded-full bg-white px-7 py-3.5 font-semibold text-[#050816] transition hover:bg-white/90">
                Get Started
              </button>

              <a
                href="#features"
                className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-center font-semibold text-white transition hover:bg-white/10"
              >
                Explore Nikelink
              </a>
            </div>
          </div>

          {/* Global Network Visual */}
          <div className="relative mx-auto flex h-[420px] w-full max-w-[520px] items-center justify-center">
            <div className="absolute h-[330px] w-[330px] rounded-full border border-white/10" />
            <div className="absolute h-[260px] w-[260px] rounded-full border border-white/10" />
            <div className="absolute h-[190px] w-[190px] rounded-full border border-white/10" />

            <div className="absolute h-32 w-32 rounded-full bg-white/10 shadow-[0_0_100px_rgba(59,130,246,0.35)] backdrop-blur-xl" />

            <div className="absolute left-[15%] top-[22%] h-3 w-3 rounded-full bg-white shadow-[0_0_20px_white]" />
            <div className="absolute right-[17%] top-[30%] h-3 w-3 rounded-full bg-white shadow-[0_0_20px_white]" />
            <div className="absolute bottom-[22%] left-[25%] h-3 w-3 rounded-full bg-white shadow-[0_0_20px_white]" />
            <div className="absolute bottom-[18%] right-[25%] h-3 w-3 rounded-full bg-white shadow-[0_0_20px_white]" />

            <div className="absolute left-[19%] top-[25%] h-px w-[62%] rotate-[20deg] bg-white/20" />
            <div className="absolute left-[23%] top-[50%] h-px w-[55%] -rotate-[15deg] bg-white/20" />
            <div className="absolute left-[32%] top-[31%] h-[45%] w-px rotate-[30deg] bg-white/20" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
              The Nikelink experience
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              More than a social platform.
            </h2>

            <p className="mt-5 text-lg leading-8 text-white/55">
              A place where people can discover communities, share ideas and
              build meaningful connections.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              number="01"
              title="Connect"
              description="Meet people who share your interests, goals and passions."
            />

            <FeatureCard
              number="02"
              title="Share"
              description="Share your ideas, experiences, creativity and knowledge."
            />

            <FeatureCard
              number="03"
              title="Belong"
              description="Find communities where you feel understood and connected."
            />
          </div>
        </div>
      </section>

      {/* Communities */}
      <section id="communities" className="border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
              Communities
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Find your people.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/55">
              From education and technology to creativity, business, culture
              and everyday interests, Nikelink is designed to bring
              communities together.
            </p>

            <button className="mt-8 rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold transition hover:bg-white/10">
              Discover communities
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              "Technology",
              "Education",
              "Business",
              "Creativity",
              "Music",
              "Lifestyle",
            ].map((community) => (
              <div
                key={community}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.08]"
              >
                <div className="mb-8 h-10 w-10 rounded-xl bg-white/10" />
                <p className="font-semibold">{community}</p>
                <p className="mt-1 text-sm text-white/40">
                  Join the conversation
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            One world. Many connections.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
            Nikelink is being built to make discovering people, ideas and
            communities feel natural, meaningful and global.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
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
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/[0.035] p-8 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/30">{number}</span>

        <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5" />
      </div>

      <h3 className="mt-16 text-2xl font-bold">{title}</h3>

      <p className="mt-3 leading-7 text-white/50">{description}</p>
    </div>
  );
              }
