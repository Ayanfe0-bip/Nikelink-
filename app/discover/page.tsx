"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  interests: string[] | null;
};

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
};

export default function DiscoverPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    loadDiscover();
  }, []);

  async function loadDiscover() {
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

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .order("created_at", { ascending: false });

    if (profileError) {
      console.error("Profiles error:", profileError);
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
    if (!userId) return;

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

  const filteredProfiles = profiles.filter((profile) => {
    const term = search.toLowerCase().trim();

    if (!term) return true;

    return (
      profile.full_name?.toLowerCase().includes(term) ||
      profile.username?.toLowerCase().includes(term) ||
      profile.country?.toLowerCase().includes(term) ||
      profile.bio?.toLowerCase().includes(term) ||
      profile.interests?.some((interest) =>
        interest.toLowerCase().includes(term)
      )
    );
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <p className="text-white/50">Discovering people...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050816]/90 px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
                Nikelink
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Discover
              </h1>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              👤
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4">
            <span className="text-white/50">🔍</span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people, interests or countries..."
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-3xl px-5 py-7">
        <div className="mb-6">
          <h2 className="text-xl font-bold">
            People you may know
          </h2>

          <p className="mt-1 text-sm text-white/45">
            Connect with people around the world.
          </p>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-12 text-center">
            <div className="mb-4 text-4xl">🌍</div>

            <h3 className="text-lg font-bold">
              No people found
            </h3>

            <p className="mt-2 text-sm text-white/45">
              Try another search.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProfiles.map((profile) => {
              const buttonText = getButtonText(profile.id);
              const isConnecting = connectingId === profile.id;

              const initials =
                profile.full_name?.trim().charAt(0).toUpperCase() ||
                profile.username?.trim().charAt(0).toUpperCase() ||
                "?";

              return (
                <article
                  key={profile.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl"
                >
                  <div className="flex gap-4">
                    {/* AVATAR */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500 text-xl font-black shadow-lg">
                      {initials}
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">
                        {profile.full_name || "Nikelink User"}
                      </h3>

                      {profile.username && (
                        <p className="mt-1 text-sm text-violet-400">
                          @{profile.username}
                        </p>
                      )}

                      {profile.country && (
                        <p className="mt-1 text-xs text-white/45">
                          🌍 {profile.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="mt-4 text-sm leading-6 text-white/60">
                      {profile.bio}
                    </p>
                  )}

                  {profile.interests &&
                    profile.interests.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.interests
                          .slice(0, 5)
                          .map((interest) => (
                            <span
                              key={interest}
                              className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"
                            >
                              {interest}
                            </span>
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
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() => handleConnect(profile.id)}
                      disabled={
                        isConnecting ||
                        buttonText === "Connected" ||
                        buttonText === "Request Sent"
                      }
                      className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${
                        buttonText === "Connected"
                          ? "bg-green-500/15 text-green-300"
                          : buttonText === "Request Sent"
                            ? "bg-white/10 text-white/50"
                            : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-90"
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
            className="flex flex-col items-center justify-center gap-1 text-violet-400"
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
        </div>
      </nav>
    </main>
  );
}
