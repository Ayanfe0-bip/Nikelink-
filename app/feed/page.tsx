"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
};

export default function FeedPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("You");

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentProfiles, setCommentProfiles] = useState<
    Record<string, Profile>
  >({});

  const [newPost, setNewPost] = useState("");
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const [commentCounts, setCommentCounts] = useState<
    Record<string, number>
  >({});

  const [openComments, setOpenComments] = useState<Record<string, boolean>>(
    {}
  );

  const [submittingComment, setSubmittingComment] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // Load current user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profile) {
        setProfileName(
          profile.full_name || profile.username || currentUser.email || "You"
        );
      }

      // Load posts
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("id, user_id, content, created_at")
        .order("created_at", { ascending: false });

      if (postError) {
        console.error("Posts error:", postError);
        return;
      }

      const loadedPosts = postData || [];
      setPosts(loadedPosts);

      if (loadedPosts.length === 0) {
        setComments([]);
        setCommentCounts({});
        setLikeCounts({});
        setLikedPosts({});
        return;
      }

      const postIds = loadedPosts.map((post) => post.id);

      // -------------------------
      // LOAD LIKES
      // -------------------------
      const { data: likeData, error: likeError } = await supabase
        .from("likes")
        .select("id, post_id, user_id")
        .in("post_id", postIds);

      if (likeError) {
        console.error("Likes error:", likeError);
      }

      const counts: Record<string, number> = {};
      const userLikes: Record<string, boolean> = {};

      postIds.forEach((id) => {
        counts[id] = 0;
        userLikes[id] = false;
      });

      (likeData || []).forEach((like) => {
        counts[like.post_id] = (counts[like.post_id] || 0) + 1;

        if (like.user_id === currentUser.id) {
          userLikes[like.post_id] = true;
        }
      });

      setLikeCounts(counts);
      setLikedPosts(userLikes);

      // -------------------------
      // LOAD COMMENTS
      // -------------------------
      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .select("id, post_id, user_id, content, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      if (commentError) {
        console.error("Comments error:", commentError);
      }

      const loadedComments = commentData || [];
      setComments(loadedComments);

      const countsComments: Record<string, number> = {};

      postIds.forEach((id) => {
        countsComments[id] = 0;
      });

      loadedComments.forEach((comment) => {
        countsComments[comment.post_id] =
          (countsComments[comment.post_id] || 0) + 1;
      });

      setCommentCounts(countsComments);

      // -------------------------
      // LOAD COMMENT PROFILES
      // -------------------------
      const commenterIds = Array.from(
        new Set(loadedComments.map((comment) => comment.user_id))
      );

      if (commenterIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", commenterIds);

        const profileMap: Record<string, Profile> = {};

        (profiles || []).forEach((profile) => {
          profileMap[profile.id] = profile;
        });

        setCommentProfiles(profileMap);
      } else {
        setCommentProfiles({});
      }
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // CREATE POST
  // -------------------------
  async function createPost() {
    if (!user || !newPost.trim()) return;

    setPosting(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: newPost.trim(),
        })
        .select("id, user_id, content, created_at")
        .single();

      if (error) {
        console.error("Create post error:", error);
        alert(error.message);
        return;
      }

      if (data) {
        setPosts((current) => [data, ...current]);

        setLikeCounts((current) => ({
          ...current,
          [data.id]: 0,
        }));

        setLikedPosts((current) => ({
          ...current,
          [data.id]: false,
        }));

        setCommentCounts((current) => ({
          ...current,
          [data.id]: 0,
        }));
      }

      setNewPost("");
    } finally {
      setPosting(false);
    }
  }

  // -------------------------
  // LIKE
  // -------------------------
  async function handleLike(postId: string) {
    if (!user) return;

    const alreadyLiked = likedPosts[postId];

    // Optimistic UI
    setLikedPosts((current) => ({
      ...current,
      [postId]: !alreadyLiked,
    }));

    setLikeCounts((current) => ({
      ...current,
      [postId]: Math.max(
        0,
        (current[postId] || 0) + (alreadyLiked ? -1 : 1)
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
      const { error } = await supabase.from("likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (error) {
        console.error("Like error:", error);

        setLikedPosts((current) => ({
          ...current,
          [postId]: false,
        }));

        setLikeCounts((current) => ({
          ...current,
          [postId]: Math.max(0, (current[postId] || 0) - 1),
        }));
      }
    }
  }

  // -------------------------
  // TOGGLE COMMENTS
  // -------------------------
  function toggleComments(postId: string) {
    setOpenComments((current) => ({
      ...current,
      [postId]: !current[postId],
    }));
  }

  // -------------------------
  // ADD COMMENT
  // -------------------------
  async function addComment(postId: string) {
    if (!user) return;

    const text = commentText[postId]?.trim();

    if (!text) return;

    setSubmittingComment((current) => ({
      ...current,
      [postId]: true,
    }));

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: text,
        })
        .select("id, post_id, user_id, content, created_at")
        .single();

      if (error) {
        console.error("Comment error:", error);
        alert(error.message);
        return;
      }

      if (data) {
        setComments((current) => [...current, data]);

        setCommentCounts((current) => ({
          ...current,
          [postId]: (current[postId] || 0) + 1,
        }));

        setCommentProfiles((current) => ({
          ...current,
          [user.id]: {
            id: user.id,
            full_name: profileName,
            username: null,
          },
        }));

        setCommentText((current) => ({
          ...current,
          [postId]: "",
        }));

        setOpenComments((current) => ({
          ...current,
          [postId]: true,
        }));
      }
    } finally {
      setSubmittingComment((current) => ({
        ...current,
        [postId]: false,
      }));
    }
  }

  // -------------------------
  // DELETE COMMENT
  // -------------------------
  async function deleteComment(commentId: string, postId: string) {
    if (!user) return;

    const confirmed = window.confirm("Delete this comment?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete comment error:", error);
      alert(error.message);
      return;
    }

    setComments((current) =>
      current.filter((comment) => comment.id !== commentId)
    );

    setCommentCounts((current) => ({
      ...current,
      [postId]: Math.max(0, (current[postId] || 0) - 1),
    }));
  }

  function getCommenterName(userId: string) {
    const profile = commentProfiles[userId];

    if (!profile) {
      if (userId === user?.id) return profileName;
      return "Nikelink User";
    }

    return profile.full_name || profile.username || "Nikelink User";
  }

  function getInitial(name: string) {
    return name.charAt(0).toUpperCase();
  }

  function formatDate(date: string) {
    const created = new Date(date);
    const now = new Date();

    const difference = Math.floor(
      (now.getTime() - created.getTime()) / 1000
    );

    if (difference < 60) {
      return "Just now";
    }

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your feed...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white pb-24">
      {/* TOP NAV */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xl font-black tracking-tight"
          >
            Nikelink
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/discover")}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
            >
              🔍
            </button>

            <button
              onClick={() => router.push("/notifications")}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
            >
              🔔
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* CREATE POST */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 flex items-center justify-center font-bold shrink-0">
              {getInitial(profileName)}
            </div>

            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full resize-none bg-transparent outline-none text-white placeholder:text-white/40"
              />

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-white/40">
                  Share something with your community
                </div>

                <button
                  onClick={createPost}
                  disabled={posting || !newPost.trim()}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FEED */}
        <section className="mt-5 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🌍</div>
              <h2 className="text-xl font-bold">Your feed is empty</h2>
              <p className="text-white/50 mt-2">
                Be the first person to share something.
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const postComments = comments.filter(
                (comment) => comment.post_id === post.id
              );

              return (
                <article
                  key={post.id}
                  className="rounded-3xl border border-white/10 bg-white/[0]
