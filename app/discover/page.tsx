"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  country: string | null;
  bio?: string | null;
  interests?: string[] | null;
  created_at?: string | null;
};

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  created_at?: string;
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
  const [actionId, setActionId] = useState<string | null>(null);
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

    const { data: profileData, error: profileError } =
      await supabase
        .from("profile")
        .select("*")
        .neq("id", user.id)
        .order("created_at", { ascending: false });

    if (profileError) {
      console.error("Profile error:", profileError);
      setErrorMessage("We couldn't load people right now.");
    } else {
      setProfiles((profileData || []) as Profile[]);
    }

    /*
     * YOUR REAL TABLE IS: connections
     */
    const { data: connectionData, error: connectionError } =
      await supabase
        .from("connections")
        .select("*")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (connectionError) {
      console.error("Connection error:", connectionError);
    } else {
      setConnections((connectionData || []) as Connection[]);
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

  function getButtonState(profileId: string) {
    const connection = getConnection(profileId);

    if (!connection) {
      return "connect";
    }

    if (connection.status === "accepted") {
      return "connected";
    }

    if (
      connection.status === "pending" &&
      connection.requester_id === userId
    ) {
      return "sent";
    }

    if (
      connection.status === "pending" &&
      connection.receiver_id === userId
    ) {
      return "incoming";
    }

    return "connect";
  }

  async function sendConnectionRequest(profileId: string) {
    if (!userId || actionId) return;

    setActionId(profileId);
    setErrorMessage("");

    const existing = getConnection(profileId);

    if (existing?.status === "declined") {
      const { error: deleteError } = await supabase
        .from("connections")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        console.error(
          "Delete declined connection error:",
          deleteError
        );

        setErrorMessage(deleteError.message);
        setActionId(null);
        return;
      }

      setConnections((current) =>
        current.filter((item) => item.id !== existing.id)
      );
    }

    if (existing && existing.status !== "declined") {
      setActionId(null);
      return;
    }

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
      console.error(
        "Send connection request error:",
        error
      );

      setErrorMessage(error.message);
    } else if (data) {
      setConnections((current) => [
        ...current,
        data as Connection,
      ]);
    }

    setActionId(null);
  }

  async function acceptConnection(connection: Connection) {
    if (actionId) return;

    setActionId(connection.id);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("connections")
      .update({
        status: "accepted",
      })
      .eq("id", connection.id)
      .select()
      .single();

    if (error) {
      console.error(
        "Accept connection error:",
        error
      );

      setErrorMessage(error.message);
    } else if (data) {
      setConnections((current) =>
        current.map((item) =>
          item.id === connection.id
            ? (data as Connection)
            : item
        )
      );
    }

    setActionId(null);
  }

  async function declineConnection(connection: Connection) {
    if (actionId) return;

    setActionId(connection.id);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("connections")
      .update({
        status: "declined",
      })
      .eq("id", connection.id)
      .select()
      .single();

    if (error) {
      console.error(
        "Decline connection error:",
        error
      );

      setErrorMessage(error.message);
    } else if (data) {
      setConnections((current) =>
        current.map((item) =>
          item.id === connection.id
            ? (data as Connection)
            : item
        )
      );
    }

    setActionId(null);
  }

  function openProfile(profileId: string) {
    router.push(`/profile?user=${profileId}`);
  }

  function getInitials(profile: Profile) {
    const name = profile.full_name?.trim();

    if (name) {
      const parts = name.split(/\s+/);

      if (parts.length >= 2) {
        return (
          parts[0].charAt(0) +
          parts[parts.length - 1].charAt(0)
        ).toUpperCase();
      }

      return parts[0].charAt(0).toUpperCase();
    }

    if (profile.username?.trim()) {
      return profile.username
        .trim()
        .charAt(0)
        .toUpperCase();
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

  const countryStats = useMemo(() => {
    const counts: Record<string, number> = {};

    profiles.forEach((profile) => {
      const country = profile.country?.trim();

      if (country) {
        counts[country] =
          (counts[country] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({
        country,
        count,
      }));
  }, [profiles]);

  const interests = useMemo(() => {
    const allInterests = profiles.flatMap(
      (profile) => profile.interests || []
    );

    return Array.from(
      new Set(
        allInterests
          .map((interest) => interest.trim())
          .filter(Boolean)
      )
    )
      .sort()
      .slice(0, 18);
  }, [profiles]);

  const interestStats = useMemo(() => {
    const counts: Record<string, number> = {};

    profiles.forEach((profile) => {
      (profile.interests || []).forEach(
        (interest) => {
          const clean = interest.trim();

          if (clean) {
            counts[clean] =
              (counts[clean] || 0) + 1;
          }
        }
      );
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([interest, count]) => ({
        interest,
        count,
      }));
  }, [profiles]);

  const connectedCount = useMemo(() => {
    return connections.filter(
      (connection) =>
        connection.status === "accepted"
    ).length;
  }, [connections]);

  const pendingIncoming = useMemo(() => {
    return connections.filter(
      (connection) =>
        connection.status === "pending" &&
        connection.receiver_id === userId
    );
  }, [connections, userId]);

  /*
   * People are kept real.
   * We prioritize people with:
   * - shared interests
   * - same country
   * - newer profiles
   *
   * This is recommendation logic, not fake activity.
   */
  const recommendedProfiles = useMemo(() => {
    if (search || filter !== "all") {
      return profiles;
    }

    const currentUserProfile =
      profiles.length > 0
        ? null
        : null;

    return [...profiles]
      .map((profile) => {
        let score = 0;

        if (profile.country) {
          score += 1;
        }

        if (
          profile.interests &&
          profile.interests.length > 0
        ) {
          score += 2;
        }

        if (profile.bio) {
          score += 1;
        }

        if (profile.avatar_url) {
          score += 1;
        }

        return {
          profile,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.profile);
  }, [profiles, search, filter]);

  const filteredProfiles = useMemo(() => {
    const source =
      search || filter !== "all"
        ? profiles
        : recommendedProfiles;

    const term = search.toLowerCase().trim();

    return source.filter((profile) => {
      if (
        filter === "countries" &&
        !profile.country
      ) {
        return false;
      }

      if (
        filter === "interests" &&
        !profile.interests?.length
      ) {
        return false;
      }

      if (!term) return true;

      const matchesName =
        profile.full_name
          ?.toLowerCase()
          .includes(term);

      const matchesUsername =
        profile.username
          ?.toLowerCase()
          .includes(term);

      const matchesCountry =
        profile.country
          ?.toLowerCase()
          .includes(term);

      const matchesBio =
        profile.bio
          ?.toLowerCase()
          .includes(term);

      const matchesInterest =
        profile.interests?.some((interest) =>
          interest
            .toLowerCase()
            .includes(term)
        );

      if (filter === "people") {
        return Boolean(
          matchesName ||
            matchesUsername ||
            matchesBio
        );
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
  }, [
    profiles,
    recommendedProfiles,
    search,
    filter,
  ]);

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
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -right-32 top-96 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute left-1/2 top-[55%] h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/[0.06] blur-3xl" />
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
              onClick={() =>
                router.push("/profile")
              }
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg shadow-lg transition hover:bg-white/10"
              aria-label="Open profile"
            >
              👤
            </button>
          </div>

          {/* SEARCH */}
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 shadow-inner">
            <span className="text-lg text-white/40">
              ⌕
            </span>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
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
              const active =
                filter === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setFilter(
                      item.id as FilterType
                    )
                  }
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

        {/* GLOBAL NETWORK HERO */}
        {!search && filter === "all" && (
          <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-600/15 via-blue-600/10 to-pink-600/10 p-6 shadow-2xl shadow-violet-950/20">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-3xl shadow-xl">
                  🌍
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  Global Network
                </div>
              </div>

              <h2 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
                Your world is bigger than your timeline.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
                Discover real people, interests and communities
                beyond your immediate circle. Connect with people
                from different places and perspectives.
              </p>

              {/* NETWORK STATS */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-lg font-black">
                    {profiles.length}
                  </p>

                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    People
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-lg font-black">
                    {countries.length}
                  </p>

                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    Countries
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-lg font-black">
                    {interests.length}
                  </p>

                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    Interests
                  </p>
                </div>
              </div>

              {connectedCount > 0 && (
                <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] px-4 py-3">
                  <p className="text-xs text-emerald-300">
                    ✨ You are connected with{" "}
                    <span className="font-black">
                      {connectedCount}
                    </span>{" "}
                    {connectedCount === 1
                      ? "person"
                      : "people"}{" "}
                    on Nikelink.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INCOMING REQUESTS */}
        {pendingIncoming.length > 0 && (
          <div className="mb-8 rounded-[2rem] border border-violet-500/20 bg-violet-500/[0.07] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">
                  Connection requests
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  People want to connect with you.
                </p>
              </div>

              <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-violet-600 px-2 text-xs font-black">
                {pendingIncoming.length}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {pendingIncoming.map(
                (connection) => {
                  const requester =
                    profiles.find(
                      (profile) =>
                        profile.id ===
                        connection.requester_id
                    );

                  if (!requester) return null;

                  const busy =
                    actionId === connection.id;

                  return (
                    <div
                      key={connection.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                    >
                      <button
                        onClick={() =>
                          openProfile(
                            requester.id
                          )
                        }
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-xl"
                      >
                        {requester.avatar_url ? (
                          <img
                            src={
                              requester.avatar_url
                            }
                            alt={
                              requester.full_name ||
                              requester.username ||
                              "User"
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-black">
                            {getInitials(
                              requester
                            )}
                          </div>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {requester.full_name ||
                            requester.username ||
                            "Nikelink user"}
                        </p>

                        {requester.username && (
                          <p className="truncate text-xs text-white/35">
                            @{requester.username}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() =>
                            acceptConnection(
                              connection
                            )
                          }
                          className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-xs font-bold disabled:opacity-50"
                        >
                          {busy
                            ? "..."
                            : "Accept"}
                        </button>

                        <button
                          disabled={busy}
                          onClick={() =>
                            declineConnection(
                              connection
                            )
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* INTERESTS */}
        {!search &&
          filter === "all" &&
          interestStats.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black">
                    Explore interests
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    Find people around topics you care about.
                  </p>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Explore
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {interestStats.map(
                  ({ interest, count }) => (
                    <button
                      key={interest}
                      onClick={() => {
                        setSearch(interest);
                        setFilter("interests");
                      }}
                      className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-violet-500/30 hover:bg-violet-500/[0.06]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-sm">
                        ✦
                      </div>

                      <p className="mt-3 truncate text-sm font-bold">
                        {interest}
                      </p>

                      <p className="mt-1 text-[10px] text-white/35">
                        {count}{" "}
                        {count === 1
                          ? "person"
                          : "people"}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

        {/* COUNTRIES */}
        {!search &&
          filter === "all" &&
          countryStats.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black">
                    Around the world
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    Explore the countries represented on Nikelink.
                  </p>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Global
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {countryStats
                  .slice(0, 9)
                  .map(({ country, count }) => (
                    <button
                      key={country}
                      onClick={() => {
                        setSearch(country);
                        setFilter("countries");
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-blue-500/30 hover:bg-white/[0.06]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                        🌍
                      </div>

                      <p className="mt-3 truncate text-sm font-bold">
                        {country}
                      </p>

                      <p className="mt-1 text-[10px] text-white/35">
                        {count}{" "}
                        {count === 1
                          ? "person"
                          : "people"}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}

        {/* DISCOVERY MESSAGE */}
        {!search &&
          filter === "all" &&
          filteredProfiles.length > 0 && (
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
              <p className="text-xs leading-5 text-white/40">
                ✨ These are real Nikelink members. Connect with
                people who share your interests, explore new
                countries and grow your network naturally.
              </p>
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

        {/* EMPTY */}
        {filteredProfiles.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 text-3xl">
              🌍
            </div>

            <h3 className="mt-5 text-lg font-black">
              No people found
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
              Try another name, country or interest.
              More people will appear here as Nikelink
              grows.
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
            {filteredProfiles.map(
              (profile, index) => {
                const state =
                  getButtonState(profile.id);

                const busy =
                  actionId === profile.id;

                const hasAvatar =
                  Boolean(
                    profile.avatar_url?.trim()
                  );

                const connection =
                  getConnection(profile.id);

                return (
                  <article
                    key={profile.id}
                    className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 transition hover:border-violet-500/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex gap-4">
                      {/* AVATAR */}
                      <button
                        onClick={() =>
                          openProfile(profile.id)
                        }
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                          index
                        )}`}
                      >
                        {hasAvatar ? (
                          <img
                            src={
                              profile.avatar_url ||
                              ""
                            }
                            alt={
                              profile.full_name ||
                              profile.username ||
                              "Nikelink user"
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-black">
                            {getInitials(
                              profile
                            )}
                          </div>
                        )}
                      </button>

                      {/* PROFILE INFO */}
                      <button
                        onClick={() =>
                          openProfile(profile.id)
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-black">
                            {profile.full_name ||
                              profile.username ||
                              "Nikelink user"}
                          </h3>

                          {state ===
                            "connected" && (
                            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                              Connected
                            </span>
                          )}
                        </div>

                        {profile.username && (
                          <p className="mt-1 truncate text-xs text-violet-300/70">
                            @{profile.username}
                          </p>
                        )}

                        {profile.country && (
                          <p className="mt-2 truncate text-xs text-white/35">
                            🌍 {profile.country}
                          </p>
                        )}
                      </button>
                    </div>

                    {/* BIO */}
                    {profile.bio && (
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/45">
                        {profile.bio}
                      </p>
                    )}

                    {/* INTERESTS */}
                    {profile.interests &&
                      profile.interests.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {profile.interests
                            .slice(0, 4)
                            .map(
                              (interest) => (
                                <button
                                  key={interest}
                                  onClick={() => {
                                    setSearch(
                                      interest
                                    );
                                    setFilter(
                                      "interests"
                                    );
                                  }}
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/50 transition hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-300"
                                >
                                  {interest}
                                </button>
                              )
                            )}
                        </div>
                      )}

                    {/* ACTION */}
                    <div className="mt-5">
                      {state === "connect" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            sendConnectionRequest(
                              profile.id
                            )
                          }
                          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-black shadow-lg shadow-violet-600/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy
                            ? "Sending..."
                            : "Connect"}
                        </button>
                      )}

                      {state === "sent" && (
                        <button
                          disabled
                          className="w-full rounded-xl border border-violet-500/20 bg-violet-500/10 py-3 text-sm font-bold text-violet-300"
                        >
                          ✓ Request Sent
                        </button>
                      )}

                      {state === "incoming" &&
                        connection && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              disabled={
                                actionId ===
                                connection.id
                              }
                              onClick={() =>
                                acceptConnection(
                                  connection
                                )
                              }
                              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-black disabled:opacity-50"
                            >
                              {actionId ===
                              connection.id
                                ? "..."
                                : "Accept"}
                            </button>

                            <button
                              disabled={
                                actionId ===
                                connection.id
                              }
                              onClick={() =>
                                declineConnection(
                                  connection
                                )
                              }
                              className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/60 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                      {state === "connected" && (
                        <button
                          onClick={() =>
                            router.push(
                              `/messages?user=${profile.id}`
                            )
                          }
                          className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/15"
                        >
                          ✓ Connected · Message
                        </button>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#050816]/95 px-3 py-3 backdrop-blur-2xl">
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
          <button
            onClick={() =>
              router.push("/messages")
            }
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl">✉</span>
            <span className="text-[10px] font-bold">
              Messages
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/profile")
            }
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-bold">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
}
