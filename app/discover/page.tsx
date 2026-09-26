"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  interests: string[] | null;
};

export default function DiscoverPage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function loadDiscover() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.replace("/login");
        return;
      }

      setUserId(userData.user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, username, country, bio, interests"
        )
        .neq("id", userData.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProfiles(data);
        setFilteredProfiles(data);
      }

      setLoading(false);
    }

    loadDiscover();
  }, [router]);

  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setFilteredProfiles(profiles);
      return;
    }

    const results = profiles.filter((profile) => {
      const name = profile.full_name?.toLowerCase() || "";
      const username = profile.username?.toLowerCase() || "";
      const country = profile.country?.toLowerCase() || "";
      const bio = profile.bio?.toLowerCase() || "";

      const interests =
        profile.interests
          ?.join(" ")
          .toLowerCase() || "";

      return (
        name.includes(query) ||
        username.includes(query) ||
        country.includes(query) ||
        bio.includes(query) ||
        interests.includes(query)
      );
    });

    setFilteredProfiles(results);
  }, [search, profiles]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black shadow-lg shadow-blue-500/20">
            N
          </div>

          <p className="text-sm text-white/40">
            Discovering people...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.push("/feed")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 font-black shadow-lg shadow-blue-500/20">
              N
            </div>

            <span className="hidden text-lg font-black sm:block">
              Nikelink
            </span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            Profile
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-3xl px-4 pb-28 pt-8">
        {/* TITLE */}
        <div className="mb-7">
          <p className="text-sm font-semibold text-blue-400">
            Explore Nikelink
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Discover people.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/40">
            Find people around the world who share your
            interests, passions and ideas.
          </p>
        </div>

        {/* SEARCH */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-2">
          <div className="flex items-center gap-3 px-3">
            <span className="text-xl text-white/30">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people, countries or interests..."
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/25"
            />
          </div>
        </div>

        {/* RESULTS */}
        {filteredProfiles.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
              🌍
            </div>

            <h2 className="text-xl font-bold">
              No people found
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
              Try another name, country or interest.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredProfiles.map((profile) => {
              const displayName =
                profile.full_name ||
                profile.username ||
                "Nikelink User";

              const firstLetter =
                displayName.charAt(0).toUpperCase();

              return (
                <article
                  key={profile.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl transition hover:border-blue-500/20 hover:bg-white/[0.05]"
                >
                  {/* USER */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-black shadow-lg shadow-blue-500/10">
                      {firstLetter}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-bold">
                        {displayName}
                      </h2>

                      {profile.username && (
                        <p className="truncate text-sm text-blue-400">
                          @{profile.username}
                        </p>
                      )}

                      {profile.country && (
                        <p className="mt-1 text-xs text-white/35">
                          🌍 {profile.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BIO */}
                  {profile.bio && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/50">
                      {profile.bio}
                    </p>
                  )}

                  {/* INTERESTS */}
                  {profile.interests &&
                    profile.interests.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.interests
                          .slice(0, 4)
                          .map((interest) => (
                            <span
                              key={interest}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/45"
                            >
                              {interest}
                            </span>
                          ))}
                      </div>
                    )}

                  {/* ACTIONS */}
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => {
                        router.push(
                          `/profile?user=${profile.id}`
                        );
                      }}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      View profile
                    </button>

                    <button
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-bold transition hover:opacity-90"
                    >
                      Connect
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-2">
          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center gap-1 px-4 text-white/40 transition hover:text-white"
          >
            <span className="text-xl">⌂</span>
            <span className="text-[10px] font-semibold">
              Home
            </span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="flex flex-col items-center gap-1 px-4 text-blue-400"
          >
            <span className="text-xl">⌕</span>
            <span className="text-[10px] font-semibold">
              Discover
            </span>
          </button>

          <button
            onClick={() => router.push("/feed")}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl shadow-lg shadow-blue-500/20"
          >
            +
          </button>

          <button
            onClick={() => router.push("/notifications")}
            className="flex flex-col items-center gap-1 px-4 text-white/40 transition hover:text-white"
          >
            <span className="text-xl">♡</span>
            <span className="text-[10px] font-semibold">
              Alerts
            </span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center gap-1 px-4 text-white/40 transition hover:text-white"
          >
            <span className="text-xl">◯</span>
            <span className="text-[10px] font-semibold">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
}
