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

type FilterType =
  | "all"
  | "people"
  | "countries"
  | "interests";
function GlobalActivity() {
  const [memberCount, setMemberCount] = useState(0);
  const [countries, setCountries] = useState<
    { country: string; count: number }[]
  >([]);
  const [totalCountries, setTotalCountries] =
    useState(0);

  const [topInterests, setTopInterests] = useState<
    { interest: string; count: number }[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalActivity();
  }, []);

  async function loadGlobalActivity() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profile")
      .select("country, interests");

    if (error) {
      console.error(
        "Global activity error:",
        error
      );

      setLoading(false);
      return;
    }

    const profiles = data || [];

    setMemberCount(profiles.length);

    const countryMap: Record<string, number> = {};
    const interestMap: Record<string, number> = {};

    profiles.forEach((profile) => {
      if (profile.country) {
        const country =
          String(profile.country).trim();

        if (country) {
          countryMap[country] =
            (countryMap[country] || 0) + 1;
        }
      }

      if (Array.isArray(profile.interests)) {
        profile.interests.forEach(
          (interest: string) => {
            const value =
              String(interest).trim();

            if (value) {
              interestMap[value] =
                (interestMap[value] || 0) + 1;
            }
          }
        );
      }
    });

    const allCountries = Object.entries(
      countryMap
    )
      .map(([country, count]) => ({
        country,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const countryList =
      allCountries.slice(0, 6);

    const interestList = Object.entries(
      interestMap
    )
      .map(([interest, count]) => ({
        interest,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    setCountries(countryList);
    setTotalCountries(allCountries.length);
    setTopInterests(interestList);
    setLoading(false);
  }

  const highestCountryCount =
    countries.length > 0
      ? countries[0].count
      : 1;

  return (
    <section className="mt-10">
      {/* SECTION HEADER */}
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-300/70">
          Nikelink Global
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-tight">
          🌍 The world is here
        </h2>

        <p className="mt-1 max-w-xl text-sm leading-6 text-white/40">
          See how the Nikelink community is growing
          across countries and interests.
        </p>
      </div>

      {/* GLOBAL CARD */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/[0.08] via-violet-500/[0.06] to-pink-500/[0.06] shadow-2xl shadow-black/20">

        {/* GLOBE VISUAL */}
        <div className="relative flex h-72 items-center justify-center overflow-hidden border-b border-white/10 bg-[#040817]">

          {/* Ambient glow */}
          <div className="absolute h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

          {/* Orbit rings */}
          <div className="absolute h-60 w-60 rounded-full border border-blue-400/20 rotate-[18deg] shadow-[0_0_45px_rgba(59,130,246,0.12)]" />

          <div className="absolute h-52 w-52 rounded-full border border-violet-400/20 rotate-[-35deg]" />

          <div className="absolute h-44 w-44 rounded-full border border-pink-400/20 rotate-[65deg]" />

          {/* Globe lines */}
          <div className="absolute h-24 w-60 rounded-[50%] border border-blue-300/15" />

          <div className="absolute h-60 w-24 rounded-[50%] border border-violet-300/15" />

          {/* Connection lines */}
          <div className="absolute h-px w-40 rotate-[18deg] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

          <div className="absolute h-px w-36 rotate-[-28deg] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

          <div className="absolute h-px w-32 rotate-[52deg] bg-gradient-to-r from-transparent via-pink-400/40 to-transparent" />

          {/* Dynamic activity nodes */}

          {countries.length > 0 && (
            <>
              <div
                className="absolute left-[22%] top-[31%] h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,1)]"
                title={countries[0]?.country}
              />

              <div
                className="absolute right-[24%] top-[28%] h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,1)]"
                title={countries[1]?.country}
              />

              <div
                className="absolute right-[19%] top-[55%] h-2.5 w-2.5 rounded-full bg-pink-400 shadow-[0_0_20px_rgba(244,114,182,1)]"
                title={countries[2]?.country}
              />

              <div
                className="absolute left-[30%] bottom-[25%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,1)]"
                title={countries[3]?.country}
              />

              <div
                className="absolute left-[48%] top-[18%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]"
                title={countries[4]?.country}
              />

              <div
                className="absolute right-[39%] bottom-[20%] h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(147,197,253,0.9)]"
                title={countries[5]?.country}
              />
            </>
          )}

          {/* Globe */}
          <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-[#080d20]/95 text-6xl shadow-[0_0_70px_rgba(59,130,246,0.28)]">
            🌍
          </div>

          {/* Status */}
          <div className="absolute bottom-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/55 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />

            {loading
              ? "Loading activity"
              : `${memberCount} ${
                  memberCount === 1
                    ? "member"
                    : "members"
                } connected`}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-px bg-white/10">
          <div className="bg-[#080d20]/70 p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/30">
              Members
            </p>

            <p className="mt-2 text-3xl font-black">
              {loading ? "—" : memberCount}
            </p>

            <p className="mt-1 text-xs text-white/35">
              People on Nikelink
            </p>
          </div>

          <div className="bg-[#080d20]/70 p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/30">
              Countries
            </p>

            <p className="mt-2 text-3xl font-black">
              {loading
                ? "—"
                : totalCountries}
            </p>

            <p className="mt-1 text-xs text-white/35">
              Countries represented
            </p>
          </div>
        </div>

        {/* COUNTRIES */}
        <div className="border-t border-white/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black">
                🌎 Around the world
              </p>

              <p className="mt-1 text-xs text-white/35">
                Community members by country
              </p>
            </div>

            {!loading &&
              totalCountries > 6 && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-white/40">
                  Top 6
                </span>
              )}
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white/[0.04] p-4 text-center text-xs text-white/30">
              Loading global activity...
            </div>
          ) : countries.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.04] p-4 text-center text-xs text-white/30">
              Add your country to your profile to appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {countries.map(
                (item, index) => {
                  const percentage = Math.max(
                    12,
                    Math.round(
                      (item.count /
                        highestCountryCount) *
                        100
                    )
                  );

                  return (
                    <div
                      key={item.country}
                      className="rounded-2xl border border-white/5 bg-white/[0.035] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm">
                            {index === 0
                              ? "🌐"
                              : index === 1
                                ? "✨"
                                : index === 2
                                  ? "🌎"
                                  : "📍"}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white/80">
                              {item.country}
                            </p>

                            <p className="mt-0.5 text-[10px] text-white/30">
                              {item.count}{" "}
                              {item.count === 1
                                ? "member"
                                : "members"}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-xs font-black text-white/40">
                          {percentage}%
                        </span>
                      </div>

                      {/* ACTIVITY BAR */}
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 transition-all duration-700"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* INTERESTS */}
        <div className="border-t border-white/10 p-5">
          <p className="text-sm font-black">
            ✨ Popular interests
          </p>

          <p className="mt-1 text-xs text-white/35">
            What people are connecting around
          </p>

          {loading ? (
            <div className="mt-4 rounded-2xl bg-white/[0.04] p-4 text-center text-xs text-white/30">
              Loading interests...
            </div>
          ) : topInterests.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white/[0.04] p-4 text-center text-xs text-white/30">
              Interests will appear as people join.
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {topInterests.map((item) => (
                <div
                  key={item.interest}
                  className="rounded-full border border-violet-400/10 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-200"
                >
                  {item.interest}

                  <span className="ml-1.5 text-violet-300/40">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="border-t border-white/10 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-center">
            <p className="text-xs font-bold text-white/60">
              🌐 Nikelink is connecting people globally
            </p>

            <p className="mt-1 text-[10px] leading-5 text-white/30">
              Discover people, communities and
              conversations from around the world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DiscoverPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [follows, setFollows] = useState<
  { id: string; follower_id: string; following_id: string }[]
>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<FilterType>("all");

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] =
    useState<string | null>(null);
  const [errorMessage, setErrorMessage] =
    useState("");

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

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profile")
      .select("*")
      .neq("id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (profileError) {
      console.error(
        "Profile error:",
        profileError
      );

      setErrorMessage(
        "We couldn't load people right now."
      );
    } else {
      setProfiles(
        (profileData || []) as Profile[]
      );
    }

    const {
      data: connectionData,
      error: connectionError,
    } = await supabase
      .from("connections")
      .select("*")
      .or(
        `requester_id.eq.${user.id},receiver_id.eq.${user.id}`
      );

    if (connectionError) {
      console.error(
        "Connection error:",
        connectionError
      );
    } else {
      setConnections(
        (connectionData || []) as Connection[]
      );
    }
const { data: followData, error: followError } =
  await supabase
    .from("follows")
    .select("id, follower_id, following_id")
    .or(
      `follower_id.eq.${user.id},following_id.eq.${user.id}`
    );

if (followError) {
  console.error("Follow error:", followError);
} else {
  setFollows(followData || []);
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
function isFollowing(profileId: string) {
  return follows.some(
    (follow) =>
      follow.follower_id === userId &&
      follow.following_id === profileId
  );
}

async function toggleFollow(profileId: string) {
  if (!userId || actionId) return;

  setActionId(`follow-${profileId}`);
  setErrorMessage("");

  const existingFollow = follows.find(
    (follow) =>
      follow.follower_id === userId &&
      follow.following_id === profileId
  );

  if (existingFollow) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", existingFollow.id);

    if (error) {
      console.error("Unfollow error:", error);
      setErrorMessage(error.message);
      setActionId(null);
      return;
    }

    setFollows((current) =>
      current.filter(
        (follow) =>
          follow.id !== existingFollow.id
      )
    );
  } else {
    const { data, error } = await supabase
      .from("follows")
      .insert({
        follower_id: userId,
        following_id: profileId,
      })
      .select(
        "id, follower_id, following_id"
      )
      .single();

    if (error) {
      console.error("Follow error:", error);
      setErrorMessage(error.message);
      setActionId(null);
      return;
    }

    if (data) {
      setFollows((current) => [
        ...current,
        data,
      ]);
    }
  }

  setActionId(null);
}
  function getButtonState(profileId: string) {
    const connection =
      getConnection(profileId);

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

  async function sendConnectionRequest(
    profileId: string
  ) {
    if (!userId || actionId) return;

    setActionId(profileId);
    setErrorMessage("");

    const existing =
      getConnection(profileId);

    if (existing?.status === "declined") {
      const {
        error: deleteError,
      } = await supabase
        .from("connections")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        console.error(
          "Delete declined connection error:",
          deleteError
        );

        setErrorMessage(
          deleteError.message
        );
        setActionId(null);
        return;
      }

      setConnections((current) =>
        current.filter(
          (item) => item.id !== existing.id
        )
      );
    }

    if (
      existing &&
      existing.status !== "declined"
    ) {
      setActionId(null);
      return;
    }

    const {
      data,
      error,
    } = await supabase
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

  async function acceptConnection(
    connection: Connection
  ) {
    if (actionId) return;

    setActionId(connection.id);
    setErrorMessage("");

    const {
      data,
      error,
    } = await supabase
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

  async function declineConnection(
    connection: Connection
  ) {
    if (actionId) return;

    setActionId(connection.id);
    setErrorMessage("");

    const {
      data,
      error,
    } = await supabase
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
    router.push(
      `/profile?user=${profileId}`
    );
  }

  function getInitials(
    profile: Profile
  ) {
    const name =
      profile.full_name?.trim();

    if (name) {
      const parts =
        name.split(/\s+/);

      if (parts.length >= 2) {
        return (
          parts[0].charAt(0) +
          parts[parts.length - 1].charAt(0)
        ).toUpperCase();
      }

      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    if (profile.username?.trim()) {
      return profile.username
        .trim()
        .charAt(0)
        .toUpperCase();
    }

    return "?";
  }

  function getAvatarGradient(
    index: number
  ) {
    const gradients = [
      "from-violet-600 via-blue-600 to-cyan-400",
      "from-pink-600 via-violet-600 to-blue-500",
      "from-blue-600 via-cyan-500 to-violet-500",
      "from-fuchsia-600 via-pink-500 to-orange-400",
      "from-indigo-600 via-violet-600 to-fuchsia-500",
    ];

    return gradients[
      index % gradients.length
    ];
  }

  const countries = useMemo(() => {
    return Array.from(
      new Set(
        profiles
          .map((profile) =>
            profile.country?.trim()
          )
          .filter(Boolean) as string[]
      )
    ).sort();
  }, [profiles]);

  const countryStats = useMemo(() => {
    const counts: Record<
      string,
      number
    > = {};

    profiles.forEach((profile) => {
      const country =
        profile.country?.trim();

      if (country) {
        counts[country] =
          (counts[country] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort(
        (a, b) => b[1] - a[1]
      )
      .map(
        ([country, count]) => ({
          country,
          count,
        })
      );
  }, [profiles]);

  const interests = useMemo(() => {
    const allInterests =
      profiles.flatMap(
        (profile) =>
          profile.interests || []
      );

    return Array.from(
      new Set(
        allInterests
          .map((interest) =>
            interest.trim()
          )
          .filter(Boolean)
      )
    )
      .sort()
      .slice(0, 18);
  }, [profiles]);

  const interestStats = useMemo(() => {
    const counts: Record<
      string,
      number
    > = {};

    profiles.forEach((profile) => {
      (
        profile.interests || []
      ).forEach((interest) => {
        const clean =
          interest.trim();

        if (clean) {
          counts[clean] =
            (counts[clean] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .sort(
        (a, b) => b[1] - a[1]
      )
      .slice(0, 12)
      .map(
        ([interest, count]) => ({
          interest,
          count,
        })
      );
  }, [profiles]);

  const connectedCount =
    useMemo(() => {
      return connections.filter(
        (connection) =>
          connection.status ===
          "accepted"
      ).length;
    }, [connections]);

  const pendingIncoming =
    useMemo(() => {
      return connections.filter(
        (connection) =>
          connection.status ===
            "pending" &&
          connection.receiver_id ===
            userId
      );
    }, [
      connections,
      userId,
    ]);

  const recommendedProfiles =
    useMemo(() => {
      if (
        search ||
        filter !== "all"
      ) {
        return profiles;
      }

      return [...profiles]
        .map((profile) => {
          let score = 0;

          if (profile.avatar_url) {
            score += 3;
          }

          if (profile.country) {
            score += 2;
          }

          if (
            profile.interests &&
            profile.interests.length > 0
          ) {
            score += 3;
          }

          if (profile.bio) {
            score += 2;
          }

          return {
            profile,
            score,
          };
        })
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .map(
          (item) =>
            item.profile
        );
    }, [
      profiles,
      search,
      filter,
    ]);

  const filteredProfiles =
    useMemo(() => {
      const source =
        search ||
        filter !== "all"
          ? profiles
          : recommendedProfiles;

      const term =
        search
          .toLowerCase()
          .trim();

      return source.filter(
        (profile) => {
          if (
            filter ===
              "countries" &&
            !profile.country
          ) {
            return false;
          }

          if (
            filter ===
              "interests" &&
            !profile.interests?.length
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

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
            profile.interests?.some(
              (interest) =>
                interest
                  .toLowerCase()
                  .includes(term)
            );

          if (
            filter ===
            "people"
          ) {
            return Boolean(
              matchesName ||
                matchesUsername ||
                matchesBio
            );
          }

          if (
            filter ===
            "countries"
          ) {
            return Boolean(
              matchesCountry
            );
          }

          if (
            filter ===
            "interests"
          ) {
            return Boolean(
              matchesInterest
            );
          }

          return Boolean(
            matchesName ||
              matchesUsername ||
              matchesCountry ||
              matchesBio ||
              matchesInterest
          );
        }
      );
    }, [
      profiles,
      recommendedProfiles,
      search,
      filter,
    ]);

  const showExplore =
    !search &&
    filter === "all";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <div className="animate-pulse">
            <div className="h-4 w-20 rounded bg-white/10" />

            <div className="mt-3 h-9 w-40 rounded bg-white/10" />

            <div className="mt-7 h-14 rounded-2xl bg-white/5" />

            <div className="mt-8 space-y-4">
              {[1, 2, 3].map(
                (item) => (
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
                )
              )}
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
                router.push(
                  "/profile"
                )
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
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search people, countries or interests..."
              className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/30"
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                className="text-sm text-white/40 transition hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTERS */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {[
              {
                id: "all",
                label: "All",
              },
              {
                id: "people",
                label: "People",
              },
              {
                id: "countries",
                label: "Countries",
              },
              {
                id: "interests",
                label: "Interests",
              },
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

        {/* GLOBAL EXPLORE HERO */}
        {showExplore && (
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
                Discover real people, interests and
                perspectives beyond your immediate
                circle. Explore Nikelink and find
                connections that matter.
              </p>
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
              {connectedCount > 0 && (
                <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] px-4 py-3">
                  <p className="text-xs text-emerald-300">
                    ✨ You are connected with{" "}
                    <span className="font-black">
                      {connectedCount}
                    </span>{" "}
                    {connectedCount ===
                    1
                      ? "person"
                      : "people"}{" "}
                    on Nikelink.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEW USER PATH */}
        {showExplore &&
          profiles.length > 0 &&
          connectedCount === 0 && (
            <div className="mb-8 rounded-[2rem] border border-blue-500/20 bg-blue-500/[0.06] p-5">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                  ✨
                </div>

                <div>
                  <h3 className="font-black">
                    Start building your Nikelink circle
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-white/45">
                    Find someone who shares your
                    interests and send your first
                    connection request.
                  </p>

                  <button
                    onClick={() =>
                      setFilter("people")
                    }
                    className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-xs font-black shadow-lg shadow-violet-600/20"
                  >
                    Explore People →
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* INCOMING REQUESTS */}
        {pendingIncoming.length > 0 && (
          <div className="mb-8 rounded-[2rem] border border-violet-500/20 bg-violet-500/[0.07] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
                  Connections
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Connection requests
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  People who want to connect with you.
                </p>
              </div>

              <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-violet-600 px-3 text-xs font-black">
                {pendingIncoming.length}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {pendingIncoming.map(
                (connection) => {
                  const requester =
                    profiles.find(
                      (profile) =>
                        profile.id ===
                        connection.requester_id
                    );

                  if (!requester) {
                    return null;
                  }

                  return (
                    <div
                      key={connection.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            openProfile(
                              requester.id
                            )
                          }
                          className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                            profiles.indexOf(
                              requester
                            )
                          )} text-sm font-black`}
                        >
                          {requester.avatar_url ? (
                            <img
                              src={
                                requester.avatar_url
                              }
                              alt={
                                requester.full_name ||
                                "Profile"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(
                              requester
                            )
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() =>
                              openProfile(
                                requester.id
                              )
                            }
                            className="truncate text-left text-sm font-black hover:text-violet-300"
                          >
                            {requester.full_name ||
                              requester.username ||
                              "Nikelink user"}
                          </button>

                          <p className="truncate text-xs text-white/40">
                            {requester.username
                              ? `@${requester.username}`
                              : requester.country ||
                                "Nikelink member"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            acceptConnection(
                              connection
                            )
                          }
                          disabled={
                            actionId ===
                            connection.id
                          }
                          className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-xs font-black disabled:opacity-50"
                        >
                          {actionId ===
                          connection.id
                            ? "..."
                            : "Accept"}
                        </button>

                        <button
                          onClick={() =>
                            declineConnection(
                              connection
                            )
                          }
                          disabled={
                            actionId ===
                            connection.id
                          }
                          className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-black text-white/60 disabled:opacity-50"
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

        {/* INTEREST EXPLORER */}
        {showExplore &&
          interestStats.length > 0 && (
            <div className="mb-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">
                    Explore by interest
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Find your people
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setFilter(
                      "interests"
                    )
                  }
                  className="text-xs font-bold text-violet-300"
                >
                  View all
                </button>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {interestStats.map(
                  ({
                    interest,
                    count,
                  }) => (
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
                      className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition hover:border-violet-500/30 hover:bg-violet-500/10"
                    >
                      <p className="text-sm font-bold">
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

        {/* COUNTRY EXPLORER */}
        {showExplore &&
          countryStats.length > 0 && (
            <div className="mb-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                    Around the world
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Explore countries
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setFilter(
                      "countries"
                    )
                  }
                  className="text-xs font-bold text-cyan-300"
                >
                  View all
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {countryStats
                  .slice(0, 6)
                  .map(
                    ({
                      country,
                      count,
                    }) => (
                      <button
                        key={country}
                        onClick={() => {
                          setSearch(
                            country
                          );
                          setFilter(
                            "countries"
                          );
                        }}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/[0.07]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            🌎
                          </span>

                          <span className="truncate text-sm font-black">
                            {country}
                          </span>
                        </div>

                        <p className="mt-2 text-[10px] uppercase tracking-wider text-white/35">
                          {count}{" "}
                          {count === 1
                            ? "member"
                            : "members"}
                        </p>
                      </button>
                    )
                  )}
              </div>
            </div>
          )}

        {/* PEOPLE HEADER */}
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
              {search ||
              filter !== "all"
                ? "Search results"
                : "People you may connect with"}
            </p>

            <h2 className="mt-1 text-xl font-black">
              {search
                ? `Results for "${search}"`
                : "Meet new people"}
            </h2>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black text-white/40">
            {filteredProfiles.length}
          </div>
        </div>

        {/* PEOPLE */}
        {filteredProfiles.length > 0 ? (
          <div className="space-y-4">
            {filteredProfiles.map(
              (
                profile,
                index
              ) => {
                const state =
                  getButtonState(
                    profile.id
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
                          openProfile(
                            profile.id
                          )
                        }
                        className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                          index
                        )} text-lg font-black shadow-lg`}
                      >
                        {profile.avatar_url ? (
                          <img
                            src={
                              profile.avatar_url
                            }
                            alt={
                              profile.full_name ||
                              "Profile"
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(
                            profile
                          )
                        )}

                        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-[#101326] bg-emerald-400" />
                      </button>

                      {/* PROFILE INFO */}
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() =>
                            openProfile(
                              profile.id
                            )
                          }
                          className="max-w-full truncate text-left text-base font-black hover:text-violet-300"
                        >
                          {profile.full_name ||
                            profile.username ||
                            "Nikelink member"}
                        </button>

                        {profile.username && (
                          <p className="mt-0.5 truncate text-xs text-white/35">
                            @{profile.username}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.country && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/50">
                              🌍{" "}
                              {profile.country}
                            </span>
                          )}

                          {profile.interests?.[0] && (
                            <span className="rounded-full border border-violet-500/15 bg-violet-500/[0.07] px-2.5 py-1 text-[10px] font-semibold text-violet-300">
                              ✦{" "}
                              {
                                profile
                                  .interests[0]
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BIO */}
                    {profile.bio && (
                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/45">
                        {profile.bio}
                      </p>
                    )}

                    {/* INTERESTS */}
                    {profile.interests &&
                      profile.interests
                        .length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-hidden">
                          {profile.interests
                            .slice(
                              0,
                              3
                            )
                            .map(
                              (
                                interest
                              ) => (
                                <span
                                  key={
                                    interest
                                  }
                                  className="rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/45"
                                >
                                  #
                                  {
                                    interest
                                  }
                                </span>
                              )
                            )}
                        </div>
                      )}

                    {/* ACTIONS */}
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          openProfile(
                            profile.id
                          )
                        }
                        className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-black text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        View profile
                      </button>
<div className="mb-2">
  <button
    disabled={
      actionId === `follow-${profile.id}`
    }
    onClick={() =>
      toggleFollow(profile.id)
    }
    className={`w-full rounded-xl py-3 text-sm font-black transition ${
      isFollowing(profile.id)
        ? "border border-violet-500/20 bg-violet-500/10 text-violet-300"
        : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
    }`}
  >
    {actionId ===
    `follow-${profile.id}`
      ? "..."
      : isFollowing(profile.id)
        ? "✓ Following"
        : "Follow"}
  </button>
</div>
                      {state ===
                        "connect" && (
                        <button
                          onClick={() =>
                            sendConnectionRequest(
                              profile.id
                            )
                          }
                          disabled={
                            actionId ===
                            profile.id
                          }
                          className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-xs font-black shadow-lg shadow-violet-600/20 transition hover:brightness-110 disabled:opacity-50"
                        >
                          {actionId ===
                          profile.id
                            ? "Sending..."
                            : "Connect"}
                        </button>
                      )}

                      {state ===
                        "sent" && (
                        <button
                          disabled
                          className="rounded-xl border border-violet-500/20 bg-violet-500/10 py-3 text-xs font-black text-violet-300"
                        >
                          ✓ Request sent
                        </button>
                      )}

                      {state ===
                        "incoming" && (
                        <button
                          onClick={() => {
                            const connection =
                              getConnection(
                                profile.id
                              );

                            if (
                              connection
                            ) {
                              acceptConnection(
                                connection
                              );
                            }
                          }}
                          disabled={
                            actionId ===
                            profile.id
                          }
                          className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-xs font-black disabled:opacity-50"
                        >
                          Accept request
                        </button>
                      )}

                      {state ===
                        "connected" && (
                        <button
                          onClick={() =>
                            router.push(
                              `/messages?user=${profile.id}`
                            )
                          }
                          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-xs font-black text-emerald-300 transition hover:bg-emerald-500/15"
                        >
                          ✓ Message
                        </button>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] px-6 py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-3xl">
              {search
                ? "⌕"
                : "🌍"}
            </div>

            <h3 className="mt-5 text-lg font-black">
              {search
                ? "No results found"
                : "Your global network is growing"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
              {search
                ? "Try another name, country or interest."
                : "As more people join Nikelink, you'll discover new people and communities here."}
            </p>

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-xs font-black"
              >
                Clear search
              </button>
            )}
          </div>
        )}
{/* WHAT'S HAPPENING ON NIKELINK */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-300/70">
                Nikelink Live
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                🔥 What's Happening
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Discover conversations from the Nikelink community.
              </p>
            </div>

            <button
              onClick={() => router.push("/feed")}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              View feed
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 text-xl">
                🌐
              </div>

              <div>
                <p className="text-sm font-black text-white">
                  The Nikelink community is growing
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Check the Feed to see the latest public conversations,
                  posts and community activity.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/feed")}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-xs font-black shadow-lg shadow-violet-600/20 transition hover:brightness-110"
            >
              Explore conversations →
            </button>
          </div>
        </section>
        <GlobalActivity />
        {/* GLOBAL FOOTER MESSAGE */}
        {showExplore &&
          profiles.length > 0 && (
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-gradient-to-r from-violet-500/[0.06] via-blue-500/[0.04] to-pink-500/[0.06] p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                ✨
              </div>

              <h3 className="mt-4 font-black">
                Explore. Connect. Belong.
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/35">
                Nikelink is built to help people
                discover one another, share ideas
                and build meaningful communities
                across the world.
              </p>
            </div>
          )}
      </section>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center justify-around">
          <button
            onClick={() =>
              router.push("/feed")
            }
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/35 transition hover:text-white"
          >
            <span className="text-xl">
              ⌂
            </span>

            <span className="text-[10px] font-bold">
              Home
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/discover")
            }
            className="flex flex-col items-center gap-1 px-4 py-1 text-violet-400"
          >
            <span className="text-xl">
              ◉
            </span>

            <span className="text-[10px] font-bold">
              Discover
            </span>
          </button>

          <button
            onClick={() =>
              router.push(
                "/communities"
              )
            }
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/35 transition hover:text-white"
          >
            <span className="text-xl">
              ◈
            </span>

            <span className="text-[10px] font-bold">
              Community
            </span>
          </button>

          <button
            onClick={() =>
              router.push(
                "/messages"
              )
            }
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/35 transition hover:text-white"
          >
            <span className="text-xl">
              ◌
            </span>

            <span className="text-[10px] font-bold">
              Messages
            </span>
          </button>

          <button
            onClick={() =>
              router.push(
                "/profile"
              )
            }
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/35 transition hover:text-white"
          >
            <span className="text-xl">
              ◉
            </span>

            <span className="text-[10px] font-bold">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
}
