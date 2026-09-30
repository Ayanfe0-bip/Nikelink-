"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
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
  interests?: string[] | null;
};

export default function FeedPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [unreadNotifications, setUnreadNotifications] =
  useState(0);
  const [highlightedPostId, setHighlightedPostId] =
  useState<string | null>(null);
  const [userName, setUserName] =
    useState("Nikelink User");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userInterests, setUserInterests] =
    useState<string[]>([]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] =
    useState<Comment[]>([]);
  const [likes, setLikes] =
    useState<Like[]>([]);

  const [profiles, setProfiles] =
    useState<Record<string, Profile>>({});

  const [commentText, setCommentText] =
    useState<Record<string, string>>({});

  const [openComments, setOpenComments] =
    useState<Record<string, boolean>>({});

  const [openMenu, setOpenMenu] =
    useState<string | null>(null);

  const [submittingComment, setSubmittingComment] =
    useState<string | null>(null);

  const [deletingPost, setDeletingPost] =
    useState<string | null>(null);

  const [newPost, setNewPost] = useState("");

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [posting, setPosting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadFeed();
  }, []);
useEffect(() => {
  const params = new URLSearchParams(
    window.location.search
  );
useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel(`feed-notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notification",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        setUnreadNotifications(
          (current) => current + 1
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
  const postId = params.get("post");

  if (postId) {
    setHighlightedPostId(postId);
  }
}, []);
  async function loadFeed() {
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }
  const currentUserId = userData.user.id;

setUserId(currentUserId);

const { count } = await supabase
  .from("notification")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("user_id", currentUserId)
  .eq("is_read", false);

setUnreadNotifications(
  count || 0
);

const { data: profile } =  
          await supabase
        .from("profiles")
        .select(
          "id, full_name, username, avatar_url, interests"
        )
        .eq("id", currentUserId)
        .maybeSingle();

    if (profile) {
      setUserName(
        profile.full_name ||
          profile.username ||
          "Nikelink User"
      );

      setAvatarUrl(
        profile.avatar_url || ""
      );

      setUserInterests(
        Array.isArray(profile.interests)
          ? profile.interests
          : []
      );
    }

    await Promise.all([
      loadPosts(),
      loadComments(),
      loadLikes(),
    ]);

    setLoading(false);
  }

  async function loadPosts() {
    const {
      data,
      error,
    } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Posts error:",
        error
      );
      return;
    }

    if (!data) return;

    setPosts(data);

    const userIds = Array.from(
      new Set(
        data.map(
          (post) => post.user_id
        )
      )
    );

    if (userIds.length === 0) {
      return;
    }

    const {
      data: authorProfiles,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url, interests"
      )
      .in("id", userIds);

    if (profileError) {
      console.error(
        "Author profiles error:",
        profileError
      );
      return;
    }

    if (!authorProfiles) return;

    const profileMap: Record<
      string,
      Profile
    > = {};

    authorProfiles.forEach(
      (profile) => {
        profileMap[profile.id] =
          profile;
      }
    );

    setProfiles(profileMap);
  }

  async function loadComments() {
    const {
      data,
      error,
    } = await supabase
      .from("comments")
      .select(
        "id, post_id, user_id, content, created_at"
      )
      .order("created_at", {
        ascending: true,
      });

    if (!error && data) {
      setComments(data);
    }
  }

  async function loadLikes() {
    const {
      data,
      error,
    } = await supabase
      .from("likes")
      .select(
        "id, post_id, user_id"
      );

    if (!error && data) {
      setLikes(data);
    }
  }

  function handleImageSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select an image."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setMessage(
        "Image must be smaller than 5MB."
      );
      return;
    }

    setSelectedImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  async function handleCreatePost(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !userId ||
      (!newPost.trim() &&
        !selectedImage)
    ) {
      return;
    }

    setPosting(true);
    setMessage("");

    const content =
      newPost.trim();

    let imageUrl = "";

    if (selectedImage) {
      const extension =
        selectedImage.name
          .split(".")
          .pop() || "jpg";

      const filePath =
        `${userId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("post-media")
        .upload(
          filePath,
          selectedImage,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        setMessage(
          uploadError.message
        );
        setPosting(false);
        return;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("post-media")
        .getPublicUrl(
          filePath
        );

      imageUrl =
        publicUrlData.publicUrl;
    }

    const {
      data,
      error,
    } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content,
        image_url:
          imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      setPosting(false);
      return;
    }

    if (data) {
      setPosts((current) => [
        data,
        ...current,
      ]);

      setProfiles((current) => ({
        ...current,
        [userId]: {
          id: userId,
          full_name: userName,
          username: null,
          avatar_url: avatarUrl,
          interests:
            userInterests,
        },
      }));
    }

    setNewPost("");
    setSelectedImage(null);
    setImagePreview("");

    setPosting(false);
    setMessage(
      "Post published."
    );

    setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  async function toggleLike(
    postId: string
  ) {
    if (!userId) return;

    const existingLike =
      likes.find(
        (like) =>
          like.post_id ===
            postId &&
          like.user_id ===
            userId
      );

    if (existingLike) {
      const { error } =
        await supabase
          .from("likes")
          .delete()
          .eq(
            "post_id",
            postId
          )
          .eq(
            "user_id",
            userId
          );

      if (error) {
        setMessage(
          error.message
        );
        return;
      }

      setLikes((current) =>
        current.filter(
          (like) =>
            like.id !==
            existingLike.id
        )
      );

      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("likes")
      .insert({
        post_id: postId,
        user_id: userId,
      })
      .select(
        "id, post_id, user_id"
      )
      .single();

    if (error) {
      setMessage(
        error.message
      );
      return;
    }

    if (data) {
      setLikes((current) => [
        ...current,
        data,
      ]);
    }
  }

  async function submitComment(
    postId: string
  ) {
    const content = (
      commentText[postId] ||
      ""
    ).trim();

    if (!content || !userId) {
      return;
    }

    setSubmittingComment(
      postId
    );

    setMessage("");

    const {
      data,
      error,
    } = await supabase
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
      setMessage(
        error.message
      );

      setSubmittingComment(
        null
      );

      return;
    }

    if (data) {
      setComments((current) => [
        ...current,
        data,
      ]);
    }

    setCommentText(
      (current) => ({
        ...current,
        [postId]: "",
      })
    );

    setOpenComments(
      (current) => ({
        ...current,
        [postId]: true,
      })
    );

    setSubmittingComment(
      null
    );
  }

  async function handleShare(
    post: Post
  ) {
    const shareUrl =
      `${window.location.origin}/feed?post=${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Nikelink",
          text: post.content.slice(
            0,
            120
          ),
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(
        shareUrl
      );

      setMessage(
        "Post link copied."
      );

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.log(
        "Share cancelled:",
        error
      );
    }
  }

  async function handleDeletePost(
    postId: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this post?"
      );

    if (!confirmed) {
      setOpenMenu(null);
      return;
    }

    setDeletingPost(postId);
    setMessage("");

    const post =
      posts.find(
        (item) =>
          item.id === postId
      );

    const { error } =
      await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq(
          "user_id",
          userId
        );

    if (error) {
      setMessage(
        error.message
      );
      setDeletingPost(null);
      return;
    }

    if (post?.image_url) {
      try {
        const marker =
          "/post-media/";

        const index =
          post.image_url.indexOf(
            marker
          );

        if (index !== -1) {
          const filePath =
            post.image_url.slice(
              index +
                marker.length
            );

          await supabase.storage
            .from(
              "post-media"
            )
            .remove([
              filePath,
            ]);
        }
      } catch (storageError) {
        console.log(
          "Image cleanup error:",
          storageError
        );
      }
    }

    setPosts((current) =>
      current.filter(
        (item) =>
          item.id !== postId
      )
    );

    setComments((current) =>
      current.filter(
        (comment) =>
          comment.post_id !==
          postId
      )
    );

    setLikes((current) =>
      current.filter(
        (like) =>
          like.post_id !==
          postId
      )
    );

    setOpenMenu(null);
    setDeletingPost(null);

    setMessage(
      "Post deleted."
    );

    setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  function handleReportPost(
    postId: string
  ) {
    setOpenMenu(null);

    setMessage(
      "Post reported."
    );

    console.log(
      "Reported post:",
      postId
    );

    setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  function formatDate(
    date: string
  ) {
    const created =
      new Date(date);

    const now =
      new Date();

    const difference =
      Math.floor(
        (now.getTime() -
          created.getTime()) /
          1000
      );

    if (difference < 60) {
      return "Just now";
    }

    if (difference < 3600) {
      return `${Math.floor(
        difference / 60
      )}m`;
    }

    if (difference < 86400) {
      return `${Math.floor(
        difference / 3600
      )}h`;
    }

    if (difference < 604800) {
      return `${Math.floor(
        difference / 86400
      )}d`;
    }

    return created.toLocaleDateString();
  }
useEffect(() => {
  if (
    !highlightedPostId ||
    posts.length === 0
  ) {
    return;
  }

  const timer = window.setTimeout(() => {
    const element =
      document.getElementById(
        `post-${highlightedPostId}`
      );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    element.classList.add(
      "ring-2",
      "ring-violet-400/70",
      "shadow-2xl",
      "shadow-violet-500/20"
    );

    window.setTimeout(() => {
      element.classList.remove(
        "ring-2",
        "ring-violet-400/70",
        "shadow-2xl",
        "shadow-violet-500/20"
      );
    }, 3000);
  }, 300);

  return () => {
    window.clearTimeout(timer);
  };
}, [
  highlightedPostId,
  posts.length,
]);
  function getPostLikes(
    postId: string
  ) {
    return likes.filter(
      (like) =>
        like.post_id === postId
    );
  }

  function getPostComments(
    postId: string
  ) {
    return comments.filter(
      (comment) =>
        comment.post_id ===
        postId
    );
  }

  function getAuthor(
    post: Post
  ) {
    if (
      post.user_id ===
      userId
    ) {
      return {
        full_name: userName,
        username: null,
        avatar_url:
          avatarUrl,
      };
    }

    return (
      profiles[post.user_id] || {
        full_name:
          "Nikelink User",
        username: null,
        avatar_url: null,
      }
    );
  }

  function getPersonalizationScore(
    post: Post
  ) {
    const author =
      profiles[post.user_id];

    if (
      !author?.interests
        ?.length
    ) {
      return 0;
    }

    if (
      !userInterests.length
    ) {
      return 0;
    }

    const userInterestSet =
      new Set(
        userInterests.map(
          (interest) =>
            interest
              .toLowerCase()
              .trim()
        )
      );

    return author.interests.filter(
      (interest) =>
        userInterestSet.has(
          interest
            .toLowerCase()
            .trim()
        )
    ).length;
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

      {/* TOP NAV */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">

          <button
            onClick={() =>
              router.push("/feed")
            }
            className="text-2xl font-black tracking-tight"
          >
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Nikelink
            </span>
          </button>

          <div className="flex items-center gap-2">

            <button
  onClick={() =>
    router.push(
      "/notifications"
    )
  }
  aria-label="Notifications"
  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
>
  🔔

  {unreadNotifications > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white shadow-lg shadow-pink-500/30">
      {unreadNotifications > 99
        ? "99+"
        : unreadNotifications}
    </span>
  )}
</button>

            <button
              onClick={() =>
                router.push(
                  "/profile"
                )
              }
              aria-label="Profile"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-bold shadow-lg shadow-blue-500/20"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                userName
                  .charAt(0)
                  .toUpperCase()
              )}
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

          <p className="mt-1 text-sm text-white/30">
            Connect. Share. Belong.
          </p>
        </div>

        {/* PERSONALIZED FEED */}
        {userInterests.length >
          0 && (
          <div className="mb-5 rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] px-4 py-3">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500">
                ✨
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold">
                  Your personalized feed
                </p>

                <p className="mt-0.5 truncate text-xs text-white/35">
                  Based on your interests
                </p>
              </div>

            </div>
          </div>
        )}

        {/* CREATE POST */}
        <form
          onSubmit={
            handleCreatePost
          }
          className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
        >

          <div className="flex gap-3">

            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-bold">

              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {userName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

            </div>

            <textarea
              value={newPost}
              onChange={(e) =>
                setNewPost(
                  e.target.value
                )
              }
              placeholder="What's happening?"
              rows={3}
              maxLength={2000}
              className="min-h-[80px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/50"
            />

          </div>

          {/* IMAGE PREVIEW */}
          {imagePreview && (
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10">

              <img
                src={imagePreview}
                alt="Selected image"
                className="max-h-80 w-full object-cover"
              />

              <button
                type="button"
                onClick={() => {
                  setSelectedImage(
                    null
                  );

                  setImagePreview(
                    ""
                  );
                }}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white"
                aria-label="Remove image"
              >
                ✕
              </button>

            </div>
          )}

                    {/* IMAGE PICKER */}
          <div className="mt-3 flex items-center gap-2">

            <label className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white">

              📷 Add image

              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

            </label>

            {selectedImage && (
              <span className="max-w-[180px] truncate text-xs text-white/30">
                {selectedImage.name}
              </span>
            )}

          </div>

          {/* POST BUTTON */}
          <div className="mt-3 flex items-center justify-between gap-3">

            <span className="text-xs text-white/30">
              Share something with the community
            </span>

            <button
              type="submit"
              disabled={
                posting ||
                (!newPost.trim() &&
                  !selectedImage)
              }
              className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2 text-sm font-bold shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {posting
                ? "Posting..."
                : "Post"}
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
            [...posts]
              .sort((a, b) => {

                const scoreA =
                  getPersonalizationScore(a);

                const scoreB =
                  getPersonalizationScore(b);

                if (scoreA !== scoreB) {
                  return scoreB - scoreA;
                }

                return (
                  new Date(
                    b.created_at
                  ).getTime() -
                  new Date(
                    a.created_at
                  ).getTime()
                );
              })
              .map((post) => {

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

                const author =
                  getAuthor(post);

                return (
                  <article
                    key={post.id}
                    className="relative overflow-visible rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20"
                  >

                    {/* POST HEADER */}
                    <div className="flex items-center justify-between p-4">

                      <div className="flex items-center gap-3">

                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 font-bold">

                          {author.avatar_url ? (
                            <img
                              src={author.avatar_url}
                              alt={
                                author.full_name ||
                                author.username ||
                                "Nikelink User"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              {(
                                author.full_name ||
                                author.username ||
                                "N"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                        </div>

                        <div>

                          <p className="text-sm font-semibold">
                            {author.full_name ||
                              author.username ||
                              "Nikelink User"}
                          </p>

                          {author.username && (
                            <p className="text-xs text-white/30">
                              @{author.username}
                            </p>
                          )}

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
                          aria-label="Post menu"
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
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/10"
                            >
                              <span>↗️</span>

                              <span>
                                Share post
                              </span>
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
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
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
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/10"
                              >
                                <span>⚑</span>

                                <span>
                                  Report post
                                </span>
                              </button>
                            )}

                          </div>
                        )}

                      </div>

                    </div>

                    {/* POST CONTENT */}
                    <div className="px-4 pb-4">

                      {post.content && (
                        <p className="whitespace-pre-wrap text-[15px] leading-7 text-white/90">
                          {post.content}
                        </p>
                      )}

                      {/* POST IMAGE */}
                      {post.image_url && (
                        <div
                          className={`overflow-hidden rounded-2xl ${
                            post.content
                              ? "mt-4"
                              : ""
                          }`}
                        >
                          <img
                            src={post.image_url}
                            alt="Post image"
                            className="max-h-[520px] w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

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
                    {openComments[post.id] && (
                      <div className="border-t border-white/10 px-4 pb-4 pt-3">

                        <div className="space-y-3">

                          {postComments.length === 0 ? (
                            <p className="py-2 text-center text-xs text-white/30">
                              No comments yet.
                            </p>
                          ) : (
                            postComments.map(
                              (comment) => (
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
                                      {formatDate(
                                        comment.created_at
                                      )}
                                    </p>

                                  </div>

                                </div>
                              )
                            )
                          )}

                        </div>

                        {/* COMMENT INPUT */}
                        <div className="mt-4 flex gap-2">

                          <input
                            value={
                              commentText[
                                post.id
                              ] || ""
                            }
                            onChange={(e) =>
                              setCommentText(
                                (current) => ({
                                  ...current,
                                  [post.id]:
                                    e.target.value,
                                })
                              )
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                !e.shiftKey
                              ) {
                                e.preventDefault();

                                if (
                                  (
                                    commentText[
                                      post.id
                                    ] || ""
                                  ).trim()
                                ) {
                                  submitComment(
                                    post.id
                                  );
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
                              submitComment(
                                post.id
                              )
                            }
                            disabled={
                              submittingComment ===
                                post.id ||
                              !(
                                commentText[
                                  post.id
                                ] || ""
                              ).trim()
                            }
                            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
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

        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">

          {/* HOME */}
          <button
            onClick={() =>
              router.push("/feed")
            }
            className="flex min-w-[60px] flex-col items-center gap-1 px-3 py-2 text-blue-400"
          >
            <span className="text-xl">
              🏠
            </span>

            <span className="text-[10px] font-medium">
              Home
            </span>
          </button>

          {/* DISCOVER */}
          <button
            onClick={() =>
              router.push("/discover")
            }
            className="flex min-w-[60px] flex-col items-center gap-1 px-3 py-2 text-white/40 transition hover:text-white"
          >
            <span className="text-xl">
              🔎
            </span>

            <span className="text-[10px] font-medium">
              Discover
            </span>
          </button>

          {/* CREATE */}
          <button
            onClick={() => {
              const textarea =
                document.querySelector(
                  "textarea"
                ) as HTMLTextAreaElement | null;

              if (textarea) {
                textarea.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });

                setTimeout(() => {
                  textarea.focus();
                }, 400);
              }
            }}
            aria-label="Create post"
            className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-2xl font-bold shadow-xl shadow-blue-500/30 transition hover:scale-105"
          >
            +
          </button>

                {/* NOTIFICATIONS */}
      <button
        onClick={() =>
          router.push("/notifications")
        }
        className="flex min-w-[60px] flex-col items-center gap-1 px-3 py-2 text-white/40 transition hover:text-white"
      >
        <span className="text-xl">
          🔔
        </span>

        <span className="text-[10px] font-medium">
          Alerts
        </span>
      </button>

      {/* PROFILE */}
      <button
        onClick={() =>
          router.push("/profile")
        }
        className="flex min-w-[60px] flex-col items-center gap-1 px-3 py-2 text-white/40 transition hover:text-white"
      >
        <span className="text-xl">
          👤
        </span>

        <span className="text-[10px] font-medium">
          Profile
        </span>
      </button>

    </div>
  </nav>

</main>
);
}
