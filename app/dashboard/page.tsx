"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const navItems = [
  {
    name: "Home",
    icon: "⌂",
    route: "/dashboard",
  },
  {
    name: "Discover",
    icon: "◎",
    route: "/discover",
  },
  {
    name: "Communities",
    icon: "◈",
    route: "/communities",
  },
  {
    name: "Messages",
    icon: "◌",
    route: "/messages",
  },
];

type Profile = {
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  interests: string[] | null;
  age_group: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !userData.user) {
        router.replace("/login");
        return;
      }

      const user = userData.user;

      setEmail(user.email ?? "");

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "full_name, username, country, bio, interests, age_group"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router]);

  function navigateTo(route: string) {
    if (navigating) return;

    if (pathname === route) {
      return;
    }

    setNavigating(route);
    router.push(route);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-pulse rounded-2xl bg-gradient-to-br from-blue-500/40 to-violet-500/40" />

          <p className="text-sm text-white/50">
            Loading Nikelink...
          </p>
        </div>
      </main>
    );
  }

  const displayName =
    profile?.full_name?.trim() || "Nikelink member";

  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((word) =>
        word.charAt(0).toUpperCase()
      )
      .join("") || "N";

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white md:pb-0">

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute right-[-120px] top-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-600/10 blur-[150px]" />

        <div className="absolute bottom-[-180px] left-1/3 h-96 w-96 rounded-full bg-cyan-500/5 blur-[130px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#050816]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">

          {/* LOGO */}
          <button
            onClick={() => navigateTo("/dashboard")}
            className="flex shrink-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 font-black shadow-lg shadow-blue-500/20">
              N
            </div>

            <span className="hidden text-xl font-black tracking-tight sm:block">
              Nikelink
            </span>
          </button>

          {/* TOP ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* CREATE POST */}
            <button
              onClick={() => navigateTo("/feed")}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2.5 text-sm font-bold shadow-lg shadow-blue-600/10 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-violet-500 active:scale-95 sm:px-4"
            >
              <span className="text-lg leading-none">
                +
              </span>

              <span className="hidden sm:inline">
                Create Post
              </span>

              <span className="sm:hidden">
                Post
              </span>
            </button>

            {/* NOTIFICATIONS */}
            <button
              onClick={() => navigateTo("/notifications")}
              aria-label="Notifications"
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                pathname === "/notifications"
                  ? "border-blue-400/40 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/[0.035] text-white/65 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              <span className="text-xl">
                ♢
              </span>

              {/* Notification indicator */}
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/60" />
            </button>

            {/* EMAIL */}
            <div className="hidden max-w-[220px] truncate text-sm text-white/35 lg:block">
              {email}
            </div>

            {/* SIGN OUT */}
            <button
              onClick={handleSignOut}
              className="hidden rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/5 hover:text-white sm:block"
            >
              Sign out
            </button>

          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-7xl">

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden min-h-[calc(100vh-72px)] w-64 shrink-0 border-r border-white/[0.07] py-8 pr-6 md:block">

          <nav className="space-y-2">

            {navItems.map((item) => {
              const active = pathname === item.route;

              return (
                <button
                  key={item.name}
                  onClick={() => navigateTo(item.route)}
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/10"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex w-6 justify-center text-xl">
                    {item.icon}
                  </span>

                  <span>
                    {item.name}
                  </span>

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}

          </nav>

          {/* SECONDARY NAV */}
          <div className="mt-10 border-t border-white/[0.07] pt-6">

            {/* PROFILE */}
            <button
              onClick={() => navigateTo("/profile")}
              className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition ${
                pathname === "/profile"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex w-6 justify-center text-xl">
                ◉
              </span>

              Profile
            </button>

            {/* SETTINGS */}
            <button
              onClick={() => navigateTo("/settings")}
              className={`mt-2 flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition ${
                pathname === "/settings"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex w-6 justify-center text-xl">
                ⚙
              </span>

              Settings
            </button>

          </div>

        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10 lg:px-12">

          <div className="mx-auto max-w-5xl">

            {/* PROFILE HERO */}
            <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent p-6 shadow-2xl shadow-black/10 sm:p-8">

              <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-blue-500/10 blur-[100px]" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-5">

                  {/* AVATAR */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-3xl font-black shadow-xl shadow-blue-500/20">
                    {initials}
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                      Welcome back
                    </p>

                    <h1 className="mt-2 truncate text-3xl font-black tracking-tight sm:text-4xl">
                      {displayName}
                    </h1>

                    {profile?.username && (
                      <p className="mt-1 truncate text-sm text-white/40">
                        @{profile.username}
                      </p>
                    )}

                    {profile?.country && (
                      <p className="mt-2 text-sm text-white/40">
                        🌍 {profile.country}
                      </p>
                    )}

                  </div>
                </div>

                <button
                  onClick={() => navigateTo("/profile")}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/65 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  Edit profile
                </button>

              </div>

              {profile?.bio && (
                <p className="relative mt-6 max-w-2xl text-sm leading-7 text-white/55">
                  {profile.bio}
                </p>
              )}

              {profile?.interests &&
                profile.interests.length > 0 && (
                  <div className="relative mt-5 flex flex-wrap gap-2">

                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300"
                      >
                        {interest}
                      </span>
                    ))}

                  </div>
                )}

            </section>

            {/* WELCOME */}
            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                Nikelink
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Your social world starts here.
              </h2>

              <p className="mt-4 max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
                Discover people, share ideas and find communities that matter
                to you.
              </p>

            </div>

            {/* QUICK ACTIONS */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <DashboardCard
                icon="◎"
                title="Discover people"
                description="Meet people with shared interests and goals."
                onClick={() => navigateTo("/discover")}
              />

              <DashboardCard
                icon="◈"
                title="Explore communities"
                description="Find communities built around what you care about."
                onClick={() => navigateTo("/communities")}
              />

              <DashboardCard
                icon="↗"
                title="Share something"
                description="Share your ideas, experiences and creativity."
                onClick={() => navigateTo("/feed")}
              />

            </div>

            {/* MAIN FEATURES */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              <FeatureCard
                icon="◎"
                title="Discover"
                description="Find people around the world and connect with people who share your interests."
                onClick={() => navigateTo("/discover")}
              />

              <FeatureCard
                icon="◈"
                title="Communities"
                description="Explore communities and connect around shared interests."
                onClick={() => navigateTo("/communities")}
              />

              <FeatureCard
                icon="◌"
                title="Messages"
                description="Continue your conversations and manage your connections."
                onClick={() => navigateTo("/messages")}
              />

              <FeatureCard
                icon="♢"
                title="Notifications"
                description="See connection requests and other Nikelink activity."
                onClick={() => navigateTo("/notifications")}
              />

            </div>

            {/* PROFILE + SETTINGS */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              <FeatureCard
                icon="◉"
                title="Your profile"
                description="View and update your Nikelink profile."
                onClick={() => navigateTo("/profile")}
              />

              <FeatureCard
                icon="⚙"
                title="Settings"
                description="Manage your account and Nikelink preferences."
                onClick={() => navigateTo("/settings")}
              />

            </div>

            {/* ACTIVITY */}
            <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-xl shadow-black/10 sm:p-7">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">
                Your space
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Your Nikelink activity
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                Your posts, connections, communities and conversations will
                appear here as you use Nikelink.
              </p>

            </section>

          </div>
        </section>
      </div>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/[0.08] bg-[#050816]/95 shadow-2xl shadow-black/30 backdrop-blur-2xl md:hidden">

        <div className="mx-auto grid h-[76px] max-w-xl grid-cols-4">

          {navItems.map((item) => {
            const active = pathname === item.route;

            return (
              <button
                key={item.name}
                onClick={() => navigateTo(item.route)}
                className={`relative flex flex-col items-center justify-center gap-1 transition ${
                  active
                    ? "text-blue-400"
                    : "text-white/45 hover:text-white"
                }`}
              >

                {/* ACTIVE INDICATOR */}
                {active && (
                  <span className="absolute top-0 h-0.5 w-10 rounded-full bg-gradient-to-r from-blue-400 to-violet-500" />
                )}

                <span
                  className={`text-xl ${
                    active ? "scale-110" : ""
                  } transition-transform`}
                >
                  {item.icon}
                </span>

                <span className="text-[10px] font-semibold">
                  {item.name === "Communities"
                    ? "Community"
                    : item.name}
                </span>

              </button>
            );
          })}

        </div>
      </nav>

      {/* NAVIGATION LOADING */}
      {navigating && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500" />
      )}

    </main>
  );
}

/* DASHBOARD CARD */

function DashboardCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06] active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl text-blue-300 transition group-hover:bg-blue-500/20">
        {icon}
      </div>

      <h3 className="mt-6 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-white/40">
        {description}
      </p>

      <div className="mt-5 text-xs font-bold text-blue-400">
        Open →
      </div>
    </button>
  );
}

/* FEATURE CARD */

function FeatureCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-4 rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06] active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-xl text-blue-300 transition group-hover:bg-blue-500/10">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <div className="flex items-center justify-between gap-3">

          <h3 className="font-bold">
            {title}
          </h3>

          <span className="text-white/25 transition group-hover:text-blue-400">
            →
          </span>

        </div>

        <p className="mt-2 text-sm leading-6 text-white/40">
          {description}
        </p>

      </div>
    </button>
  );
            }
