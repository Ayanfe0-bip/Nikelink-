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

  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>(
    {}
  );

  const [userId, setUserId] = useState("");
  const [unreadNotifications, setUnreadNotifications] =
  useState(0);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [showCreate, setShowCreate] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [communityCategory, setCommunityCategory] = useState("Technology");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);
useEffect(() => {
  if (!userId) return;

  const loadUnreadNotifications = async () => {
    const { count, error } = await supabase
      .from("notification")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      setUnreadNotifications(count || 0);
    }
  };

  loadUnreadNotifications();
}, [userId]);
  async function loadCommunities() {
    setLoading(true);

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    const user = userData.user;

    setUserId(user.id);

    const { data, error } = await supabase
      .from("communities")
      .select(
        "id, name, slug, description, category, is_private, created_by, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Community loading error:", error);
      setLoading(false);
      return;
    }

    setCommunities(data ?? []);

    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);

    if (memberships) {
      setJoinedCommunities(
        memberships.map((item) => item.community_id)
      );
    }

    const { data: members } = await supabase
      .from("community_members")
      .select("community_id");

    if (members) {
      const counts: Record<string, number> = {};

      members.forEach((member) => {
        counts[member.community_id] =
          (counts[member.community_id] || 0) + 1;
      });

      setMemberCounts(counts);
    }

    setLoading(false);
  }

  async function handleJoinLeave(communityId: string) {
    if (!userId) return;

    setWorkingId(communityId);

    const joined = joinedCommunities.includes(communityId);

    if (joined) {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", userId);

      if (!error) {
        setJoinedCommunities((current) =>
          current.filter((id) => id !== communityId)
        );

        setMemberCounts((current) => ({
          ...current,
          [communityId]: Math.max(
            0,
            (current[communityId] || 1) - 1
          ),
        }));
      }
    } else {
      const { error } = await supabase
        .from("community_members")
        .insert({
          community_id: communityId,
          user_id: userId,
          role: "member",
        });

      if (!error) {
        setJoinedCommunities((current) => [
          ...current,
          communityId,
        ]);

        setMemberCounts((current) => ({
          ...current,
          [communityId]:
            (current[communityId] || 0) + 1,
        }));
      }
    }

    setWorkingId("");
  }

  async function handleCreateCommunity(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!userId || !communityName.trim()) return;

    setCreating(true);

    const slug =
      communityName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 7);

    const { data, error } = await supabase
      .from("communities")
      .insert({
        name: communityName.trim(),
        slug,
        description:
          communityDescription.trim() ||
          "A new community on Nikelink.",
        category: communityCategory,
        is_private: isPrivate,
        created_by: userId,
      })
      .select()
      .single();

    if (!error && data) {
      await supabase.from("community_members").insert({
        community_id: data.id,
        user_id: userId,
        role: "admin",
      });

      setCommunities((current) => [
        data,
        ...current,
      ]);

      setJoinedCommunities((current) => [
        ...current,
        data.id,
      ]);

      setMemberCounts((current) => ({
        ...current,
        [data.id]: 1,
      }));

      setCommunityName("");
      setCommunityDescription("");
      setCommunityCategory("Technology");
      setIsPrivate(false);
      setShowCreate(false);
    } else {
      console.error("Community creation error:", error);
    }

    setCreating(false);
  }

  const filteredCommunities = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return communities.filter((community) => {
      const matchesSearch =
        !searchValue ||
        community.name.toLowerCase().includes(searchValue) ||
        (community.description ?? "")
          .toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        category === "All" ||
        community.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [communities, search, category]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-blue-500/40 to-violet-500/40" />
          <p className="text-sm text-white/40">
            Loading communities...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white">

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

          <div className="flex items-center gap-2">

  <button
    onClick={() => router.push("/notifications")}
    aria-label="Notifications"
    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
  >
    🔔

    {unreadNotifications > 0 && (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white shadow-lg shadow-pink-500/30">
        {unreadNotifications > 99
          ? "99+"
          : unreadNotifications}
      </span>
    )}
  </button>

  <button
    onClick={() => router.push("/dashboard")}
    className="hidden rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white sm:block"
  >
    Dashboard
  </button>

  <button
    onClick={() => setShowCreate(true)}
    className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2 text-sm font-bold shadow-lg shadow-blue-500/20"
  >
    + Create
  </button>

          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-600/20 via-violet-600/10 to-transparent p-6 sm:p-10">

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Nikelink Communities
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Find your people.
              <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Build something together.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
              Discover communities around technology, business,
              education, creativity, gaming, music and the things
              that matter to you.
            </p>

          </div>
        </div>

        <div className="mt-8 relative">

          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-white/30">
            ⌕
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search communities..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-14 pr-5 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-400/40"
          />

        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">

          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
                category === item
                  ? "border-blue-400/30 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/[0.03] text-white/45 hover:bg-white/[0.06]"
              }`}
            >
              {item}
            </button>
          ))}

        </div>

        <div className="mt-10 flex items-end justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
              Explore
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Communities for you
            </h2>
          </div>

          <p className="hidden text-sm text-white/30 sm:block">
            {filteredCommunities.length} communities
          </p>

        </div>

        {filteredCommunities.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-14 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
              ◈
            </div>

            <h3 className="mt-5 text-xl font-bold">
              No communities found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Try another search or create a new community
              for people who share your interests.
            </p>

            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-bold"
            >
              Create a community
            </button>

          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

            {filteredCommunities.map((community) => {

              const joined =
                joinedCommunities.includes(
                  community.id
                );

              const count =
                memberCounts[community.id] || 0;

              return (
                <article
                  key={community.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[0.055]"
                >

                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-blue-600/30 via-violet-600/20 to-pink-500/10">

                    <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

                    <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

                    <div className="absolute left-6 top-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#080c20]/80 text-2xl font-black backdrop-blur">
                      {community.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    {community.is_private && (
                      <span className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold text-white/60 backdrop-blur">
                        Private
                      </span>
                    )}

                  </div>

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <h3 className="truncate text-lg font-black">
                          {community.name}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-blue-400">
                          {community.category ||
                            "Community"}
                        </p>

                      </div>

                      <span className="shrink-0 text-white/20">
                        ◈
                      </span>

                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/40">
                      {community.description ||
                        "Connect with people who share your interests."}
                    </p>

                    <div className="mt-5 flex items-center justify-between">

                      <div className="flex items-center gap-2 text-xs text-white/35">
                        <span>👥</span>

                        <span>
                          {count}{" "}
                          {count === 1
                            ? "member"
                            : "members"}
                        </span>
                      </div>

                      <button
                        disabled={
                          workingId === community.id
                        }
                        onClick={() =>
                          handleJoinLeave(
                            community.id
                          )
                        }
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                          joined
                            ? "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                            : "bg-gradient-to-r from-blue-500 to-violet-600 text-white"
                        }`}
                      >
                        {workingId === community.id
                          ? "..."
                          : joined
                          ? "Joined"
                          : "Join"}
                      </button>

                    </div>

                  </div>
                </article>
              );
            })}

          </div>
        )}

      </section>

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-md">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#080c20] shadow-2xl">

            <div className="border-b border-white/10 p-6">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                    New community
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Create your space
                  </h2>
                </div>

                <button
                  onClick={() => setShowCreate(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 hover:bg-white/10"
                >
                  ×
                </button>

              </div>

            </div>

            <form
              onSubmit={handleCreateCommunity}
              className="space-y-5 p-6"
            >

              <div>

                <label className="mb-2 block text-xs font-bold text-white/50">
                  Community name
                </label>

                <input
                  value={communityName}
                  onChange={(event) =>
                    setCommunityName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Global Tech Builders"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-400/40"
                  required
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-bold text-white/50">
                  Description
                </label>

                <textarea
                  value={communityDescription}
                  onChange={(event) =>
                    setCommunityDescription(
                      event.target.value
                    )
                  }
                  placeholder="What is this community about?"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-400/40"
                />

              </div>

              <div>

                <label className="mb-2 block text-xs font-bold text-white/50">
                  Category
                </label>

                <select
                  value={communityCategory}
                  onChange={(event) =>
                    setCommunityCategory(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b1028] px-4 py-3 text-sm text-white outline-none"
                >
                  {categories
                    .filter(
                      (item) => item !== "All"
                    )
                    .map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                </select>

              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">

                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) =>
                    setIsPrivate(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 accent-blue-500"
                />

                <div>
                     <p className="text-sm font-bold">
                    Private community
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    Only approved members can join.
                  </p>
                </div>

              </label>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3.5 text-sm font-bold disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create community"}
              </button>

            </form>

          </div>

        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl md:hidden">

        <div className="grid h-20 grid-cols-5">

          <MobileNavButton
            icon="⌂"
            label="Home"
            onClick={() =>
              router.push("/dashboard")
            }
          />

          <MobileNavButton
            icon="◎"
            label="Discover"
            onClick={() =>
              router.push("/discover")
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
              router.push("/messages")
            }
          />

          <MobileNavButton
            icon="●"
            label="Profile"
            onClick={() =>
              router.push("/profile")
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
          : "text-white/45 hover:text-white"
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
