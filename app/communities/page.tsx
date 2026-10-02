"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
};

type CommunityMember = {
  id: string;
  community_id: string;
  user_id: string;
  role?: string | null;
  created_at?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url?: string | null;
};

const categories = [
  "All",
  "Technology",
  "Business",
  "Education",
  "Music",
  "Gaming",
  "Sports",
  "Creators",
  "Lifestyle",
  "Travel",
];

export default function CommunitiesPage() {
  const router = useRouter();

  const [communities, setCommunities] =
    useState<Community[]>([]);

  const [joinedCommunities, setJoinedCommunities] =
    useState<string[]>([]);

  const [memberCounts, setMemberCounts] =
    useState<Record<string, number>>({});

  const [members, setMembers] =
    useState<CommunityMember[]>([]);

  const [profiles, setProfiles] =
    useState<Record<string, Profile>>({});

  const [userId, setUserId] = useState("");

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [workingId, setWorkingId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [showCreate, setShowCreate] =
    useState(false);

  const [selectedCommunity, setSelectedCommunity] =
    useState<Community | null>(null);

  const [communityName, setCommunityName] =
    useState("");

  const [communityDescription, setCommunityDescription] =
    useState("");

  const [communityCategory, setCommunityCategory] =
    useState("Technology");

  const [isPrivate, setIsPrivate] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("nikelink-community-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadNotifications(
            (current) => current + 1
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadCommunities(
    showRefresh = false
  ) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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

    /*
     * LOAD COMMUNITIES
     */
    const {
      data: communityData,
      error: communityError,
    } = await supabase
      .from("communities")
      .select(
        "id, name, slug, description, category, is_private, created_by, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (communityError) {
      console.error(
        "Community loading error:",
        communityError
      );

      setErrorMessage(
        "We couldn't load communities right now."
      );
    } else {
      setCommunities(
        (communityData || []) as Community[]
      );
    }

    /*
     * LOAD MY MEMBERSHIPS
     */
    const {
      data: myMemberships,
      error: membershipError,
    } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);

    if (membershipError) {
      console.error(
        "Membership loading error:",
        membershipError
      );
    } else {
      setJoinedCommunities(
        (myMemberships || []).map(
          (item) => item.community_id
        )
      );
    }

    /*
     * LOAD ALL MEMBERS
     */
    const {
      data: allMembers,
      error: allMembersError,
    } = await supabase
      .from("community_members")
      .select(
        "id, community_id, user_id, role, created_at"
      );

    if (allMembersError) {
      console.error(
        "All members loading error:",
        allMembersError
      );
    } else {
      const memberRows =
        (allMembers || []) as CommunityMember[];

      setMembers(memberRows);

      const counts: Record<string, number> = {};

      memberRows.forEach((member) => {
        counts[member.community_id] =
          (counts[member.community_id] || 0) + 1;
      });

      setMemberCounts(counts);

      /*
       * LOAD MEMBER PROFILES
       */
      const uniqueUserIds = Array.from(
        new Set(
          memberRows.map(
            (member) => member.user_id
          )
        )
      );

      if (uniqueUserIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, username, avatar_url"
          )
          .in("id", uniqueUserIds);

        if (!profileError && profileData) {
          const profileMap: Record<
            string,
            Profile
          > = {};

          (
            profileData as Profile[]
          ).forEach((profile) => {
            profileMap[profile.id] = profile;
          });

          setProfiles(profileMap);
        }
      }
    }

    /*
     * LOAD UNREAD NOTIFICATIONS
     */
    const {
      count,
      error: notificationError,
    } = await supabase
      .from("notification")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!notificationError) {
      setUnreadNotifications(count || 0);
    }

    setLoading(false);
    setRefreshing(false);
  }

  function getMemberCount(
    communityId: string
  ) {
    return memberCounts[communityId] || 0;
  }

  function isJoined(
    communityId: string
  ) {
    return joinedCommunities.includes(
      communityId
    );
  }

  function getCommunityMembers(
    communityId: string
  ) {
    return members.filter(
      (member) =>
        member.community_id === communityId
    );
  }

  function getCommunityGradient(
    index: number
  ) {
    const gradients = [
      "from-blue-600/40 via-violet-600/30 to-cyan-500/10",
      "from-violet-600/40 via-pink-600/25 to-blue-500/10",
      "from-cyan-600/30 via-blue-600/30 to-violet-600/20",
      "from-fuchsia-600/30 via-violet-600/30 to-blue-600/20",
      "from-indigo-600/40 via-blue-600/25 to-pink-500/10",
      "from-blue-500/30 via-cyan-500/20 to-violet-600/30",
    ];

    return gradients[
      index % gradients.length
    ];
  }

  function getCommunityIcon(
    categoryName: string | null
  ) {
    switch (categoryName) {
      case "Technology":
        return "◉";

      case "Business":
        return "◆";

      case "Education":
        return "◇";

      case "Music":
        return "♫";

      case "Gaming":
        return "◈";

      case "Sports":
        return "✦";

      case "Creators":
        return "✧";

      case "Lifestyle":
        return "○";

      case "Travel":
        return "⌁";

      default:
        return "◈";
    }
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
          parts[
            parts.length - 1
          ].charAt(0)
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

  async function handleJoinLeave(
    communityId: string
  ) {
    if (!userId || workingId) {
      return;
    }

    setWorkingId(communityId);
    setErrorMessage("");
    setSuccessMessage("");

    const currentlyJoined =
      isJoined(communityId);

    if (currentlyJoined) {
      /*
       * LEAVE COMMUNITY
       */
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq(
          "community_id",
          communityId
        )
        .eq("user_id", userId);

      if (error) {
        console.error(
          "Leave community error:",
          error
        );

        setErrorMessage(
          error.message
        );

        setWorkingId("");
        return;
      }

      setJoinedCommunities(
        (current) =>
          current.filter(
            (id) =>
              id !== communityId
          )
      );

      setMemberCounts(
        (current) => ({
          ...current,
          [communityId]: Math.max(
            0,
            (current[communityId] ||
              0) - 1
          ),
        })
      );

      setMembers(
        (current) =>
          current.filter(
            (member) =>
              !(
                member.community_id ===
                  communityId &&
                member.user_id ===
                  userId
              )
          )
      );

      setSuccessMessage(
        "You left the community."
      );
    } else {
      /*
       * JOIN COMMUNITY
       */
      const { data, error } =
        await supabase
          .from("community_members")
          .insert({
            community_id:
              communityId,
            user_id: userId,
            role: "member",
          })
          .select()
          .single();

      if (error) {
        console.error(
          "Join community error:",
          error
        );

        setErrorMessage(
          error.message
        );

        setWorkingId("");
        return;
      }

      setJoinedCommunities(
        (current) => [
          ...current,
          communityId,
        ]
      );

      setMemberCounts(
        (current) => ({
          ...current,
          [communityId]:
            (current[communityId] ||
              0) + 1,
        })
      );

      if (data) {
        setMembers(
          (current) => [
            ...current,
            data as CommunityMember,
          ]
        );
      }

      setSuccessMessage(
        "You joined the community."
      );
    }

    setWorkingId("");

    setTimeout(() => {
      setSuccessMessage("");
    }, 2200);
  }

  function createSlug(
    value: string
  ) {
    return value
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .concat(
        "-",
        Date.now()
          .toString()
          .slice(-6)
      );
  }

  async function handleCreateCommunity(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !userId ||
      !communityName.trim()
    ) {
      return;
    }

    setCreating(true);
    setErrorMessage("");
    setSuccessMessage("");

    const name =
      communityName.trim();

    const description =
      communityDescription.trim();

    const slug =
      createSlug(name);

    /*
     * CREATE COMMUNITY
     */
    const {
      data: community,
      error,
    } = await supabase
      .from("communities")
      .insert({
        name,
        slug,
        description:
          description ||
          "A community for people who share common interests.",
        category:
          communityCategory,
        is_private:
          isPrivate,
        created_by:
          userId,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Create community error:",
        error
      );

      setErrorMessage(
        error.message
      );

      setCreating(false);
      return;
    }

    /*
     * ADD CREATOR AS ADMIN
     */
    if (community) {
      const {
        data: membership,
        error: memberError,
      } = await supabase
        .from("community_members")
        .insert({
          community_id:
            community.id,
          user_id:
            userId,
          role: "admin",
        })
        .select()
        .single();

      if (memberError) {
        console.error(
          "Creator membership error:",
          memberError
        );

        /*
         * The community exists even if
         * membership insertion fails.
         */
      }

      setCommunities(
        (current) => [
          community as Community,
          ...current,
        ]
      );

      setJoinedCommunities(
        (current) => [
          ...current,
          community.id,
        ]
      );

      setMemberCounts(
        (current) => ({
          ...current,
          [community.id]: 1,
        })
      );

      if (membership) {
        setMembers(
          (current) => [
            ...current,
            membership as CommunityMember,
          ]
        );
      }

      setShowCreate(false);

      setCommunityName("");
      setCommunityDescription("");
      setCommunityCategory(
        "Technology"
      );
      setIsPrivate(false);

      setSuccessMessage(
        "Community created successfully."
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    }

    setCreating(false);
  }

  const filteredCommunities =
    useMemo(() => {
      const term =
        search
          .toLowerCase()
          .trim();

      return communities.filter(
        (community) => {
          const matchesCategory =
            category === "All" ||
            community.category ===
              category;

          if (!matchesCategory) {
            return false;
          }

          if (!term) {
            return true;
          }

          const matchesName =
            community.name
              .toLowerCase()
              .includes(term);

          const matchesDescription =
            community.description
              ?.toLowerCase()
              .includes(term);

          const matchesCategoryText =
            community.category
              ?.toLowerCase()
              .includes(term);

          return Boolean(
            matchesName ||
              matchesDescription ||
              matchesCategoryText
          );
        }
      );
    }, [
      communities,
      search,
      category,
    ]);

  const joinedList =
    useMemo(() => {
      return communities.filter(
        (community) =>
          joinedCommunities.includes(
            community.id
          )
      );
    }, [
      communities,
      joinedCommunities,
    ]);

  const selectedMembers =
    selectedCommunity
      ? getCommunityMembers(
          selectedCommunity.id
        )
      : [];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded bg-white/10" />

            <div className="mt-4 h-10 w-48 rounded bg-white/10" />

            <div className="mt-3 h-4 w-72 max-w-full rounded bg-white/10" />

            <div className="mt-8 h-14 rounded-2xl bg-white/5" />

            <div className="mt-5 flex gap-2">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-9 w-24 rounded-full bg-white/10"
                  />
                )
              )}
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(
                (item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]"
                  >
                    <div className="h-36 bg-white/10" />

                    <div className="p-5">
                      <div className="h-5 w-40 rounded bg-white/10" />

                      <div className="mt-4 h-4 w-full rounded bg-white/10" />

                      <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />

                      <div className="mt-6 h-11 rounded-xl bg-white/10" />
                    </div>
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
    <main className="min-h-screen bg-[#050816] pb-24 text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute -right-40 top-72 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-500/5 blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 px-5 py-4 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            {/* BRAND */}
            <button
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 font-black shadow-lg shadow-blue-500/20">
                N
              </div>

              <span className="text-xl font-black tracking-tight">
                Nikelink
              </span>
            </button>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  router.push(
                    "/notifications"
                  )
                }
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
              >
                🔔

                {unreadNotifications >
                  0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white shadow-lg shadow-pink-500/30">
                    {unreadNotifications >
                    99
                      ? "99+"
                      : unreadNotifications}
                  </span>
                )}
              </button>

              <button
                onClick={() =>
                  loadCommunities(
                    true
                  )
                }
                disabled={
                  refreshing
                }
                aria-label="Refresh communities"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10 disabled:opacity-40 sm:flex"
              >
                ↻
              </button>

              <button
                onClick={() =>
                  router.push(
                    "/dashboard"
                  )
                }
                className="hidden rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white sm:block"
              >
                Dashboard
              </button>

              <button
                onClick={() =>
                  setShowCreate(true)
                }
                className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2 text-sm font-bold shadow-lg shadow-blue-500/20 transition hover:opacity-90"
              >
                + Create
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-600/20 via-violet-600/10 to-pink-600/5 p-6 sm:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" />

              Nikelink Communities
            </div>

            <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Find your people.
              <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Build something together.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-lg">
              Discover communities around
              technology, business, education,
              creativity, gaming, music and the
              things that matter to you.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xl font-black">
                  {communities.length}
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                  Communities
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xl font-black">
                  {
                    Object.values(
                      memberCounts
                    ).reduce(
                      (
                        total,
                        count
                      ) =>
                        total +
                        count,
                      0
                    )
                  }
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                  Members
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xl font-black">
                  {joinedList.length}
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                  Joined
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUCCESS */}
        {successMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
            ✓ {successMessage}
          </div>
        )}

        {/* ERROR */}
        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}

            <button
              onClick={() =>
                loadCommunities(
                  true
                )
              }
              className="ml-2 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* MY COMMUNITIES */}
        {joinedList.length > 0 &&
          !search &&
          category === "All" && (
            <div className="mt-9">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">
                    Your spaces
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Your communities
                  </h2>
                </div>

                <span className="text-xs text-white/30">
                  {joinedList.length} joined
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {joinedList
                  .slice(0, 6)
                  .map(
                    (
                      community
                    ) => (
                      <button
                        key={
                          community.id
                        }
                        onClick={() =>
                          setSelectedCommunity(
                            community
                          )
                        }
                        className="group min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-blue-400/20 hover:bg-white/[0.06]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-lg font-black">
                            {getCommunityIcon(
                              community.category
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {
                                community.name
                              }
                            </p>

                            <p className="mt-1 text-[10px] text-white/35">
                              {
                                getMemberCount(
                                  community.id
                                )
                              }{" "}
                              members
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  )}
              </div>
            </div>
          )}

        {/* SEARCH */}
        <div className="mt-9">
          <div className="relative">
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-white/30">
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search communities..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-14 pr-12 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-400/40"
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/35 transition hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {categories.map(
            (item) => (
              <button
                key={item}
                onClick={() =>
                  setCategory(item)
                }
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
                  category === item
                    ? "border-blue-400/30 bg-blue-500/15 text-blue-300 shadow-lg shadow-blue-500/10"
                    : "border-white/10 bg-white/[0.03] text-white/45 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        {/* RESULTS HEADER */}
        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25">
              Explore
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              {search ||
              category !== "All"
                ? "Search results"
                : "Communities for you"}
            </h2>

            <p className="mt-1 text-sm text-white/35">
              {filteredCommunities.length}{" "}
              {filteredCommunities.length ===
              1
                ? "community"
                : "communities"}{" "}
              found
            </p>
          </div>

          {(search ||
            category !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-blue-300 transition hover:bg-white/10"
            >
              Clear
            </button>
          )}
        </div>

        {/* COMMUNITY GRID */}
        {filteredCommunities.length ===
        0 ? (
          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 text-3xl">
              ◈
            </div>

            <h3 className="mt-5 text-xl font-black">
              No communities found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Try another search or create
              a new community for people who
              share your interests.
            </p>

            <button
              onClick={() =>
                setShowCreate(true)
              }
              className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-bold shadow-lg shadow-blue-500/20"
            >
              Create a community
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCommunities.map(
              (
                community,
                index
              ) => {
                const joined =
                  isJoined(
                    community.id
                  );

                const count =
                  getMemberCount(
                    community.id
                  );

                const busy =
                  workingId ===
                  community.id;

                return (
                  <article
                    key={
                      community.id
                    }
                    className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[0.055]"
                  >
                    {/* COVER */}
                    <button
                      onClick={() =>
                        setSelectedCommunity(
                          community
                        )
                      }
                      className={`relative block h-36 w-full overflow-hidden bg-gradient-to-br ${getCommunityGradient(
                        index
                      )} text-left`}
                    >
                      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

                      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

                      <div className="absolute left-5 top-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#080c20]/80 text-2xl font-black backdrop-blur">
                        {getCommunityIcon(
                          community.category
                        )}
                      </div>

                      <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold text-white/60 backdrop-blur">
                          {community.category ||
                            "Community"}
                        </span>

                        {community.is_private && (
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold text-white/60 backdrop-blur">
                            Private
                          </span>
                        )}
                      </div>
                    </button>

                    {/* INFORMATION */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() =>
                            setSelectedCommunity(
                              community
                            )
                          }
                          className="min-w-0 text-left"
                        >
                          <h3 className="truncate text-lg font-black transition group-hover:text-blue-300">
                            {
                              community.name
                            }
                          </h3>

                          <p className="mt-1 truncate text-xs text-white/30">
                            nikelink.com/
                            {community.slug}
                          </p>
                        </button>

                        {joined && (
                          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                            Joined
                          </span>
                        )}
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/40">
                        {community.description ||
                          "Connect with people who share your interests."}
                      </p>

                      <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-white/35">
                          <span>
                            👥
                          </span>

                          <span>
                            {count}{" "}
                            {count ===
                            1
                              ? "member"
                              : "members"}
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            setSelectedCommunity(
                              community
                            )
                          }
                          className="text-xs font-bold text-blue-300 transition hover:text-blue-200"
                        >
                          View →
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          disabled={busy}
                          onClick={() =>
                            handleJoinLeave(
                              community.id
                            )
                          }
                          className={`rounded-xl py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            joined
                              ? "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                              : "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/15 hover:opacity-90"
                          }`}
                        >
                          {busy
                            ? "..."
                            : joined
                            ? "Leave"
                            : "Join"}
                        </button>

                        <button
                          onClick={() =>
                            setSelectedCommunity(
                              community
                            )
                          }
                          className="rounded-xl border border-white/10 bg-white/[0.03] py-3 text-xs font-bold text-white/55 transition hover:bg-white/[0.07] hover:text-white"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* COMMUNITY DETAIL MODAL */}
      {selectedCommunity && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-5"
          onClick={() =>
            setSelectedCommunity(null)
          }
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#080c20] shadow-2xl sm:rounded-[2rem]"
          >
            {/* DETAIL COVER */}
            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-blue-600/30 via-violet-600/20 to-pink-500/10">
              <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

              <button
                onClick={() =>
                  setSelectedCommunity(
                    null
                  )
                }
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-xl text-white/60 backdrop-blur transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>

              <div className="absolute bottom-5 left-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-[#080c20]/80 text-3xl font-black backdrop-blur">
                {getCommunityIcon(
                  selectedCommunity.category
                )}
              </div>
            </div>

            {/* DETAIL CONTENT */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-black">
                    {
                      selectedCommunity.name
                    }
                  </h2>

                  <p className="mt-1 text-xs text-blue-300">
                    {
                      selectedCommunity.category ||
                      "Community"
                    }
                  </p>
                </div>

                {selectedCommunity.is_private && (
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/50">
                    Private
                  </span>
                )}
              </div>

              <p className="mt-5 text-sm leading-7 text-white/50">
                {selectedCommunity.description ||
                  "Connect with people who share your interests."}
              </p>

              {/* STATS */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xl font-black">
                    {getMemberCount(
                      selectedCommunity.id
                    )}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                    Members
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xl font-black">
                    {selectedCommunity.is_private
                      ? "Private"
                      : "Public"}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                    Community
                  </p>
                </div>
              </div>

              {/* MEMBER PREVIEW */}
              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black">
                      Members
                    </h3>

                    <p className="mt-1 text-xs text-white/30">
                      People in this community
                    </p>
                  </div>

                  <span className="text-xs text-white/30">
                    {
                      selectedMembers.length
                    }
                  </span>
                </div>

                {selectedMembers.length ===
                0 ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                    <p className="text-sm text-white/40">
                      No members yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {selectedMembers
                      .slice(0, 8)
                      .map(
                        (
                          member
                        ) => {
                          const profile =
                            profiles[
                              member.user_id
                            ];

                          if (
                            !profile
                          ) {
                            return (
                              <div
                                key={
                                  member.id
                                }
                                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-black">
                                  N
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold">
                                    Nikelink
                                    user
                                  </p>

                                  <p className="text-[10px] text-white/30">
                                    Member
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={
                                member.id
                              }
                              onClick={() =>
                                router.push(
                                  `/profile?user=${profile.id}`
                                )
                              }
                              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
                            >
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                                {profile.avatar_url ? (
                                  <img
                                    src={
                                      profile.avatar_url
                                    }
                                    alt={
                                      profile.full_name ||
                                      profile.username ||
                                      "User"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-black">
                                    {getInitials(
                                      profile
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">
                                  {profile.full_name ||
                                    profile.username ||
                                    "Nikelink user"}
                                </p>

                                {profile.username && (
                                  <p className="truncate text-[10px] text-white/30">
                                    @
                                    {
                                      profile.username
                                    }
                                  </p>
                                )}
                              </div>

                              {member.role ===
                                "admin" && (
                                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[9px] font-black uppercase text-blue-300">
                                  Admin
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}

                    {selectedMembers.length >
                      8 && (
                      <p className="pt-2 text-center text-xs text-white/25">
                        +
                        {selectedMembers.length -
                          8}{" "}
                        more members
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* COMMUNITY ACTIONS */}
              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  disabled={
                    workingId ===
                    selectedCommunity.id
                  }
                  onClick={() =>
                    handleJoinLeave(
                      selectedCommunity.id
                    )
                  }
                  className={`rounded-xl py-3.5 text-sm font-black transition disabled:opacity-50 ${
                    isJoined(
                      selectedCommunity.id
                    )
                      ? "border border-white/10 bg-white/5 text-white/60"
                      : "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/20"
                  }`}
                >
                  {workingId ===
                  selectedCommunity.id
                    ? "..."
                    : isJoined(
                        selectedCommunity.id
                      )
                    ? "Leave"
                    : "Join community"}
                </button>

                <button
                  onClick={() => {
                    setSelectedCommunity(
                      null
                    );

                    router.push(
                      `/communities/${selectedCommunity.slug}`
                    );
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] py-3.5 text-sm font-bold text-white/60 transition hover:bg-white/[0.07] hover:text-white"
                >
                  Open community
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COMMUNITY MODAL */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-5"
          onClick={() =>
            setShowCreate(false)
          }
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#080c20] shadow-2xl sm:rounded-[2rem]"
          >
            {/* MODAL HEADER */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">
                    New community
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Create your space
                  </h2>

                  <p className="mt-2 text-sm text-white/35">
                    Build a place where people
                    can connect around a shared
                    interest.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowCreate(false)
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-xl text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>

            {/* FORM */}
            <form
              onSubmit={
                handleCreateCommunity
              }
              className="space-y-5 p-6"
            >
              {/* NAME */}
              <div>
                <label className="mb-2 block text-xs font-bold text-white/50">
                  Community name
                </label>

                <input
                  value={
                    communityName
                  }
                  onChange={(event) =>
                    setCommunityName(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Global Tech Builders"
                  maxLength={80}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-400/40"
                  required
                />

                <p className="mt-2 text-right text-[10px] text-white/20">
                  {
                    communityName.length
                  }
                  /80
                </p>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-xs font-bold text-white/50">
                  Description
                </label>

                <textarea
                  value={
                    communityDescription
                  }
                  onChange={(event) =>
                    setCommunityDescription(
                      event.target
                        .value
                    )
                  }
                  placeholder="What is this community about?"
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-blue-400/40"
                />

                <p className="mt-2 text-right text-[10px] text-white/20">
                  {
                    communityDescription.length
                  }
                  /500
                </p>
              </div>

              {/* CATEGORY */}
              <div>
                <label className="mb-2 block text-xs font-bold text-white/50">
                  Category
                </label>

                <select
                  value={
                    communityCategory
                  }
                  onChange={(event) =>
                    setCommunityCategory(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b1028] px-4 py-3.5 text-sm text-white outline-none"
                >
                  {categories
                    .filter(
                      (item) =>
                        item !==
                        "All"
                    )
                    .map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {item}
                        </option>
                      )
                    )}
                </select>
              </div>

              {/* PRIVACY */}
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
                <input
                  type="checkbox"
                  checked={
                    isPrivate
                  }
                  onChange={(event) =>
                    setIsPrivate(
                      event.target
                        .checked
                    )
                  }
                  className="mt-1 h-4 w-4 accent-blue-500"
                />

                <div>
                  <p className="text-sm font-bold">
                    Private community
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Only approved members
                    should be able to join
                    this space.
                  </p>
                </div>
              </label>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={
                  creating ||
                  !communityName.trim()
                }
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3.5 text-sm font-black shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creating
                  ? "Creating..."
                  : "Create community"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 backdrop-blur-2xl md:hidden">
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-5">
          <MobileNavButton
            icon="⌂"
            label="Home"
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
          />

          <MobileNavButton
            icon="◎"
            label="Discover"
            onClick={() =>
              router.push(
                "/discover"
              )
            }
          />

          <MobileNavButton
            icon="◈"
            label="Community"
            active
            onClick={() => {}}
          />

          <MobileNavButton
            icon="◌"
            label="Messages"
            onClick={() =>
              router.push(
                "/messages"
              )
            }
          />

          <MobileNavButton
            icon="●"
            label="Profile"
            onClick={() =>
              router.push(
                "/profile"
              )
            }
          />
        </div>
      </nav>
    </main>
  );
}

function MobileNavButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition ${
        active
          ? "text-blue-400"
          : "text-white/45 hover:bg-white/5 hover:text-white"
      }`}
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
