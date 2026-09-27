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

type LikeCount = {
  post_id: string;
  count: number;
};

export default function FeedPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Nikelink User");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadFeed() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.replace("/login");
        return;
      }

      const currentUserId = userData.user.id;
      setUserId(currentUserId);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", currentUserId)
        .maybeSingle();

      if (profile) {
        setUserName(
          profile.full_name ||
            profile.username ||
            "Nikelink User"
        );
      }

      const { data: postData, error: postError } =
        await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

      if (!postError && postData) {
        setPosts(postData);

        const postIds = postData.map((post) => post.id);

        if (postIds.length > 0) {
          const { data: likeData } = await supabase
            .from("likes")
            .select("post_id, user_id")
            .in("post_id", postIds);

          if (likeData) {
            const countMap: Record<string, number> = {};
            const likedMap: Record<string, boolean> = {};

            likeData.forEach((like) => {
              countMap[like.post_id] =
                (countMap[like.post_id] || 0) + 1;

              if (like.user_id === currentUserId) {
                likedMap[like.post_id] = true;
              }
            });

            setLikes(countMap);
            setLikedPosts(likedMap);
          }
        }
      }

      setLoading(false);
    }

    loadFeed();
  }, [router]);

  async function handleCreatePost(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!userId || !newPost.trim()) return;

    setPosting(true);
    setMessage("");

    const content = newPost.trim();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content,
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      setPosting(false);
      return;
    }

    if (data) {
      setPosts((current) => [data, ...current]);
    }

    setNewPost("");
    setMessage("Post published.");
    setPosting(false);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  async function handleLike(postId: string) {
    const alreadyLiked = likedPosts[postId];

    if (alreadyLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) {
        setMessage(error.message);
        return;
      }

      setLikedPosts((current) => ({
        ...current,
        [postId]: false,
      }));

      setLikes((current) => ({
        ...current,
        [postId]: Math.max((current[postId] || 1) - 1, 0),
      }));

      return;
    }

    const { error } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: userId,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setLikedPosts((current) => ({
      ...current,
      [postId]: true,
    }));

    setLikes((current) => ({
      ...current,
      [postId]: (current[postId] || 0) + 1,
    }));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function formatDate(date: string) {
    const created = new Date(date);
    const now = new Date();

    const difference = Math.floor(
      (now.getTime() - created.getTime()) / 1000
    );

    if (difference < 60) return "Just now";
    if (difference < 3600)
      return `${Math.floor(difference / 60)}m`;
    if (difference < 86400)
      return `${Math.floor(difference / 3600)}h`;
    if (difference < 604800)
      return `${Math.floor(difference / 86400)}d`;

    return created.toLocaleDateString();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black shadow-lg shadow-blue-500/20">
            N
          </div>

          <p className="text-sm text-white/40">
            Loading Nikelink...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 font-black shadow-lg shadow-blue-500/20">
              N
            </div>

            <span className="hidden text-lg font-black sm:block">
              Nikelink
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/profile")}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {userName}
            </button>

            <button
              onClick={handleSignOut}
              className="hidden rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/50 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-2xl px-4 pb-28 pt-6">
        {/* WELCOME */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-400">
            Your global community
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            What's happening?
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Share something with the Nikelink community.
          </p>
        </div>

        {/* CREATE POST */}
        <form
          onSubmit={handleCreatePost}
          className="mb-7 rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl"
        >
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-black">
              {userName.charAt(0).toUpperCase()}
            </div>

            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={`What's on your mind, ${userName.split(" ")[0]}?`}
              rows={3}
              maxLength={1000}
              className="min-h-[90px] flex-1 resize-none bg-transparent pt-2 text-sm text-white outline-none placeholder:text-white/25"
            />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-xs text-white/25">
              {newPost.length}/1000
            </span>

            <button
              type="submit"
              disabled={posting || !newPost.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>

          {message && (
            <p className="mt-3 text-center text-xs text-blue-300">
              {message}
            </p>
          )}
        </form>

        {/* FEED */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                🌍
              </div>

              <h2 className="text-lg font-bold">
                Your feed is empty
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm text-white/40">
                Be the first person to share something with
                the Nikelink community.
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const count = likes[post.id] || 0;
              const isLiked = likedPosts[post.id];

              return (
                <article
                  key={post.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/80 to-violet-600/80 font-black">
                        N
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          Nikelink User
                        </p>

                        <p className="text-xs text-white/30">
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                    </div>

                    <button className="text-xl text-white/30">
                      •••
                    </button>
                  </div>

                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-white/80">
                    {post.content}
                  </p>

                  {/* LIKE BUTTON */}
<div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
  <button
    onClick={() => handleLike(post.id)}
    className={`rounded-xl px-3 py-2 text-sm transition ${
      isLiked
        ? "bg-pink-500/10 text-pink-400"
        : "text-white/45 hover:bg-white/5 hover:text-pink-400"
    }`}
  >
    {isLiked ? "♥" : "♡"} Like
    {count > 0 && (
      <span className="ml-1 font-bold">
        {count}
      </span>
    )}
  </button>

  <button className="rounded-xl px-3 py-2 text-sm text-white/45 transition hover:bg-white/5 hover:text-blue-400">
    ♧ Comment
  </button>

  <button className="rounded-xl px-3 py-2 text-sm text-white/45 transition hover:bg-white/5 hover:text-violet-400">
    ↗ Share
  </button>
</div>
