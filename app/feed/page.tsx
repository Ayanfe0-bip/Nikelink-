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

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function FeedPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Nikelink User");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

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
      .select("id, full_name, username, avatar_url")
      .eq("id", currentUserId)
      .maybeSingle();

    if (profile) {
      setUserName(
        profile.full_name ||
          profile.username ||
          "Nikelink User"
      );

      setAvatarUrl(profile.avatar_url || "");
    }

    await Promise.all([
      loadPosts(),
      loadComments(),
      loadLikes(),
    ]);

    setLoading(false);
  }

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading posts:", error);
      return;
    }

    if (data) {
      setPosts(data);

      const userIds = [
        ...new Set(
          data
            .map((post) => post.user_id)
            .filter(Boolean)
        ),
      ];

      if (userIds.length > 0) {
        const { data: authorProfiles, error: profileError } =
          await supabase
            .from("profiles")
            .select(
              "id, full_name, username, avatar_url"
            )
            .in("id", userIds);

        if (!profileError && authorProfiles) {
          const profileMap: Record<string, Profile> = {};

          authorProfiles.forEach((profile) => {
            profileMap[profile.id] = profile;
          });

          setProfiles(profileMap);
        }
      }
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

      setProfiles((current) => ({
        ...current,
        [userId]: {
          id: userId,
          full_name: userName,
          username: null,
          avatar_url: avatarUrl || null,
        },
      }));
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

  function getAuthor(post: Post) {
    if (post.user_id === userId) {
      return {
        name: userName,
        avatar: avatarUrl,
      };
    }

    const profile = profiles[post.user_id];

    return {
      name:
        profile?.full_name ||
        profile?.username ||
        "Nikelink User",
      avatar: profile?.avatar_url || "",
    };
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
    <main className="min-h-screen bg-[#050816] pb-24 text-white">

      {/* TOP HEADER */}
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

            {/* CREATE POST */}
            <button
              onClick={() => {
                document
                  .getElementById("create-post")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                setTimeout(() => {
                  document
                    .getElementById("post-textarea")
                    ?.focus();
                }, 400);
              }}
              className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 px-4 text-sm font-bold shadow-lg shadow-violet-500/20"
            >
              <span className="text-lg">+</span>

              <span className="hidden sm:inline">
                Create Post
              </span>

              <span className="sm:hidden">
                Post
              </span>
            </button>

            {/* PROFILE AVATAR */}
            <button
              onClick={() => router.push("/profile")}
              className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 shadow-lg shadow-blue-500/20"
              aria-label="Profile"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Your profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-bold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-3xl px-4 py-6">

        {/* PAGE INTRO */}
        <section className="mb-6">
          <p className="mb-1 text-sm font-medium text-blue-400">
            Your global community
          </p>

          <h1 className="text-3xl font-black tracking-tight">
            Feed
          </h1>

          <p className="mt-2 text-sm text-white/45">
            See what people in your Nikelink community are sharing.
          </p>
        </section>

        {/* CREATE POST CARD */}
        <section
          id="create-post"
          className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
        >
          <div className="mb-4 flex items-center gap-3">

            {/* CURRENT USER AVATAR */}
            <div className="h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 text-lg font-black">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Your profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold">
                {userName}
              </p>

              <p className="text-xs text-white/40">
                Share something with Nikelink
              </p>
            </div>

          </div>

          <form onSubmit={handleCreatePost}>

            <textarea
              id="post-textarea"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
            />

            <div className="mt-3 flex items-center justify-between">

              <p className="text-xs text-white/30">
                Connect. Share. Belong.
              </p>

              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                className="rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 px-5 py-2.5 text-sm font-bold shadow-lg shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {posting ? "Posting..." : "Post"}
              </button>

            </div>
          </form>

          {message && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              {message}
            </div>
          )}
        </section>

        {/* POSTS */}
        <section className="space-y-4">

          {posts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-2xl">
                ✨
              </div>

              <h2 className="text-lg font-bold">
                Your feed is waiting
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Be the first to share something with your community.
              </p>

            </div>
          ) : (
            posts.map((post) => {

              const postLikes = getPostLikes(post.id);
              const postComments = getPostComments(post.id);

              const likedByUser = postLikes.some(
                (like) => like.user_id === userId
              );

              const isOwner =
                post.user_id === userId;

              const author = getAuthor(post);

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10"
                >

                  {/* POST HEADER */}
                  <div className="flex items-center justify-between px-4 py-4">

                    <div className="flex items-center gap-3">

                      {/* POST AUTHOR AVATAR */}
                      <button
                        onClick={() =>
                          router.push(
                            isOwner
                              ? "/profile"
                              : `/profile?user=${post.user_id}`
                          )
                        }
                        className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 font-black"
                        aria-label={`${author.name} profile`}
                      >
                        {author.avatar ? (
                          <img
                            src={author.avatar}
                            alt={author.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            {author.name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          router.push(
                            isOwner
                              ? "/profile"
                              : `/profile?user=${post.user_id}`
                          )
                        }
                        className="text-left"
                      >
                        <p className="font-semibold">
                          {author.name}
                        </p>

                        <p className="text-xs text-white/35">
                          {formatDate(post.created_at)}
                        </p>
                      </button>

                    </div>

                    {/* POST MENU */}
                    <div className="relative">

                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === post.id
                              ? null
                              : post.id
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/50 hover:bg-white/5 hover:text-white"
                        aria-label="Post menu"
                      >
                        ⋯
                      </button>

                      {openMenu === post.id && (
                        <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#11152b] shadow-2xl">

                          <button
                            onClick={() =>
                              handleShare(post)
                            }
                            className="block w-full px-4 py-3 text-left text-sm hover:bg-white/5"
                          >
                            Share post
                          </button>

                          {isOwner ? (
                            <button
                              onClick={() =>
                                handleDeletePost(post.id)
                              }
                              disabled={
                                deletingPost === post.id
                              }
                              className="block w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5"
                            >
                              {deletingPost === post.id
                                ? "Deleting..."
                                : "Delete post"}
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleReportPost(post.id)
                              }
                              className="block w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5"
                            >
                              Report post
                            </button>
                          )}

                        </div>
                      )}

                    </div>
                  </div>

                  {/* POST CONTENT */}
                  <div className="px-4 pb-4">
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-white/85">
                      {post.content}
                    </p>
                  </div>

                  {/* POST STATS */}
                  {(postLikes.length > 0 ||
                    postComments.length > 0) && (
                    <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-xs text-white/35">

                      <span>
                        {postLikes.length > 0
                          ? `${postLikes.length} ${
                              postLikes.length === 1
                                ? "like"
                                : "likes"
                            }`
                          : ""}
                      </span>

                      <button
                        onClick={() =>
                          setOpenComments((current) => ({
                            ...current,
                            [post.id]:
                              !current[post.id],
                          }))
                        }
                        className="hover:text-white/70"
                      >
                        {postComments.length}{" "}
                        {postComments.length === 1
                          ? "comment"
                          : "comments"}
                      </button>

                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="grid grid-cols-3 border-t border-white/10">

                    {/* LIKE */}
                    <button
                      onClick={() =>
                        toggleLike(post.id)
                      }
                      className={`flex items-center justify-center gap-2 py-3 text-sm transition hover:bg-white/5 ${
                        likedByUser
                          ? "text-pink-400"
                          : "text-white/50"
                      }`}
                    >
                      <span>
                        {likedByUser ? "♥" : "♡"}
                      </span>

                      <span>Like</span>
                    </button>

                    {/* COMMENT */}
                    <button
                      onClick={() =>
                        setOpenComments((current) => ({
                          ...current,
                          [post.id]:
                            !current[post.id],
                        }))
                      }
                      className="flex items-center justify-center gap-2 py-3 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
                    >
                      <span>💬</span>
                      <span>Comment</span>
                    </button>

                    {/* SHARE */}
                    <button
                      onClick={() =>
                        handleShare(post)
                      }
                      className="flex items-center justify-center gap-2 py-3 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
                    >
                      <span>↗</span>
                      <span>Share</span>
                    </button>

                  </div>

                  {/* COMMENTS */}
                  {openComments[post.id] && (
                    <div className="border-t border-white/10 bg-black/10 px-4 py-4">

                      <div className="space-y-3">

                        {postComments.length === 0 ? (
                          <p className="text-xs text-white/30">
                            No comments yet. Start the conversation.
                          </p>
                        ) : (
                          postComments.map((comment) => {

                            const commentProfile =
                              profiles[comment.user_id];

                            const commentName =
                              comment.user_id === userId
                                ? userName
                                : commentProfile?.full_name ||
                                  commentProfile?.username ||
                                  "Nikelink User";

                            return (
                              <div
                                key={comment.id}
                                className="flex gap-3"
                              >

                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500/60 to-violet-500/60 text-xs font-bold">

                                  {comment.user_id ===
                                    userId &&
                                  avatarUrl ? (
                                    <img
                                      src={avatarUrl}
                                      alt={commentName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : commentProfile?.avatar_url ? (
                                    <img
                                      src={
                                        commentProfile.avatar_url
                                      }
                                      alt={commentName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    commentName
                                      .charAt(0)
                                      .toUpperCase()
                                  )}

                                </div>

                                <div className="min-w-0 flex-1 rounded-2xl bg-white/5 px-3 py-2">

                                  <p className="text-xs font-bold">
                                    {commentName}
                                  </p>

                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/70">
                                    {comment.content}
                                  </p>

                                </div>

                              </div>
                            );
                          })
                        )}

                      </div>

                      {/* COMMENT INPUT */}
                      <div className="mt-4 flex gap-2">

                        <input
                          value={
                            commentText[post.id] || ""
                          }
                          onChange={(e) =>
                            setCommentText((current) => ({
                              ...current,
                              [post.id]:
                                e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey
                            ) {
                              e.preventDefault();
                              submitComment(post.id);
                            }
                          }}
                          placeholder="Write a comment..."
                          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/50"
                        />

                        <button
                          onClick={() =>
                            submitComment(post.id)
                          }
                          disabled={
                            submittingComment ===
                              post.id ||
                            !(commentText[post.id] || "").trim()
                          }
                          className="rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {submittingComment ===
                          post.id
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

        </section>

      </div>

      {/* STANDARD NIKELINK BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 shadow-[0_-10px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl">

        <div className="mx-auto grid max-w-3xl grid-cols-4 px-2 py-2">

          {/* HOME */}
          <button
            onClick={() => router.push("/feed")}
            className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-blue-400"
          >
            <span className="text-xl leading-none">
              🏠
            </span>

            <span className="text-[11px] font-semibold">
              Home
            </span>
          </button>

          {/* DISCOVER */}
          <button
            onClick={() => router.push("/discover")}
            className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl leading-none">
              🔎
            </span>

            <span className="text-[11px] font-semibold">
              Discover
            </span>
          </button>

          {/* COMMUNITY */}
          <button
            onClick={() => router.push("/communities")}
            className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl leading-none">
              👥
            </span>

            <span className="text-[11px] font-semibold">
              Community
            </span>
          </button>

          {/* MESSAGES */}
          <button
            onClick={() => router.push("/messages")}
            className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl leading-none">
              💬
            </span>

            <span className="text-[11px] font-semibold">
              Messages
            </span>
          </button>

        </div>
      </nav>

    </main>
  );
}
