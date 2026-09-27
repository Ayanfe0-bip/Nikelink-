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

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Like = {
  id: string;
  post_id: string;
  user_id: string;
};

export default function FeedPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Nikelink User");

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);

  const [commentText, setCommentText] = useState<
    Record<string, string>
  >({});

  const [openComments, setOpenComments] = useState<
    Record<string, boolean>
  >({});

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [submittingComment, setSubmittingComment] =
    useState<string | null>(null);

  const [deletingPost, setDeletingPost] =
    useState<string | null>(null);

  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFeed();
  }, []);

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

    await loadPosts();
    await loadComments();
    await loadLikes();

    setLoading(false);
  }

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, post_id, user_id, content, created_at"
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  }

  async function loadLikes() {
    const { data, error } = await supabase
      .from("likes")
      .select("id, post_id, user_id");

    if (!error && data) {
      setLikes(data);
    }
  }

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

  async function toggleLike(postId: string) {
    if (!userId) return;

    const existingLike = likes.find(
      (like) =>
        like.post_id === postId &&
        like.user_id === userId
    );

    if (existingLike) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) {
        setMessage(error.message);
        return;
      }

      setLikes((current) =>
        current.filter(
          (like) => like.id !== existingLike.id
        )
      );

      return;
    }

    const { data, error } = await supabase
      .from("likes")
      .insert({
        post_id: postId,
        user_id: userId,
      })
      .select("id, post_id, user_id")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setLikes((current) => [...current, data]);
    }
  }

  async function submitComment(postId: string) {
    const content = (
      commentText[postId] || ""
    ).trim();

    if (!content || !userId) return;

    setSubmittingComment(postId);
    setMessage("");

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: userId,
        content,
      })
      .select(
        "id, post_id, user_id, content, created_at"
      )
      .single();

    if (error) {
      setMessage(error.message);
      setSubmittingComment(null);
      return;
    }

    if (data) {
      setComments((current) => [...current, data]);
    }

    setCommentText((current) => ({
      ...current,
      [postId]: "",
    }));

    setOpenComments((current) => ({
      ...current,
      [postId]: true,
    }));

    setSubmittingComment(null);
  }

  async function handleShare(post: Post) {
    const shareUrl =
      `${window.location.origin}/feed?post=${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Nikelink",
          text: post.content.slice(0, 120),
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(shareUrl);

      setMessage("Post link copied.");

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.log("Share cancelled:", error);
    }
  }

  async function handleDeletePost(postId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) {
      setOpenMenu(null);
      return;
    }

    setDeletingPost(postId);
    setMessage("");

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) {
      setMessage(error.message);
      setDeletingPost(null);
      return;
    }

    setPosts((current) =>
      current.filter((post) => post.id !== postId)
    );

    setComments((current) =>
      current.filter(
        (comment) => comment.post_id !== postId
      )
    );

    setLikes((current) =>
      current.filter(
        (like) => like.post_id !== postId
      )
    );

    setOpenMenu(null);
    setDeletingPost(null);
    setMessage("Post deleted.");

    setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  function handleReportPost(postId: string) {
    setOpenMenu(null);
    setMessage("Post reported.");

    console.log("Reported post:", postId);

    setTimeout(() => {
      setMessage("");
    }, 2000);
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

    if (difference < 3600) {
      return `${Math.floor(difference / 60)}m`;
    }

    if (difference < 86400) {
      return `${Math.floor(difference / 3600)}h`;
    }

    if (difference < 604800) {
      return `${Math.floor(difference / 86400)}d`;
    }

    return created.toLocaleDateString();
  }

  function getPostLikes(postId: string) {
    return likes.filter(
      (like) => like.post_id === postId
    );
  }

  function getPostComments(postId: string) {
    return comments.filter(
      (comment) => comment.post_id === postId
    );
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
    <main className="min-h-screen bg-[#050816] text-white pb-24">
      {/* TOP NAV */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <button
            onClick={() => router.push("/feed")}
            className="text-2xl font-black tracking-tight"
          >
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Nikelink
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                router.push("/notifications")
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg"
            >
              🔔
            </button>

            <button
              onClick={() =>
                router.push("/profile")
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-bold"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* WELCOME */}
        <div className="mb-6">
          <p className="text-sm text-white/40">
            Welcome back
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            {userName}
          </h1>
        </div>

        {/* CREATE POST */}
        <form
          onSubmit={handleCreatePost}
          className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
        >
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>

            <textarea
              value={newPost}
              onChange={(e) =>
                setNewPost(e.target.value)
              }
              placeholder="What's happening?"
              rows={3}
              className="min-h-[80px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/50"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-white/30">
              Share something with the community
            </span>

            <button
              type="submit"
              disabled={posting || !newPost.trim()}
              className="rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2 text-sm font-bold shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>

        {/* MESSAGE */}
        {message && (
          <div className="mb-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            {message}
          </div>
        )}

        {/* POSTS */}
        <div className="space-y-5">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
              <div className="mb-3 text-4xl">
                🌍
              </div>

              <h2 className="text-lg font-bold">
                Your feed is waiting
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Be the first to share something.
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const postLikes =
                getPostLikes(post.id);

              const postComments =
                getPostComments(post.id);

              const userLiked =
                postLikes.some(
                  (like) =>
                    like.user_id === userId
                );

              const isOwnPost =
                post.user_id === userId;

              return (
                <article
                  key={post.id}
                  className="relative overflow-visible rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20"
                >
                  {/* POST HEADER */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 font-bold">
                        N
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          Nikelink User
                        </p>

                        <p className="text-xs text-white/35">
                          {formatDate(
                            post.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    {/* THREE DOT MENU */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === post.id
                              ? null
                              : post.id
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/50 transition hover:bg-white/10 hover:text-white"
                      >
                        ⋯
                      </button>

                      {openMenu === post.id && (
                        <div className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#101426] shadow-2xl shadow-black/50">
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              handleShare(post);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/10"
                          >
                            <span>↗️</span>
                            <span>Share post</span>
                          </button>

                          {isOwnPost ? (
                            <button
                              onClick={() =>
                                handleDeletePost(
                                  post.id
                                )
                              }
                              disabled={
                                deletingPost ===
                                post.id
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10"
                            >
                              <span>🗑️</span>

                              <span>
                                {deletingPost ===
                                post.id
                                  ? "Deleting..."
                                  : "Delete post"}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleReportPost(
                                  post.id
                                )
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/10"
                            >
                              <span>⚑</span>
                              <span>Report post</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* POST CONTENT */}
                  <div className="px-4 pb-4">
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-white/90">
                      {post.content}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="border-t border-white/10 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {/* LIKE */}
                        <button
                          onClick={() =>
                            toggleLike(post.id)
                          }
                          className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                            userLiked
                              ? "bg-pink-500/10 text-pink-400"
                              : "text-white/50 hover:bg-white/5 hover:text-pink-400"
                          }`}
                        >
                          <span className="text-lg">
                            {userLiked
                              ? "❤️"
                              : "♡"}
                          </span>

                          <span>
                            {postLikes.length}
                          </span>
                        </button>

                        {/* COMMENTS */}
                        <button
                          onClick={() =>
                            setOpenComments(
                              (current) => ({
                                ...current,
                                [post.id]:
                                  !current[
                                    post.id
                                  ],
                              })
                            )
                          }
                          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-blue-400"
                        >
                          <span className="text-lg">
                            💬
                          </span>

                          <span>
                            {postComments.length}
                          </span>
                        </button>

                        {/* SHARE */}
                        <button
                          onClick={() =>
                            handleShare(post)
                          }
                          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-violet-400"
                        >
                          <span className="text-lg">
                            ↗
                          </span>

                          <span className="hidden sm:inline">
                            Share
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* COMMENTS */}
                  
                            {/* COMMENTS */}
                  {openComments[post.id] && (
                    <div className="border-t border-white/10 px-4 pb-4 pt-3">
                      <div className="space-y-3">
                        {postComments.length === 0 ? (
                          <p className="py-2 text-center text-xs text-white/30">
                            No comments yet.
                          </p>
                        ) : (
                          postComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex gap-3"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold">
                                N
                              </div>

                              <div className="min-w-0 flex-1 rounded-2xl bg-white/[0.05] px-3 py-2">
                                <p className="text-xs font-semibold text-white">
                                  Nikelink User
                                </p>

                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/75">
                                  {comment.content}
                                </p>

                                <p className="mt-1 text-[10px] text-white/25">
                                  {formatDate(comment.created_at)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* COMMENT INPUT */}
                      <div className="mt-4 flex gap-2">
                        <input
                          value={commentText[post.id] || ""}
                          onChange={(e) =>
                            setCommentText((current) => ({
                              ...current,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey
                            ) {
                              e.preventDefault();

                              if (
                                (commentText[post.id] || "").trim()
                              ) {
                                submitComment(post.id);
                              }
                            }
                          }}
                          placeholder="Write a comment..."
                          maxLength={500}
                          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-500/40"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            submitComment(post.id)
                          }
                          disabled={
                            submittingComment === post.id ||
                            !(commentText[post.id] || "").trim()
                          }
                          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {submittingComment === post.id
                            ? "..."
                            : "Send"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center gap-1 px-4 py-2 text-blue-400"
          >
            <span className="text-xl">
              🏠
            </span>

            <span className="text-[10px]">
              Home
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/discover")
            }
            className="flex flex-col items-center gap-1 px-4 py-2 text-white/40"
          >
            <span className="text-xl">
              🔎
            </span>

            <span className="text-[10px]">
              Discover
            </span>
          </button>

          <button
            onClick={() => {
              document
                .querySelector("textarea")
                ?.focus();
            }}
            className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-2xl font-bold shadow-xl shadow-blue-500/30"
          >
            +
          </button>

          <button
            onClick={() =>
              router.push("/notifications")
            }
            className="flex flex-col items-center gap-1 px-4 py-2 text-white/40"
          >
            <span className="text-xl">
              🔔
            </span>

            <span className="text-[10px]">
              Alerts
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/profile")
            }
            className="flex flex-col items-center gap-1 px-4 py-2 text-white/40"
          >
            <span className="text-xl">
              👤
            </span>

            <span className="text-[10px]">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
}
