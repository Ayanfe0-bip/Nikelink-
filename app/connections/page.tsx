"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
};

type ConnectionItem = Connection & {
  person: Profile | null;
};

export default function ConnectionsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
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

    const { data, error } = await supabase
      .from("connections")
      .select(
        "id, requester_id, receiver_id, status, created_at"
      )
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setConnections([]);
      setLoading(false);
      return;
    }

    const otherUserIds = data.map((connection) =>
      connection.requester_id === user.id
        ? connection.receiver_id
        : connection.requester_id
    );

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username, country, bio")
      .in("id", otherUserIds);

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

    const combined: ConnectionItem[] = data.map((connection) => {
      const otherUserId =
        connection.requester_id === user.id
          ? connection.receiver_id
          : connection.requester_id;

      return {
        ...connection,
        person: profileMap.get(otherUserId) || null,
      };
    });

    setConnections(combined);
    setLoading(false);
  }

  async function removeConnection(connectionId: string) {
    setRemovingId(connectionId);
    setMessage("");

    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      console.error(error);
      setMessage(error.message);
      setRemovingId(null);
      return;
    }

    setConnections((current) =>
      current.filter((connection) => connection.id !== connectionId)
    );

    setMessage("Connection removed.");
    setRemovingId(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <p className="text-white/50">
          Loading your connections...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#050816]/95 px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
                Nikelink
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Connections
              </h1>
            </div>

            <button
              onClick={handleSignOut}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-3xl px-5 py-7">
        {message && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-white/60">
            {message}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold">
            Your network
          </h2>

          <p className="mt-1 text-sm text-white/45">
            People you're connected with on Nikelink.
          </p>
        </div>

        {connections.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-12 text-center shadow-xl">
            <div className="mb-4 text-4xl">
              🌐
            </div>

            <h3 className="text-lg font-bold">
              No connections yet
            </h3>

            <p className="mt-2 text-sm text-white/45">
              Discover people and start building your network.
            </p>

            <button
              onClick={() => router.push("/discover")}
              className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-bold transition hover:opacity-90"
            >
              Discover people
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => {
              const person = connection.person;

              const initials =
                person?.full_name?.trim().charAt(0).toUpperCase() ||
                person?.username?.trim().charAt(0).toUpperCase() ||
                "?";

              const removing =
                removingId === connection.id;

              const profileId =
                connection.requester_id === userId
                  ? connection.receiver_id
                  : connection.requester_id;

              return (
                <article
                  key={connection.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl"
                >
                  <div className="flex gap-4">
                    {/* AVATAR */}
                    <button
                      onClick={() =>
                        router.push(
                          `/profile?user=${profileId}`
                        )
                      }
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500 text-xl font-black shadow-lg"
                    >
                      {initials}
                    </button>

                    {/* PROFILE */}
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() =>
                          router.push(
                            `/profile?user=${profileId}`
                          )
                        }
                        className="text-left"
                      >
                        <h3 className="font-bold">
                          {person?.full_name ||
                            "Nikelink User"}
                        </h3>

                        {person?.username && (
                          <p className="mt-1 text-sm text-violet-400">
                            @{person.username}
                          </p>
                        )}
                      </button>

                      {person?.country && (
                        <p className="mt-1 text-xs text-white/45">
                          🌍 {person.country}
                        </p>
                      )}

                      {person?.bio && (
                        <p className="mt-2 line-clamp-2 text-sm text-white/50">
                          {person.bio}
                        </p>
                      )}
                    </div>

                    {/* CONNECTED */}
                    <div className="hidden shrink-0 sm:block">
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Connected
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/profile?user=${profileId}`
                        )
                      }
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      View profile
                    </button>

                    <button
                      onClick={() =>
                        removeConnection(connection.id)
                      }
                      disabled={removing}
                      className="rounded-xl border border-red-400/20 bg-red-400/5 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-40"
                    >
                      {removing
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-5">
          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center justify-center gap-1 text-white/50"
          >
            <span className="text-xl">⌂</span>
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="flex flex-col items-center justify-center gap-1 text-white/50"
          >
            <span className="text-xl">◎</span>
            <span className="text-[10px]">Discover</span>
          </button>

          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center justify-center gap-1 text-white/50"
          >
            <span className="text-xl">＋</span>
            <span className="text-[10px]">Create</span>
          </button>

          <button
            onClick={() => router.push("/notifications")}
            className="flex flex-col items-center justify-center gap-1 text-white/50"
          >
            <span className="text-xl">♢</span>
            <span className="text-[10px]">Alerts</span>
          </button>

          <button
            onClick={() => router.push("/connections")}
            className="flex flex-col items-center justify-center gap-1 text-violet-400"
          >
            <span className="text-xl">◉</span>
            <span className="text-[10px]">Network</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
