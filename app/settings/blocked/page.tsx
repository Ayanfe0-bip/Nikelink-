"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type BlockedUser = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    username: string | null;
    country: string | null;
  } | null;
};

export default function BlockedUsersPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  async function loadBlockedUsers() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data: blocks, error: blockError } = await supabase
      .from("blocked_users")
      .select("id, blocker_id, blocked_id, created_at")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (blockError) {
      console.error(blockError);
      setMessage(blockError.message);
      setLoading(false);
      return;
    }

    if (!blocks || blocks.length === 0) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }

    const blockedIds = blocks.map((block) => block.blocked_id);

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username, country")
      .in("id", blockedIds);

    if (profileError) {
      console.error(profileError);
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    const profileMap = new Map<string, BlockedUser["profile"]>();

    (profiles || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    const combined = blocks.map((block) => ({
      ...block,
      profile: profileMap.get(block.blocked_id) || null,
    }));

    setBlockedUsers(combined);
    setLoading(false);
  }

  async function unblockUser(block: BlockedUser) {
    setRemovingId(block.blocked_id);
    setMessage("");

    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("id", block.id)
      .eq("blocker_id", userId);

    if (error) {
      console.error(error);
      setMessage(error.message);
      setRemovingId(null);
      return;
    }

    setBlockedUsers((current) =>
      current.filter((item) => item.id !== block.id)
    );

    setMessage("User unblocked.");
    setRemovingId(null);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  function getInitials(profile: BlockedUser["profile"]) {
    return (
      profile?.full_name?.trim().charAt(0).toUpperCase() ||
      profile?.username?.trim().charAt(0).toUpperCase() ||
      "?"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black">
            N
          </div>

          <p className="text-sm text-white/40">
            Loading blocked users...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-4 px-4">
          <button
            onClick={() => router.push("/settings")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ←
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
              Privacy
            </p>

            <h1 className="text-xl font-black">
              Blocked users
            </h1>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-2xl px-4 py-7 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-black">
            People you've blocked
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/40">
            Blocked users can't interact with you through Nikelink.
            You can unblock them at any time.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-white/60">
            {message}
          </div>
        )}

        {blockedUsers.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-3xl">
              🛡️
            </div>

            <h3 className="text-lg font-bold">
              No blocked users
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/40">
              People you block will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((blocked) => {
              const profile = blocked.profile;
              const removing = removingId === blocked.blocked_id;

              return (
                <article
                  key={blocked.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500 text-lg font-black">
                      {getInitials(profile)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {profile?.full_name ||
                          profile?.username ||
                          "Nikelink User"}
                      </p>

                      {profile?.username && (
                        <p className="mt-1 text-sm text-violet-400">
                          @{profile.username}
                        </p>
                      )}

                      {profile?.country && (
                        <p className="mt-1 text-xs text-white/35">
                          🌍 {profile.country}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => unblockUser(blocked)}
                      disabled={removing}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                    >
                      {removing ? "..." : "Unblock"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
