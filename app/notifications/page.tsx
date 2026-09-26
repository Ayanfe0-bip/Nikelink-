"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type RequestItem = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  requester: {
    id: string;
    full_name: string | null;
    username: string | null;
    country: string | null;
    bio: string | null;
  } | null;
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

  async function loadRequests() {
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
        `
        id,
        requester_id,
        receiver_id,
        status,
        created_at,
        requester:profiles!connections_requester_id_fkey (
          id,
          full_name,
          username,
          country,
          bio
        )
      `
      )
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notification request error:", error);
      setMessage(error.message);
    } else {
      setRequests((data as unknown as RequestItem[]) || []);
    }

    setLoading(false);
  }

  async function respondToRequest(
    connectionId: string,
    newStatus: "accepted" | "declined"
  ) {
    setProcessingId(connectionId);
    setMessage("");

    const { error } = await supabase
      .from("connections")
      .update({
        status: newStatus,
      })
      .eq("id", connectionId)
      .eq("receiver_id", userId);

    if (error) {
      console.error("Connection response error:", error);
      setMessage(error.message);
      setProcessingId(null);
      return;
    }

    setRequests((current) =>
      current.filter((request) => request.id !== connectionId)
    );

    setProcessingId(null);

    if (newStatus === "accepted") {
      setMessage("Connection accepted.");
    } else {
      setMessage("Connection request declined.");
    }
  }

  async function handleSignOut() {
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
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#050816]/95 px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
                Nikelink
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Notifications
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
            Connection requests
          </h2>

          <p className="mt-1 text-sm text-white/45">
            People who want to connect with you.
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-12 text-center shadow-xl">
            <div className="mb-4 text-4xl">🔔</div>

            <h3 className="text-lg font-bold">
              You're all caught up
            </h3>

            <p className="mt-2 text-sm text-white/45">
              New connection requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const person = request.requester;

              const initials =
                person?.full_name?.trim().charAt(0).toUpperCase() ||
                person?.username?.trim().charAt(0).toUpperCase() ||
                "?";

              const processing = processingId === request.id;

              return (
                <article
                  key={request.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl"
                >
                  <div className="flex gap-4">
                    {/* AVATAR */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500 text-xl font-black shadow-lg">
                      {initials}
                    </div>

                    {/* PERSON */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">
                        {person?.full_name || "Nikelink User"}
                      </h3>

                      {person?.username && (
                        <p className="mt-1 text-sm text-violet-400">
                          @{person.username}
                        </p>
                      )}

                      {person?.country && (
                        <p className="mt-1 text-xs text-white/45">
                          🌍 {person.country}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-white/55">
                        Wants to connect with you.
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() =>
                        respondToRequest(request.id, "declined")
                      }
                      disabled={processing}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                    >
                      Decline
                    </button>

                    <button
                      onClick={() =>
                        respondToRequest(request.id, "accepted")
                      }
                      disabled={processing}
                      className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                    >
                      {processing ? "Updating..." : "Accept"}
                    </button>
                  </div>

                  {/* VIEW PROFILE */}
                  <button
                    onClick={() =>
                      router.push(
                        `/profile?user=${request.requester_id}`
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/45 transition hover:bg-white/5 hover:text-white"
                  >
                    View profile
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-4">
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
