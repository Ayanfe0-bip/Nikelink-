"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const navItems = [
  { name: "Home", icon: "⌂" },
  { name: "Discover", icon: "◎" },
  { name: "Communities", icon: "◈" },
  { name: "Messages", icon: "◌" },
  { name: "Notifications", icon: "♢" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("Home");

  useEffect(() => {
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");
      setLoading(false);
    }

    checkUser();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <p className="text-white/50">Loading Nikelink...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black">
              N
            </div>

            <span className="text-xl font-black">Nikelink</span>
          </div>

          <div className="hidden text-sm text-white/40 sm:block">
            {email}
          </div>

          <button
            onClick={handleSignOut}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* SIDEBAR */}
        <aside className="hidden min-h-[calc(100vh-73px)] w-64 border-r border-white/10 py-8 pr-6 md:block">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActive(item.name)}
                className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  active === item.name
                    ? "bg-blue-600 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>

          <div className="mt-10 border-t border-white/10 pt-6">
            <button className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/50 hover:bg-white/5 hover:text-white">
              <span className="text-xl">◉</span>
              Profile
            </button>

            <button className="mt-2 flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/50 hover:bg-white/5 hover:text-white">
              <span className="text-xl">⚙</span>
              Settings
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 px-5 py-10 sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold text-blue-400">
              {active}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              {active === "Home"
                ? "Welcome to Nikelink."
                : active}
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/45">
              {active === "Home"
                ? "Your social world is ready. Discover people, share ideas and find communities that matter to you."
                : `This is your ${active.toLowerCase()} space. We're building it into the Nikelink experience.`}
            </p>

            {/* QUICK ACTIONS */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardCard
                icon="◎"
                title="Discover people"
                description="Meet people with shared interests and goals."
              />

              <DashboardCard
                icon="◈"
                title="Explore communities"
                description="Find communities built around what you care about."
              />

              <DashboardCard
                icon="↗"
                title="Share something"
                description="Share your ideas, experiences and creativity."
              />
            </div>

            {/* ACTIVITY */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">
                Your space
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Your Nikelink activity
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Your posts, connections, communities and conversations will
                appear here as we build the platform.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl text-blue-300">
        {icon}
      </div>

      <h3 className="mt-6 text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/40">
        {description}
      </p>
    </button>
  );
         }
