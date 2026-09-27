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
};

type RequestItem = Connection & {
  requester: Profile | null;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("nikelink-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections",
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadRequests() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data: connections, error } = await supabase
      .from("connections")
      .select("id, requester_id, receiver_id, status, created_at")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!connections?.length) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const ids = connections.map((item) => item.requester_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, country")
      .in("id", ids);

    const profileMap = new Map<string, Profile>();

    (profiles || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    setRequests(
      connections.map((connection) => ({
        ...connection,
        requester: profileMap.get(connection.requester_id) || null,
      }))
    );

    setLoading(false);
  }

  async function respondToRequest(
    connectionId: string,
    status: "accepted" | "declined"
  ) {
    setProcessingId(connectionId);
    setMessage("");

    const { error } = await supabase
      .from("connections")
      .update({ status })
      .eq("id", connectionId)
      .eq("receiver_id", userId);

    if (error) {
      setMessage(error.message);
      setProcessingId(null);
      return;
    }

    setRequests((current) =>
      current.filter((item) => item.id !== connectionId)
    );

    setProcessingId(null);

    setMessage(
      status === "accepted"
        ? "Connection accepted. You can now message this person."
        : "Connection request declined."
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <p className="text-white/50">Loading notifications...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050816]/90 px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
                Nikelink
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Notifications
              </h1>
            </div>

            <button
              onClick={signOut}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-7">
        {message && (
          <div className="mb-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-center text-sm text-violet-200">
            {message}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 text-xl shadow-lg">
              🔔
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Connection requests
              </h2>

              <p className="text-sm text-white/40">
                People who want to connect with you.
              </p>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-12 text-center shadow-xl">
            <div className="mb-4 text-5xl">✨</div>

            <h3 className="text-lg font-bold">
              You're all caught up
            </h3>

            <p className="mt-2 text-sm text-white/40">
              New connection requests will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const person = request.requester;

              const name =
                person?.full_name ||
                person?.username ||
                "Nikelink User";

              const initials =
                name.trim().charAt(0).toUpperCase() || "?";

              const processing =
                processingId === request.id;

              return (
                <article
                  key={request.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl"
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500 text-xl font-black shadow-lg">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold">
                          {name}
                        </h3>

                        {person?.username && (
                          <p className="mt-1 text-sm text-violet-400">
                            @{person.username}
                          </p>
                        )}

                        {person?.country && (
                          <p className="mt-1 text-xs text-white/40">
                            🌍 {person.country}
                          </p>
                        )}

                        <p className="mt-3 text-sm text-white/55">
                          Wants to connect with you.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          respondToRequest(
                            request.id,
                            "declined"
                          )
                        }
                        disabled={processing}
                        className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/60 disabled:opacity-40"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() =>
                          respondToRequest(
                            request.id,
                            "accepted"
                          )
                        }
                        disabled={processing}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold disabled:opacity-40"
                      >
                        {processing ? "Updating..." : "Accept"}
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        router.push(
                          `/profile?user=${request.requester_id}`
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/45"
                    >
                      View profile
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-5">
          <button
            onClick={() => router.push("/Feed")}
            className="flex flex-col items-center justify-center gap-1 text-white/45"
          >
            <span className="text-xl">⌂</span>
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="flex flex-col items-center justify-center gap-1 text-white/45"
          >
            <span className="text-xl">◎</span>
            <span className="text-[10px]">Discover</span>
          </button>

          <button
            onClick={() => router.push("/Feed")}
            className="flex flex-col items-center justify-center gap-1 text-white/45"
          >
            <span className="text-2xl">＋</span>
            <span className="text-[10px]">Create</span>
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="flex flex-col items-center justify-center gap-1 text-white/45"
          >
            <span className="text-xl">◌</span>
            <span className="text-[10px]">Messages</span>
          </button>

          <button
            onClick={() => router.push("/notifications")}
            className="flex flex-col items-center justify-center gap-1 text-violet-400"
          >
            <span className="text-xl">♢</span>
            <span className="text-[10px]">Alerts</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
