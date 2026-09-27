"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Post = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type LikeCounts = {
  [postId: string]: number;
};

export default function FeedPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("Nikelink User");

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [likedPosts, setLikedPosts] = useState<{
    [postId: string]: boolean;
  }>({});

  const [likeCounts, setLikeCounts] = useState<LikeCounts>({});

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      setProfileName(
        profile.full_name ||
          profile.username ||
          "Nikelink User"
      );
    }

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id, user_id, content, created_at")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Posts error:", postsError);
      setLoading(false);
      return;
    }

    const loadedPosts = postsData || [];
    setPosts(loadedPosts);

    if (loadedPosts.length > 0) {
      const postIds = loadedPosts.map((post) => post.id);

      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("id, post_id, user_id")
        .in("post_id", postIds);

      if (likesError) {
        console.error("Likes error:", likesError);
      } else {
        const counts: LikeCounts = {};
        const userLikes: {
          [postId: string]: boolean;
        } = {};

        loadedPosts.forEach((post) => {
          counts[post.id] = 0;
        });

        (likesData || []).forEach((like) => {
          counts[like.post_id] =
            (counts[like.post_id] || 0) + 1;

          if (like.user_id === user.id) {
            userLikes[like.post_id] = true;
          }
        });

        setLikeCounts(counts);
        setLikedPosts(userLikes);
      }
    }

    setLoading(false);
  }

  async function createPost() {
    const content = newPost.trim();

    if (!content || !user) return;

    setPosting(true);

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content,
      })
      .select("id, user_id, content, created_at")
      .single();

    if (error) {
      console.error("Create post error:", error);
      setPosting(false);
      return;
    }

    if (data) {
      setPosts((current) => [data, ...current]);

      setLikeCounts((current) => ({
        ...current,
        [data.id]: 0,
      }));
    }

    setNewPost("");
    setPosting(false);
  }

  async function handleLike(postId: string) {
    if (!user) return;

    const alreadyLiked = !!likedPosts[postId];

    // Optimistic UI update
    setLikedPosts((current) => ({
      ...current,
      [postId]: !alreadyLiked,
    }));

    setLikeCounts((current) => ({
      ...current,
      [postId]: Math.max(
        0,
        (current[postId] || 0) +
          (alreadyLiked ? -1 : 1)
      ),
    }));

    if (alreadyLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Unlike error:", error);

        // Roll UI back
        setLikedPosts((current) => ({
          ...current,
          [postId]: true,
        }));

        setLikeCounts((current) => ({
          ...current,
          [postId]: (current[postId] || 0) + 1,
        }));
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) {
        console.error("Like error:", error);

        // Roll UI back
        setLikedPosts((current) => ({
          ...current,
          [postId]: false,
        }));

        setLikeCounts((current) => ({
          ...current,
          [postId]: Math.max(
            0,
            (current[postId] || 0) - 1
          ),
        }));
      }
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white pb-24">
      {/* TOP NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xl font-black tracking-tight"
          >
            <span className="text-white">Nike</span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
              link
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/profile")}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              Profile
            </button>

            <button
              onClick={signOut}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* FEED */}
      <section className="mx-auto max-w-2xl px-4 pt-6">
        {/* CREATE POST */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-blue-950/20">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-sm font-black">
              {profileName.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="font-semibold">{profileName}</p>
              <p className="text-xs text-white/40">
                Share something with your community
              </p>
            </div>
          </div>

          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening?"
            rows={4}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/50"
          />

          <div className="mt-3 flex justify-end">
            <button
              onClick={createPost}
              disabled={posting || !newPost.trim()}
              className="rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        {/* TITLE */}
        <div className="mb-4">
          <h1 className="text-2xl font-black">Your Feed</h1>
          <p className="mt-1 text-sm text-white/40">
            Discover what people in your network are sharing.
          </p>
        </div>

        {/* POSTS */}
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">
            Loading your feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <p className="text-lg font-semibold">
              Your feed is empty
            </p>
            <p className="mt-2 text-sm text-white/40">
              Be the first person to share something.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const liked = !!likedPosts[post.id];
              const count = likeCounts[post.id] || 0;

              return (
                <article
                  key={post.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10"
                >
                  {/* POST HEADER */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-sm font-black">
                        N
                      </div>

                      <div>
                        <p className="font-semibold">
                          Nikelink User
                        </p>

                        <p className="text-xs text-white/35">
                          {formatTime(post.created_at)}
                        </p>
                      </div>
                    </div>

                    <button className="rounded-full px-3 py-2 text-white/40 transition hover:bg-white/10 hover:text-white">
                      •••
                    </button>
                  </div>

                  {/* CONTENT */}
                  <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-white/85">
                    {post.content}
                  </p>

                  {/* ACTIONS */}
                  <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                        liked
                          ? "bg-pink-500/15 text-pink-400"
                          : "text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">
                        {liked ? "♥" : "♡"}
                      </span>

                      <span>
                        {count > 0
                          ? `${count} Like${count === 1 ? "" : "s"}`
                          : "Like"}
                      </span>
                    </button>

                    <button
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      <span>♧</span>
                      <span>Comment</span>
                    </button>

                    <button
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      <span>↗</span>
                      <span>Share</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-3">
          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center gap-1 text-xs text-blue-400"
          >
            <span className="text-lg">⌂</span>
            Home
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="flex flex-col items-center gap-1 text-xs text-white/50"
          >
            <span className="text-lg">⌕</span>
            Discover
          </button>

          <button
            onClick={() => router.push("/feed")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-600 text-2xl font-light shadow-lg shadow-blue-950/40"
          >
            +
          </button>

          <button
            onClick={() => router.push("/notifications")}
            className="flex flex-col items-center gap-1 text-xs text-white/50"
          >
            <span className="text-lg">♡</span>
            Alerts
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center gap-1 text-xs text-white/50"
          >
            <span className="text-lg">◉</span>
            Profile
          </button>
        </div>
      </nav>
    </main>
  );
                  }
