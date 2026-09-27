"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  age_group: string | null;
  interests: string[] | null;
  avatar_url: string | null;
};

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
};

type Post = {
  id: string;
  user_id: string;
  content: string | null;
  created_at: string;
};

export default function PublicProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [connection, setConnection] = useState<Connection | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPublicProfile() {
      setLoading(true);
      setMessage("");

      const params = new URLSearchParams(window.location.search);
      const viewedUserId = params.get("id");

      if (!viewedUserId) {
        setMessage("Profile not found.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const currentUser = authData.user;
      setCurrentUserId(currentUser.id);

      if (viewedUserId === currentUser.id) {
        router.replace("/profile");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, username, country, bio, age_group, interests, avatar_url"
        )
        .eq("id", viewedUserId)
        .maybeSingle();

      if (profileError || !profileData) {
        setMessage("This profile could not be found.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: connectionData } = await supabase
        .from("connections")
        .select("id, requester_id, receiver_id, status")
        .or(
          `and(requester_id.eq.${currentUser.id},receiver_id.eq.${viewedUserId}),and(requester_id.eq.${viewedUserId},receiver_id.eq.${currentUser.id})`
        )
        .maybeSingle();

      setConnection(connectionData ?? null);

      const { data: postData } = await supabase
        .from("posts")
        .select("id, user_id, content, created_at")
        .eq("user_id", viewedUserId)
        .order("created_at", { ascending: false });

      setPosts(postData ?? []);

      setLoading(false);
    }

    loadPublicProfile();
  }, [router]);

  const initials = useMemo(() => {
    if (!profile?.full_name) return "N";

    return profile.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }, [profile]);

  function getConnectionState() {
    if (!connection) {
      return "connect";
    }

    if (connection.status === "accepted") {
      return "connected";
    }

    if (
      connection.status === "pending" &&
      connection.requester_id === currentUserId
    ) {
      return "sent";
    }

    if (
      connection.status === "pending" &&
      connection.receiver_id === currentUserId
    ) {
      return "respond";
    }

    if (connection.status === "declined") {
      return "connect";
    }

    return "connect";
  }

  async function handleConnect() {
    if (!profile || !currentUserId || connecting) return;

    setConnecting(true);
    setMessage("");

    const { data, error } = await supabase
      .from("connections")
      .insert({
        requester_id: currentUserId,
        receiver_id: profile.id,
        status: "pending",
      })
      .select("id, requester_id, receiver_id, status")
      .single();

    if (error) {
      setMessage(error.message);
      setConnecting(false);
      return;
    }

    setConnection(data);
    setMessage("Connection request sent.");
    setConnecting(false);
  }

  function handleConnectionButton() {
    const state = getConnectionState();

    if (state === "connect") {
      handleConnect();
      return;
    }

    if (state === "respond") {
      router.push("/notifications");
      return;
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/40" />

          <p className="text-sm text-white/45">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] px-5 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-2xl">
            ?
          </div>

          <h1 className="text-2xl font-black">
            Profile unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/40">
            {message || "We could not load this profile."}
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-sm font-bold"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const connectionState = getConnectionState();

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white sm:pb-10">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute right-[-120px] top-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-600/10 blur-[150px]" />

        <div className="absolute bottom-[-180px] left-1/3 h-96 w-96 rounded-full bg-fuchsia-600/5 blur-[130px]" />
      </div>

      {/* TOP BAR */}
      <header className="relative border-b border-white/[0.06] bg-[#050816]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-white"
          >
            <span className="text-xl">←</span>
            Back
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-black shadow-lg shadow-blue-500/20">
              N
            </div>

            <span className="text-lg font-black tracking-tight">
              Nikelink
            </span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-white/55 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            Discover
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-5 pt-7 sm:px-8 sm:pt-10">
        {/* PROFILE HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] via-transparent to-violet-500/[0.07]" />

          <div className="relative p-6 sm:p-9">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
              {/* AVATAR */}
              <div className="relative mx-auto shrink-0 sm:mx-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profile avatar"}
                    className="h-28 w-28 rounded-[2rem] object-cover ring-2 ring-blue-500/30 shadow-2xl shadow-blue-500/10 sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-4xl font-black shadow-2xl shadow-blue-500/20 sm:h-32 sm:w-32">
                    {initials}
                  </div>
                )}

                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#080b1c] bg-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>

              {/* INFO */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  Nikelink member
                </p>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  {profile.full_name || "Nikelink member"}
                </h1>

                <p className="mt-2 text-sm text-white/40">
                  @{profile.username || "username"}
                </p>

                {profile.country && (
                  <p className="mt-3 text-sm text-white/50">
                    🌍 {profile.country}
                  </p>
                )}

                {profile.bio && (
                  <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:mx-0">
                    {profile.bio}
                  </p>
                )}

                {/* CONNECTION */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleConnectionButton}
                    disabled={
                      connecting ||
                      connectionState === "connected" ||
                      connectionState === "sent"
                    }
                    className={`rounded-xl px-6 py-3.5 text-sm font-bold transition active:scale-[0.98] ${
                      connectionState === "connected"
                        ? "cursor-default border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                        : connectionState === "sent"
                          ? "cursor-default border border-white/10 bg-white/5 text-white/40"
                          : "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-600/10 hover:from-blue-500 hover:to-violet-500"
                    }`}
                  >
                    {connecting
                      ? "Sending..."
                      : connectionState === "connected"
                        ? "✓ Connected"
                        : connectionState === "sent"
                          ? "Request Sent"
                          : connectionState === "respond"
                            ? "Respond to Request"
                            : "Connect"}
                  </button>

                  <button
                    onClick={() => router.push("/discover")}
                    className="rounded-xl border border-white/10 bg-white/[0.025] px-6 py-3.5 text-sm font-semibold text-white/55 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                  >
                    Discover more
                  </button>
                </div>

                {message && (
                  <p className="mt-4 text-sm text-white/45">
                    {message}
                  </p>
                )}
              </div>
            </div>

            {/* INTERESTS */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-8 border-t border-white/[0.07] pt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/30">
                  Interests
                </p>

                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-blue-400/15 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-300"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AGE GROUP */}
            {profile.age_group && (
              <div className="mt-6 border-t border-white/[0.07] pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">
                  Age group
                </p>

                <p className="mt-2 text-sm font-semibold text-white/60">
                  {profile.age_group}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* POSTS */}
        <section className="mt-9">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              Activity
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Recent posts
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Posts shared by {profile.full_name || "this member"}.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-xl">
                ✦
              </div>

              <h3 className="text-lg font-bold">
                No posts yet
              </h3>

              <p className="mt-2 text-sm text-white/35">
                This member has not shared any posts yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 sm:p-6"
                >
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-black">
                        {initials}
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-bold">
                        {profile.full_name || "Nikelink member"}
                      </p>

                      <p className="text-xs text-white/30">
                        @{profile.username || "username"} ·{" "}
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>

                  {post.content && (
                    <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-white/65">
                      {post.content}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#050816]/90 backdrop-blur-2xl sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-3 py-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/40 transition hover:text-white"
          >
            <span className="text-lg">⌂</span>
            <span className="text-[10px] font-semibold">
              Home
            </span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="flex flex-col items-center gap-1 px-4 py-1 text-blue-400"
          >
            <span className="text-lg">◎</span>
            <span className="text-[10px] font-semibold">
              Discover
            </span>
          </button>

          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/40 transition hover:text-white"
          >
            <span className="text-lg">◉</span>
            <span className="text-[10px] font-semibold">
              Feed
            </span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/40 transition hover:text-white"
          >
            <span className="text-lg">●</span>
            <span className="text-[10px] font-semibold">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
                  }
