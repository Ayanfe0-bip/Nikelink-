"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  interests: string[] | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
};

type FilterType = "all" | "people" | "countries" | "interests";

export default function DiscoverPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDiscover();
  }, []);

  async function loadDiscover() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .order("created_at", { ascending: false });

    if (profileError) {
      console.error("Profiles error:", profileError);
      setErrorMessage("We couldn't load people right now.");
    } else {
      setProfiles(profileData || []);
    }

    const { data: connectionData, error: connectionError } =
      await supabase
        .from("connections")
        .select("*")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (connectionError) {
      console.error("Connections error:", connectionError);
    } else {
      setConnections(connectionData || []);
    }

    setLoading(false);
  }

  function getConnection(profileId: string) {
    return connections.find(
      (connection) =>
        (connection.requester_id === userId &&
          connection.receiver_id === profileId) ||
        (connection.receiver_id === userId &&
          connection.requester_id === profileId)
    );
  }

  function getButtonText(profileId: string) {
    const connection = getConnection(profileId);

    if (!connection) return "Connect";

    if (connection.status === "accepted") {
      return "Connected";
    }

    if (
      connection.status === "pending" &&
      connection.requester_id === userId
    ) {
      return "Request Sent";
    }

    if (
      connection.status === "pending" &&
      connection.receiver_id === userId
    ) {
      return "Respond";
    }

    return "Connect";
  }

  async function handleConnect(profileId: string) {
    if (!userId || connectingId) return;

    const existing = getConnection(profileId);

    if (existing) {
      if (existing.status === "accepted") return;

      if (
        existing.status === "pending" &&
        existing.requester_id === userId
      ) {
        return;
      }

      if (
        existing.status === "pending" &&
        existing.receiver_id === userId
      ) {
        router.push("/notifications");
        return;
      }

      if (existing.status === "declined") {
        const { error: deleteError } = await supabase
          .from("connections")
          .delete()
          .eq("id", existing.id);

        if (deleteError) {
          console.error("Delete declined connection error:", deleteError);
          alert(deleteError.message);
          return;
        }

        setConnections((current) =>
          current.filter((connection) => connection.id !== existing.id)
        );
      }
    }

    setConnectingId(profileId);

    const { data, error } = await supabase
      .from("connections")
      .insert({
        requester_id: userId,
        receiver_id: profileId,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Connect error:", error);
      alert(error.message);
    } else if (data) {
      setConnections((current) => [...current, data]);
    }

    setConnectingId(null);
  }

  function getInitials(profile: Profile) {
    const name = profile.full_name?.trim();

    if (name) {
      const parts = name.split(/\s+/);

      if (parts.length >= 2) {
        return (
          parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
        ).toUpperCase();
      }

      return parts[0].charAt(0).toUpperCase();
    }

    if (profile.username?.trim()) {
      return profile.username.trim().charAt(0).toUpperCase();
    }

    return "?";
  }

  function getAvatarGradient(index: number) {
    const gradients = [
      "from-violet-600 via-blue-600 to-cyan-400",
      "from-pink-600 via-violet-600 to-blue-500",
      "from-blue-600 via-cyan-500 to-violet-500",
      "from-fuchsia-600 via-pink-500 to-orange-400",
      "from-indigo-600 via-violet-600 to-fuchsia-500",
    ];

    return gradients[index % gradients.length];
  }

  const countries = useMemo(() => {
    return Array.from(
      new Set(
        profiles
          .map((profile) => profile.country?.trim())
          .filter(Boolean) as string[]
      )
    ).sort();
  }, [profiles]);

  const interests = useMemo(() => {
    const allInterests = profiles.flatMap(
      (profile) => profile.interests || []
    );

    return Array.from(new Set(allInterests))
      .filter(Boolean)
      .sort()
      .slice(0, 12);
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const term = search.toLowerCase().trim();

    return profiles.filter((profile) => {
      if (filter === "countries" && !profile.country) {
        return false;
      }

      if (filter === "interests" && !profile.interests?.length) {
        return false;
      }

      if (!term) return true;

      const matchesName =
        profile.full_name?.toLowerCase().includes(term);

      const matchesUsername =
        profile.username?.toLowerCase().includes(term);

      const matchesCountry =
        profile.country?.toLowerCase().includes(term);

      const matchesBio =
        profile.bio?.toLowerCase().includes(term);

      const matchesInterest = profile.interests?.some((interest) =>
        interest.toLowerCase().includes(term)
      );

      if (filter === "people") {
        return Boolean(matchesName || matchesUsername || matchesBio);
      }

      if (filter === "countries") {
        return Boolean(matchesCountry);
      }

      if (filter === "interests") {
        return Boolean(matchesInterest);
      }

      return Boolean(
        matchesName ||
          matchesUsername ||
          matchesCountry ||
          matchesBio ||
          matchesInterest
      );
    });
  }, [profiles, search, filter]);

  const suggestedProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const connection = getConnection(profile.id);

      return !connection || connection.status === "declined";
    });
  }, [profiles, connections]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <div className="animate-pulse">
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="mt-3 h-9 w-40 rounded bg-white/10" />

            <div className="mt-7 h-14 rounded-2xl bg-white/5" />

            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/10" />

                    <div className="flex-1">
                      <div className="h-4 w-36 rounded bg-white/10" />
                      <div className="mt-3 h-3 w-24 rounded bg-white/10" />
                      <div className="mt-3 h-3 w-32 rounded bg-white/10" />
                    </div>
                  </div>

                  <div className="mt-5 h-12 rounded-xl bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-28 text-white">
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -right-32 top-96 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050816]/90 px-5 py-5 backdrop-blur-2xl">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-400">
                Nikelink
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight">
                Discover
              </h1>

              <p className="mt-1 text-sm text-white/40">
                Find your people around the world.
              </p>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg shadow-lg transition hover:bg-white/10"
              aria-label="Open profile"
            >
              👤
            </button>
          </div>

          {/* SEARCH */}
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 shadow-inner">
            <span className="text-lg text-white/40">⌕</span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people, countries or interests..."
              className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/30"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-sm text-white/40 transition hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTERS */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All" },
              { id: "people", label: "People" },
              { id: "countries", label: "Countries" },
              { id: "interests", label: "Interests" },
            ].map((item) => {
              const active = filter === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as FilterType)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-600/20"
                      : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-7">
        {/* DISCOVERY HERO */}
        {!search && filter === "all" && (
          <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-600/15 via-blue-600/10 to-pink-600/10 p-6">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl">
                🌍
              </div>

              <h2 className="text-2xl font-black">
                Your world is bigger than your timeline.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Discover people with shared interests, different
                backgrounds and new perspectives.
              </p>

              <div className="mt-5 flex items-center gap-3 text-xs text-white/40">
                <span>{profiles.length} people</span>
                <span>•</span>
                <span>{countries.length} countries</span>
                <span>•</span>
                <span>{interests.length} interests</span>
              </div>
            </div>
          </div>
        )}

        {/* POPULAR INTERESTS */}
        {!search &&
          filter === "all" &&
          interests.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">
                    Explore interests
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    Find people who share your interests.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {interests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => {
                      setSearch(interest);
                      setFilter("interests");
                    }}
                    className="shrink-0 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* COUNTRY STRIP */}
        {!search &&
          filter === "all" &&
          countries.length > 0 && (
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-black">
                  Around the world
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  People are joining Nikelink from different places.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {countries.slice(0, 6).map((country) => {
                  const count = profiles.filter(
                    (profile) => profile.country === country
                  ).length;

                  return (
                    <button
                      key={country}
                      onClick={() => {
                        setSearch(country);
                        setFilter("countries");
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-violet-500/30 hover:bg-white/[0.06]"
                    >
                      <div className="text-xl">🌍</div>

                      <p className="mt-3 truncate text-sm font-bold">
                        {country}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {count}{" "}
                        {count === 1 ? "person" : "people"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}

            <button
              onClick={loadDiscover}
              className="ml-2 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* RESULTS HEADER */}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">
              {search || filter !== "all"
                ? "Search results"
                : "People you may know"}
            </h2>

            <p className="mt-1 text-sm text-white/40">
              {filteredProfiles.length}{" "}
              {filteredProfiles.length === 1
                ? "person"
                : "people"}{" "}
              found
            </p>
          </div>

          {(search || filter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="text-xs font-bold text-violet-400"
            >
              Clear
            </button>
          )}
        </div>

        {/* EMPTY STATE */}
        {filteredProfiles.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 text-3xl">
              🌍
            </div>

            <h3 className="mt-5 text-lg font-black">
              No people found
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
              Try another name, country or interest. More people
              will appear here as Nikelink grows.
            </p>

            {(search || filter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold"
              >
                Explore everyone
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProfiles.map((profile, index) => {
              const buttonText = getButtonText(profile.id);
              const isConnecting =
                connectingId === profile.id;

              const hasAvatar = Boolean(
                profile.avatar_url?.trim()
              );

              return (
                <article
                  key={profile.id}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 transition hover:border-violet-500/20 hover:bg-white/[0.05]"
                >
                  <div className="flex gap-4">
                    {/* AVATAR */}
                    <button
                      onClick={() =>
                        router.push(
                          `/profile?user=${profile.id}`
                        )
                      }
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl"
                    >
                      {hasAvatar ? (
                        <img
                          src={profile.avatar_url || ""}
                          alt={
                            profile.full_name ||
                            profile.username ||
                            "Nikelink user"
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                 className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getAvatarGradient(
                            index
                          )} text-xl font-black`}
                        >
                          {getInitials(profile)}
                        </div>
                      )}

                      <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#101426] bg-emerald-400" />
                    </button>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() =>
                          router.push(
                            `/profile?user=${profile.id}`
                          )
                        }
                        className="block max-w-full text-left"
                      >
                        <h3 className="truncate font-black">
                          {profile.full_name ||
                            "Nikelink User"}
                        </h3>

                        {profile.username && (
                          <p className="mt-1 truncate text-sm text-violet-400">
                            @{profile.username}
                          </p>
                        )}
                      </button>

                      {profile.country && (
                        <p className="mt-2 truncate text-xs text-white/40">
                          🌍 {profile.country}
                        </p>
                      )}
                    </div>

                    {/* STATUS */}
                    <div className="shrink-0">
                      {buttonText === "Connected" && (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                          Connected
                        </span>
                      )}

                      {buttonText === "Request Sent" && (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-white/40">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BIO */}
                  {profile.bio && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/55">
                      {profile.bio}
                    </p>
                  )}

                  {/* INTERESTS */}
                  {profile.interests &&
                    profile.interests.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.interests
                          .slice(0, 5)
                          .map((interest) => (
                            <button
                              key={interest}
                              onClick={() => {
                                setSearch(interest);
                                setFilter("interests");
                              }}
                              className="rounded-full border border-violet-500/15 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-300 transition hover:bg-violet-500/20"
                            >
                              {interest}
                            </button>
                          ))}
                      </div>
                    )}

                  {/* ACTIONS */}
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/profile?user=${profile.id}`
                        )
                      }
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() =>
                        handleConnect(profile.id)
                      }
                      disabled={
                        isConnecting ||
                        buttonText === "Connected" ||
                        buttonText === "Request Sent"
                      }
                      className={`flex-1 rounded-xl py-3 text-sm font-black transition ${
                        buttonText === "Connected"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : buttonText === "Request Sent"
                            ? "bg-white/5 text-white/40"
                            : buttonText === "Respond"
                              ? "bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-lg shadow-violet-600/20 hover:opacity-90"
                              : "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-600/20 hover:opacity-90"
                      }`}
                    >
                      {isConnecting
                        ? "Sending..."
                        : buttonText}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* DISCOVERY FOOTER */}
        {suggestedProfiles.length > 0 &&
          !search &&
          filter === "all" && (
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.02] p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 text-xl">
                ✨
              </div>

              <h3 className="mt-4 font-black">
                Keep exploring
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
                Nikelink is built to help people connect beyond
                borders, interests and everyday circles.
              </p>
            </div>
          )}
      </section>

      {/* MOBILE NAVIGATION */}
<nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#050816]/95 backdrop-blur-2xl">
  <div className="mx-auto grid h-20 max-w-3xl grid-cols-4">

    {/* HOME */}
    <button
      onClick={() => router.push("/dashboard")}
      className="flex flex-col items-center justify-center gap-1 text-white/45 transition hover:text-white"
    >
      <span className="text-xl">⌂</span>
      <span className="text-[10px]">
        Home
      </span>
    </button>

    {/* DISCOVER */}
    <button
      onClick={() => router.push("/discover")}
      className="flex flex-col items-center justify-center gap-1 text-violet-400"
    >
      <span className="text-xl">
        ◎
      </span>

      <span className="text-[10px] font-bold">
        Discover
      </span>
    </button>

    {/* COMMUNITY */}
    <button
      onClick={() => router.push("/communities")}
      className="flex flex-col items-center justify-center gap-1 text-white/45 transition hover:text-white"
    >
      <span className="text-xl">
        ◈
      </span>

      <span className="text-[10px]">
        Community
      </span>
    </button>

    {/* MESSAGES */}
    <button
      onClick={() => router.push("/messages")}
      className="flex flex-col items-center justify-center gap-1 text-white/45 transition hover:text-white"
    >
      <span className="text-xl">
        ◌
      </span>

      <span className="text-[10px]">
        Messages
      </span>
    </button>

  </div>
</nav>

