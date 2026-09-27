"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
};

type BlockedUser = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  profile: Profile | null;
};

export default function BlockedUsersPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  async function loadBlockedUsers() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data: blocked, error: blockedError } = await supabase
      .from("blocked_users")
      .select("id, blocker_id, blocked_id, created_at")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (blockedError) {
      console.error(blockedError);
      setMessage(blockedError.message);
      setLoading(false);
      return;
    }

    if (!blocked || blocked.length === 0) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }

    const blockedIds = blocked.map((item) => item.blocked_id);

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username, country, bio")
      .in("id", blockedIds);

    if (profileError) {
      console.error(profileError);
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    const profileMap = new Map<string, Profile>();

    (profiles || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    const combined: BlockedUser[] = blocked.map((item) => ({
      ...item,
      profile: profileMap.get(item.blocked_id) || null,
    }));

    setBlockedUsers(combined);
    setLoading(false);
  }

  async function unblockUser(blockedId: string) {
    if (!userId) return;

    setUnblockingId(blockedId);
    setMessage("");

    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", blockedId);

    if (error) {
      console.error(error);
      setMessage(error.message);
      setUnblockingId(null);
      return;
    }

    setBlockedUsers((current) =>
      current.filter((item) => item.blocked_id !== blockedId)
    );

    setMessage("User unblocked successfully.");
    setUnblockingId(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <p className="text-sm text-white/50">
            Loading blocked users...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-10 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050816]/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button
            onClick={() => router.push("/settings")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xl text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Back to settings"
          >
            ←
          </button>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
              Nikelink
            </p>

            <h1 className="text-xl font-black">
              Blocked users
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-3xl px-5 py-7">
        {/* Intro */}
        <div className="mb-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 via-blue-600/20 to-pink-500/20 text-2xl ring-1 ring-white/10">
            🚫
          </div>

          <h2 className="text-2xl font-black">
            Manage blocked users
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/45">
            People you have blocked will appear here. You can unblock
            someone whenever you want.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-white/60">
            {message}
          </div>
        )}

        {/* Empty state */}
        {blockedUsers.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] text-3xl">
              🛡️
            </div>

            <h3 className="text-lg font-bold">
              No blocked users
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
              You haven't blocked anyone yet. People you block will be
              listed here.
            </p>

            <button
              onClick={() => router.push("/discover")}
              className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold shadow-lg shadow-violet-900/20 transition hover:opacity-90"
            >
              Discover people
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {blockedUsers.map((item) => {
              const person = item.profile;

              const initials =
                person?.full_name?.trim().charAt(0).toUpperCase() ||
                person?.username?.trim().charAt(0).toUpperCase() ||
                "?";

              const isUnblocking = unblockingId === item.blocked_id;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500 text-xl font-black shadow-lg">
                      {initials}
                    </div>

                    {/* User information */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">
                        {person?.full_name || "Nikelink User"}
                      </h3>

                      {person?.username && (
                        <p className="mt-1 truncate text-sm text-violet-400">
                          @{person.username}
                        </p>
                      )}

                      {person?.country && (
                        <p className="mt-1 text-xs text-white/40">
                          🌍 {person.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {person?.bio && (
                    <p className="mt-4 rounded-2xl bg-white/[0.025] p-3 text-sm leading-6 text-white/45">
                      {person.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/profile?user=${item.blocked_id}`
                        )
                      }
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      View profile
                    </button>

                    <button
                      onClick={() => unblockUser(item.blocked_id)}
                      disabled={isUnblocking}
                      className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isUnblocking ? "Unblocking..." : "Unblock"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-4">
          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center justify-center gap-1 text-white/50 transition hover:text-white"
          >
            <span className="text-xl">⌂</span>
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="flex flex-col items-center justify-center gap-1 text-white/50 transition hover:text-white"
          >
            <span className="text-xl">◎</span>
            <span className="text-[10px]">Discover</span>
          </button>

          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center justify-center gap-1 text-white/50 transition hover:text-white"
          >
            <span className="text-xl">＋</span>
            <span className="text-[10px]">Create</span>
          </button>

          <button
            onClick={() => router.push("/settings")}
            className="flex flex-col items-center justify-center gap-1 text-violet-400 transition hover:text-violet-300"
          >
            <span className="text-xl">⚙</span>
            <span className="text-[10px]">Settings</span>
          </button>
        </div>
      </nav>

      {/* Sign out */}
      <div className="mx-auto max-w-3xl px-5 pb-24">
        <button
          onClick={handleSignOut}
          className="mt-8 w-full rounded-2xl border border-white/10 bg-white/[0.025] py-3.5 text-sm font-semibold text-white/45 transition hover:bg-white/[0.06] hover:text-white"
        >
          Sign out
        </button>
      </div>
    </main>
  );
  }
