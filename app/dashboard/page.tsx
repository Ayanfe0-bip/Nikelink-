"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const navItems = [
  { name: "Home", icon: "⌂", route: "/dashboard" },
  { name: "Discover", icon: "◎", route: "/discover" },
  { name: "Communities", icon: "◈", route: "/communities" },
  { name: "Messages", icon: "◌", route: "/messages" },
  { name: "Notifications", icon: "♢", route: "/notifications" },
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

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.replace("/login");
        return;
      }

      const user = userData.user;

      setEmail(user.email ?? "");

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "full_name, username, country, bio, interests, age_group"
          )
          .eq("id", user.id)
          .maybeSingle();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-blue-600/30" />
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
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "N";

  return (
    <main className="min-h-screen bg-[#050816] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 font-black shadow-lg shadow-blue-500/20">
              N
            </div>

            <span className="text-xl font-black">
              Nikelink
            </span>
          </button>

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
                onClick={() => router.push(item.route)}
                className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-xl">
                  {item.icon}
                </span>

                {item.name}
              </button>
            ))}

          </nav>

          {/* LOWER NAVIGATION */}
          <div className="mt-10 border-t border-white/10 pt-6">

            <button
              onClick={() => router.push("/profile")}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-xl">
                ◉
              </span>

              Profile
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="mt-2 flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-xl">
                ⚙
              </span>

              Settings
            </button>

          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 px-5 py-10 sm:px-8 lg:px-12">

          <div className="max-w-5xl">

            {/* PROFILE HERO */}
            <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent p-6 sm:p-8">

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-5">

                  {/* AVATAR */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 text-3xl font-black shadow-lg shadow-blue-500/20">
                    {initials}
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-blue-400">
                      Welcome back
                    </p>

                    <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                      {displayName}
                    </h1>

                    {profile?.username && (
                      <p className="mt-1 text-sm text-white/40">
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
                  onClick={() => router.push("/profile")}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
                >
                  Edit profile
                </button>

              </div>

              {profile?.bio && (
                <p className="mt-6 max-w-2xl leading-7 text-white/55">
                  {profile.bio}
                </p>
              )}

              {profile?.interests &&
                profile.interests.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">

                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300"
                      >
                        {interest}
                      </span>
                    ))}

                  </div>
                )}

            </div>

            {/* WELCOME */}
            <p className="text-sm font-semibold text-blue-400">
              Nikelink
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Your social world starts here.
            </h2>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/45">
              Discover people, share ideas and find communities that matter
              to you.
            </p>

            {/* QUICK ACTIONS */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <DashboardCard
                icon="◎"
                title="Discover people"
                description="Meet people with shared interests and goals."
                onClick={() => router.push("/discover")}
              />

              <DashboardCard
                icon="◈"
                title="Explore communities"
                description="Find communities built around what you care about."
                onClick={() => router.push("/communities")}
              />

              <DashboardCard
                icon="↗"
                title="Share something"
                description="Share your ideas, experiences and creativity."
                onClick={() => router.push("/feed")}
              />

            </div>

            {/* MAIN FEATURE LINKS */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              <FeatureCard
                icon="◎"
                title="Discover"
                description="Find people around the world and connect with people who share your interests."
                onClick={() => router.push("/discover")}
              />

              <FeatureCard
                icon="◈"
                title="Communities"
                description="Explore communities and connect around shared interests."
                onClick={() => router.push("/communities")}
              />

              <FeatureCard
                icon="◌"
                title="Messages"
                description="Continue your conversations and manage your connections."
                onClick={() => router.push("/messages")}
              />

              <FeatureCard
                icon="♢"
                title="Notifications"
                description="See connection requests and other Nikelink activity."
                onClick={() => router.push("/notifications")}
              />

            </div>

            {/* PROFILE + SETTINGS */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              <button
                onClick={() => router.push("/profile")}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl text-blue-300">
                  ◉
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  Your profile
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  View and update your Nikelink profile.
                </p>
              </button>

              <button
                onClick={() => router.push("/settings")}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-xl text-violet-300">
                  ⚙
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  Settings
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  Manage your account, security and Nikelink preferences.
                </p>
              </button>

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
                appear here as you use Nikelink.
              </p>

            </div>

          </div>
        </section>
      </div>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl md:hidden">

        <div className="grid h-20 grid-cols-5">

          <MobileNavButton
            icon="⌂"
            label="Home"
            onClick={() => router.push("/dashboard")}
          />

          <MobileNavButton
            icon="◎"
            label="Discover"
            onClick={() => router.push("/discover")}
          />

          <MobileNavButton
            icon="◈"
            label="Community"
            onClick={() => router.push("/communities")}
          />

          <MobileNavButton
            icon="◌"
            label="Messages"
            onClick={() => router.push("/messages")}
          />

          <MobileNavButton
            icon="●"
            label="Profile"
            onClick={() => router.push("/profile")}
          />

        </div>

      </nav>

    </main>
  );
}

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
      className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl text-blue-300">
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
      className="group flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-xl text-blue-300">
        {icon}
      </div>

      <div className="min-w-0">
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

function MobileNavButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 text-white/50 transition hover:bg-white/5 hover:text-white"
    >
      <span className="text-xl">
        {icon}
      </span>

      <span className="text-[10px] font-semibold">
        {label}
      </span>
    </button>
  );
}
