"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
};

type Member = {
  id: string;
  community_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type CommunityPost = {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Like = {
  id: string;
  post_id: string;
  user_id: string;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default function CommunityPage() {
  const router = useRouter();
  const params = useParams();

  const slug = String(params.slug || "");

  const [userId, setUserId] = useState("");

  const [community, setCommunity] =
    useState<Community | null>(null);

  const [members, setMembers] =
    useState<Member[]>([]);

  const [profiles, setProfiles] =
    useState<Record<string, Profile>>({});

  const [posts, setPosts] =
    useState<CommunityPost[]>([]);

  const [likes, setLikes] =
    useState<Like[]>([]);

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [newPost, setNewPost] =
    useState("");

  const [commentText, setCommentText] =
    useState<Record<string, string>>({});

  const [openComments, setOpenComments] =
    useState<Record<string, boolean>>({});

  const [loading, setLoading] =
    useState(true);

  const [posting, setPosting] =
    useState(false);

  const [working, setWorking] =
    useState(false);

  const [commenting, setCommenting] =
    useState<string | null>(null);

  const [deletingPost, setDeletingPost] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    loadCommunity();
  }, [slug]);

  async function loadCommunity() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const {
      data: communityData,
      error: communityError,
    } = await supabase
      .from("communities")
      .select(
        "id, name, slug, description, category, is_private, created_by, created_at"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (communityError) {
      console.error(
        "Community error:",
        communityError
      );

      setErrorMessage(
        "We couldn't load this community."
      );

      setLoading(false);
      return;
    }

    if (!communityData) {
      setErrorMessage(
        "This community does not exist."
      );

      setLoading(false);
      return;
    }

    setCommunity(communityData as Community);

    await loadCommunityData(
      communityData.id,
      user.id
    );

    setLoading(false);
  }

  async function loadCommunityData(
    communityId: string,
    currentUserId: string
  ) {
    const [
      membersResult,
      postsResult,
      likesResult,
      commentsResult,
    ] = await Promise.all([
      supabase
        .from("community_members")
        .select("*")
        .eq("community_id", communityId),

      supabase
        .from("community_posts")
        .select(
          "id, community_id, user_id, content, created_at"
        )
        .eq("community_id", communityId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("community_post_likes")
        .select(
          "id, post_id, user_id"
        ),

      supabase
        .from("community_post_comments")
        .select(
          "id, post_id, user_id, content, created_at"
        )
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (membersResult.error) {
      console.error(
        "Members error:",
        membersResult.error
      );
    }

    if (postsResult.error) {
      console.error(
        "Posts error:",
        postsResult.error
      );
    }

    if (likesResult.error) {
      console.error(
        "Likes error:",
        likesResult.error
      );
    }

    if (commentsResult.error) {
      console.error(
        "Comments error:",
        commentsResult.error
      );
    }

    const loadedMembers =
      (membersResult.data || []) as Member[];

    const loadedPosts =
      (postsResult.data || []) as CommunityPost[];

    const loadedLikes =
      (likesResult.data || []) as Like[];

    const loadedComments =
      (commentsResult.data || []) as Comment[];

    setMembers(loadedMembers);
    setPosts(loadedPosts);
    setLikes(loadedLikes);
    setComments(loadedComments);

    const userIds = Array.from(
      new Set([
        ...loadedMembers.map(
          (member) => member.user_id
        ),
        ...loadedPosts.map(
          (post) => post.user_id
        ),
        ...loadedLikes.map(
          (like) => like.user_id
        ),
        ...loadedComments.map(
          (comment) => comment.user_id
        ),
        currentUserId,
      ])
    );

    if (userIds.length > 0) {
      const { data: profileData } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, username, avatar_url"
          )
          .in("id", userIds);

      if (profileData) {
        const profileMap: Record<
          string,
          Profile
        > = {};

        profileData.forEach((profile) => {
          profileMap[profile.id] =
            profile as Profile;
        });

        setProfiles(profileMap);
      }
    }
  }

  const isMember = useMemo(() => {
    return members.some(
      (member) =>
        member.user_id === userId
    );
  }, [members, userId]);

  const isAdmin = useMemo(() => {
    return members.some(
      (member) =>
        member.user_id === userId &&
        member.role === "admin"
    );
  }, [members, userId]);

  async function joinCommunity() {
    if (
      !community ||
      !userId ||
      working
    ) {
      return;
    }

    setWorking(true);
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("community_members")
        .insert({
          community_id: community.id,
          user_id: userId,
          role: "member",
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Join community error:",
        error
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    if (data) {
      setMembers((current) => [
        ...current,
        data as Member,
      ]);
    }

    setSuccessMessage(
      "You joined the community."
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    setWorking(false);
  }

  async function leaveCommunity() {
    if (
      !community ||
      !userId ||
      working
    ) {
      return;
    }

    if (isAdmin) {
      setErrorMessage(
        "The community creator cannot leave this community yet."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to leave this community?"
      );

    if (!confirmed) {
      return;
    }

    setWorking(true);
    setErrorMessage("");

    const { error } =
      await supabase
        .from("community_members")
        .delete()
        .eq(
          "community_id",
          community.id
        )
        .eq("user_id", userId);

    if (error) {
      console.error(
        "Leave community error:",
        error
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    setMembers((current) =>
      current.filter(
        (member) =>
          member.user_id !== userId
      )
    );

    setSuccessMessage(
      "You left the community."
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    setWorking(false);
  }

  async function createPost(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !community ||
      !userId ||
      !isMember ||
      !newPost.trim() ||
      posting
    ) {
      return;
    }

    setPosting(true);
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("community_posts")
        .insert({
          community_id: community.id,
          user_id: userId,
          content: newPost.trim(),
        })
        .select(
          "id, community_id, user_id, content, created_at"
        )
        .single();

    if (error) {
      console.error(
        "Create community post error:",
        error
      );

      setErrorMessage(error.message);
      setPosting(false);
      return;
    }

    if (data) {
      setPosts((current) => [
        data as CommunityPost,
        ...current,
      ]);
    }

    setNewPost("");
    setPosting(false);

    setSuccessMessage(
      "Post published."
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 2000);
  }

  async function toggleLike(
    postId: string
  ) {
    if (!userId || !isMember) {
      return;
    }

    const existingLike =
      likes.find(
        (like) =>
          like.post_id === postId &&
          like.user_id === userId
      );

    if (existingLike) {
      const { error } =
        await supabase
          .from("community_post_likes")
          .delete()
          .eq(
            "id",
            existingLike.id
          );

      if (error) {
        setErrorMessage(
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

    const { data, error } =
      await supabase
        .from("community_post_likes")
        .insert({
          post_id: postId,
          user_id: userId,
        })
        .select(
          "id, post_id, user_id"
        )
        .single();

    if (error) {
      setErrorMessage(
        error.message
      );
      return;
    }

    if (data) {
      setLikes((current) => [
        ...current,
        data as Like,
      ]);
    }
  }

  async function submitComment(
    postId: string
  ) {
    const content =
      (
        commentText[postId] ||
        ""
      ).trim();

    if (
      !content ||
      !userId ||
      !isMember
    ) {
      return;
    }

    setCommenting(postId);
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from(
          "community_post_comments"
        )
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
      console.error(
        "Comment error:",
        error
      );

      setErrorMessage(
        error.message
      );

      setCommenting(null);
      return;
    }

    if (data) {
      setComments((current) => [
        ...current,
        data as Comment,
      ]);
    }

    setCommentText((current) => ({
      ...current,
      [postId]: "",
    }));

    setOpenComments((current) => ({
      ...current,
      [postId]: true,
    }));

    setCommenting(null);
  }

  async function deletePost(
    postId: string
  ) {
    if (
      !userId ||
      deletingPost
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this community post?"
      );

    if (!confirmed) {
      return;
    }

    setDeletingPost(postId);
    setErrorMessage("");

    const { error } =
      await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", userId);

    if (error) {
      console.error(
        "Delete post error:",
        error
      );

      setErrorMessage(
        error.message
      );

      setDeletingPost(null);
      return;
    }

    setPosts((current) =>
      current.filter(
        (post) =>
          post.id !== postId
      )
    );

    setLikes((current) =>
      current.filter(
        (like) =>
          like.post_id !== postId
      )
    );

    setComments((current) =>
      current.filter(
        (comment) =>
          comment.post_id !== postId
      )
    );

    setDeletingPost(null);

    setSuccessMessage(
      "Post deleted."
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 2000);
  }

  function getProfile(
    profileId: string
  ) {
    return profiles[profileId];
  }

  function getInitials(
    profileId: string
  ) {
    const profile =
      getProfile(profileId);

    const name =
      profile?.full_name?.trim();

    if (name) {
      const parts =
        name.split(/\s+/);

      if (parts.length >= 2) {
        return (
          parts[0]
            .charAt(0) +
          parts[
            parts.length - 1
          ].charAt(0)
        ).toUpperCase();
      }

      return name
        .charAt(0)
        .toUpperCase();
    }

    if (
      profile?.username?.trim()
    ) {
      return profile.username
        .trim()
        .charAt(0)
        .toUpperCase();
    }

    return "?";
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
        comment.post_id === postId
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <div className="animate-pulse">
            <div className="h-6 w-24 rounded bg-white/10" />

            <div className="mt-4 h-10 w-56 rounded bg-white/10" />

            <div className="mt-3 h-4 w-72 rounded bg-white/10" />

            <div className="mt-8 h-32 rounded-[2rem] bg-white/5" />

            <div className="mt-6 space-y-4">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-44 rounded-[2rem] bg-white/5"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!community) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] px-5 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
          <div className="text-5xl">
            🌍
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Community not found
          </h1>

          <p className="mt-2 text-sm text-white/40">
            {errorMessage ||
              "This community may have been removed."}
          </p>

          <button
            onClick={() =>
              router.push(
                "/communities"
              )
            }
            className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold"
          >
            Back to Communities
          </button>
        </div>
      </main>
    );
  }

  const memberPreview =
    members.slice(0, 8);

  return (
    <main className="min-h-screen bg-[#050816] pb-28 text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute -right-40 top-[40%] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/90 px-4 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={() =>
              router.push(
                "/communities"
              )
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Back"
          >
            ←
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">
              {community.name}
            </p>

            <p className="truncate text-[10px] text-white/35">
              {members.length}{" "}
              {members.length === 1
                ? "member"
                : "members"}
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                "/notifications"
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg"
            aria-label="Notifications"
          >
            🔔
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-4 py-5">
                {/* COMMUNITY HERO */}
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-blue-600/10 to-pink-600/10 p-6">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-3xl shadow-xl shadow-violet-600/20">
                {community.category === "Technology"
                  ? "💻"
                  : community.category === "Business"
                  ? "💼"
                  : community.category === "Education"
                  ? "📚"
                  : community.category === "Music"
                  ? "🎵"
                  : community.category === "Gaming"
                  ? "🎮"
                  : community.category === "Sports"
                  ? "⚽"
                  : community.category === "Creators"
                  ? "🎨"
                  : community.category === "Travel"
                  ? "✈️"
                  : "🌍"}
              </div>

              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold text-white/60">
                {community.is_private
                  ? "🔒 Private"
                  : "🌍 Public"}
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight">
              {community.name}
            </h1>

            {community.category && (
              <p className="mt-1 text-xs font-semibold text-violet-300">
                {community.category}
              </p>
            )}

            {community.description && (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
                {community.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/40">
              <span>
                👥 {members.length}{" "}
                {members.length === 1
                  ? "member"
                  : "members"}
              </span>

              <span>•</span>

              <span>
                {posts.length}{" "}
                {posts.length === 1
                  ? "post"
                  : "posts"}
              </span>
            </div>

            {/* MEMBER AVATARS */}
            {memberPreview.length > 0 && (
              <div className="mt-5 flex items-center">
                <div className="flex -space-x-2">
                  {memberPreview.map((member) => {
                    const profile = getProfile(
                      member.user_id
                    );

                    return (
                      <div
                        key={member.id}
                        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#111426] bg-gradient-to-br from-violet-600 to-blue-600 text-[10px] font-black"
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(
                            member.user_id
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {members.length > 8 && (
                  <span className="ml-3 text-xs text-white/35">
                    +{members.length - 8} more
                  </span>
                )}
              </div>
            )}

            {/* MEMBERSHIP ACTION */}
            <div className="mt-6">
              {isMember ? (
                <button
                  onClick={leaveCommunity}
                  disabled={working || isAdmin}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/65 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isAdmin
                    ? "✓ Community Admin"
                    : working
                    ? "Leaving..."
                    : "✓ Joined Community"}
                </button>
              ) : (
                <button
                  onClick={joinCommunity}
                  disabled={working}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-black shadow-lg shadow-violet-600/20 transition hover:opacity-90 disabled:opacity-50"
                >
                  {working
                    ? "Joining..."
                    : community.is_private
                    ? "Request to Join"
                    : "Join Community"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* PRIVATE / NOT MEMBER */}
        {!isMember && community.is_private && (
          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-3xl">
              🔒
            </div>

            <h2 className="mt-5 text-lg font-black">
              Private community
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Join this community to participate in
              discussions, create posts and interact
              with members.
            </p>
          </div>
        )}

        {/* CREATE POST */}
        {isMember && (
          <form
            onSubmit={createPost}
            className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4"
          >
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-black">
                {profiles[userId]?.avatar_url ? (
                  <img
                    src={profiles[userId].avatar_url || ""}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(userId)
                )}
              </div>

              <textarea
                value={newPost}
                onChange={(e) =>
                  setNewPost(e.target.value)
                }
                placeholder={`Share something with ${community.name}...`}
                rows={3}
                maxLength={2000}
                className="min-h-[80px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-500/40"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[10px] text-white/25">
                {newPost.length}/2000
              </span>

              <button
                type="submit"
                disabled={
                  posting || !newPost.trim()
                }
                className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-xs font-black shadow-lg shadow-violet-600/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        )}

        {/* FEED TITLE */}
        <div className="mb-4 mt-8 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black">
              Community feed
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Conversations from {community.name}
            </p>
          </div>
        </div>

        {/* EMPTY FEED */}
        {posts.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center">
            <div className="text-4xl">💬</div>

            <h3 className="mt-4 text-lg font-black">
              No posts yet
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
              {isMember
                ? "Be the first person to start a conversation in this community."
                : "Join the community to start participating."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => {
              const profile = getProfile(
                post.user_id
              );

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
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-xl shadow-black/10"
                >
                  {/* POST HEADER */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-black">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(post.user_id)
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {profile?.full_name ||
                            profile?.username ||
                            "Nikelink User"}
                        </p>

                        {profile?.username && (
                          <p className="truncate text-[10px] text-violet-300/60">
                            @{profile.username}
                          </p>
                        )}

                        <p className="text-[10px] text-white/25">
                          {formatDate(
                            post.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    {isOwnPost && (
                      <button
                        onClick={() =>
                          deletePost(post.id)
                        }
                        disabled={
                          deletingPost ===
                          post.id
                        }
                        className="rounded-full px-3 py-2 text-xs text-white/30 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                      >
                        {deletingPost === post.id
                          ? "..."
                          : "⋯"}
                      </button>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="px-4 pb-4">
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-white/90">
                      {post.content}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="border-t border-white/10 px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          toggleLike(post.id)
                        }
                        disabled={!isMember}
                        className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                          userLiked
                            ? "bg-pink-500/10 text-pink-400"
                            : "text-white/50 hover:bg-white/5 hover:text-pink-400"
                        } disabled:cursor-not-allowed disabled:opacity-40`}
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
                    </div>
                  </div>

                  {/* COMMENTS */}
                  {openComments[post.id] && (
                    <div className="border-t border-white/10 px-4 pb-4 pt-3">
                      <div className="space-y-3">
                        {postComments.length ===
                        0 ? (
                          <p className="py-2 text-center text-xs text-white/25">
                            No comments yet.
                          </p>
                        ) : (
                          postComments.map(
                            (comment) => {
                              const commentProfile =
                                getProfile(
                                  comment.user_id
                                );

                              return (
                                <div
                                  key={
                                    comment.id
                                  }
                                  className="flex gap-3"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-[9px] font-black">
                                    {commentProfile?.avatar_url ? (
                                      <img
                                        src={
                                          commentProfile.avatar_url
                                        }
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      getInitials(
                                        comment.user_id
                                      )
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1 rounded-2xl bg-white/[0.045] px-3 py-2">
                                    <p className="text-xs font-bold">
                                      {commentProfile?.full_name ||
                                        commentProfile?.username ||
                                        "Nikelink User"}
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/65">
                                      {comment.content}
                                    </p>

                                    <p className="mt-1 text-[9px] text-white/20">
                                      {formatDate(
                                        comment.created_at
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          )
                        )}
                      </div>

                                            {/* COMMENT INPUT */}
                      {isMember && (
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
                                    e.target
                                      .value,
                                })
                              )
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key ===
                                  "Enter" &&
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
                            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-violet-500/40"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              submitComment(
                                post.id
                              )
                            }
                            disabled={
                              commenting ===
                                post.id ||
                              !(
                                commentText[
                                  post.id
                                ] || ""
                              ).trim()
                            }
                            className="rounded-full bg-violet-600 px-4 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            {commenting === post.id
                              ? "..."
                              : "Send"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 px-3 py-3 backdrop-blur-2xl">
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
          <button
            onClick={() =>
              router.push("/feed")
            }
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl">
              ⌂
            </span>

            <span className="text-[10px] font-bold">
              Home
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/discover")
            }
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl">
              ⌕
            </span>

            <span className="text-[10px] font-bold">
              Discover
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/communities")
            }
            className="flex flex-col items-center gap-1 rounded-xl bg-violet-500/10 py-2 text-violet-300"
          >
            <span className="text-xl">
              ◉
            </span>

            <span className="text-[10px] font-bold">
              Community
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/messages")
            }
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl">
              ✉
            </span>

            <span className="text-[10px] font-bold">
              Messages
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/profile")
            }
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-xl">
              👤
            </span>

            <span className="text-[10px] font-bold">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
}
