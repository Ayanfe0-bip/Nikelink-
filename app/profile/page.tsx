"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const interestOptions = [
  "Technology",
  "Business",
  "Music",
  "Sports",
  "Education",
  "Fashion",
  "Gaming",
  "Travel",
  "Art",
  "Photography",
  "Movies",
  "Fitness",
];

type PublicProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  age_group: string | null;
  interests: string[] | null;
  avatar_url: string | null;
};

type PublicPost = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status:
    | "pending"
    | "accepted"
    | "declined";
};

type PostLike = {
  id: string;
  post_id: string;
  user_id: string;
};

type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [userId, setUserId] = useState("");
  const [profileUserId, setProfileUserId] =
    useState("");

  const [isPublicProfile, setIsPublicProfile] =
    useState(false);

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const [email, setEmail] = useState("");

  const [fullName, setFullName] =
    useState("");
  const [username, setUsername] =
    useState("");
  const [country, setCountry] =
    useState("");
  const [bio, setBio] =
    useState("");
  const [ageGroup, setAgeGroup] =
    useState("");
  const [interests, setInterests] =
    useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] =
    useState("");

  /* SOCIAL STATS */
  const [connectionCount, setConnectionCount] =
    useState(0);
  const [postCount, setPostCount] =
    useState(0);
  const [communityCount, setCommunityCount] =
    useState(0);
  const [statsLoading, setStatsLoading] =
    useState(true);

  /* PUBLIC PROFILE */
  const [publicProfile, setPublicProfile] =
    useState<PublicProfile | null>(null);

  const [publicPosts, setPublicPosts] =
    useState<PublicPost[]>([]);

  const [publicLikes, setPublicLikes] =
    useState<PostLike[]>([]);

  const [publicComments, setPublicComments] =
    useState<PostComment[]>([]);

  const [publicConnections, setPublicConnections] =
    useState<Connection[]>([]);

  const [publicLoading, setPublicLoading] =
    useState(false);

  const [publicStatsLoading, setPublicStatsLoading] =
    useState(false);

  const [publicPostLoading, setPublicPostLoading] =
    useState(false);

  const [connectionAction, setConnectionAction] =
    useState(false);

  const [openComments, setOpenComments] =
    useState<Record<string, boolean>>({});

  const [commentText, setCommentText] =
    useState<Record<string, string>>({});

  const [commentingPost, setCommentingPost] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * LOAD CURRENT USER
   */
  useEffect(() => {
    async function loadProfile() {
      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        router.replace("/login");
        return;
      }

      const user =
        userData.user;

      setUserId(user.id);
      setEmail(user.email ?? "");

      /*
       * Detect whether another user's
       * profile was requested.
       */
      const params =
        new URLSearchParams(
          window.location.search
        );

      const requestedUser =
        params.get("user");

      const viewingPublicProfile =
        Boolean(
          requestedUser &&
            requestedUser !== user.id
        );

      setIsPublicProfile(
        viewingPublicProfile
      );

      if (viewingPublicProfile) {
        setProfileUserId(
          requestedUser!
        );

        setLoading(false);
        return;
      }

      setProfileUserId(user.id);

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

      if (profile) {
        setFullName(
          profile.full_name ?? ""
        );

        setUsername(
          profile.username ?? ""
        );

        setCountry(
          profile.country ?? ""
        );

        setBio(
          profile.bio ?? ""
        );

        setAgeGroup(
          profile.age_group ?? ""
        );

        setInterests(
          profile.interests ?? []
        );

        setAvatarUrl(
          profile.avatar_url ?? ""
        );
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  /*
   * LOAD PUBLIC PROFILE
   */
  useEffect(() => {
    if (
      !isPublicProfile ||
      !profileUserId
    ) {
      return;
    }

    async function loadPublicProfile() {
      setPublicLoading(true);
      setPublicStatsLoading(true);
      setPublicPostLoading(true);

      try {
        const [
          profileResult,
          connectionsResult,
          postsResult,
          communitiesResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, full_name, username, country, bio, age_group, interests, avatar_url"
            )
            .eq("id", profileUserId)
            .maybeSingle(),

          supabase
            .from("connection")
            .select(
              "id, requester_id, receiver_id, status"
            )
            .eq("status", "accepted")
            .or(
              `requester_id.eq.${profileUserId},receiver_id.eq.${profileUserId}`
            ),

          supabase
            .from("posts")
            .select(
              "id, user_id, content, created_at"
            )
            .eq(
              "user_id",
              profileUserId
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            ),

          supabase
            .from("community_members")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "user_id",
              profileUserId
            ),
        ]);

        if (
          profileResult.error ||
          !profileResult.data
        ) {
          setMessage(
            "This profile could not be found."
          );
          return;
        }

        setPublicProfile(
          profileResult.data as PublicProfile
        );

        if (
          !connectionsResult.error
        ) {
          setPublicConnections(
            (connectionsResult.data ||
              []) as Connection[]
          );
        }

        if (
          !postsResult.error
        ) {
          const posts =
            (postsResult.data ||
              []) as PublicPost[];

          setPublicPosts(posts);

          setPostCount(
            posts.length
          );

          /*
           * Load likes and comments
           * for this user's posts.
           */
          if (posts.length > 0) {
            const postIds =
              posts.map(
                (post) => post.id
              );

            const [
              likesResult,
              commentsResult,
            ] =
              await Promise.all([
                supabase
                  .from(
                    "likes"
                  )
                  .select(
                    "id, post_id, user_id"
                  )
                  .in(
                    "post_id",
                    postIds
                  ),

                supabase
                  .from(
                    "comments"
                  )
                  .select(
                    "id, post_id, user_id, content, created_at"
                  )
                  .in(
                    "post_id",
                    postIds
                  )
                  .order(
                    "created_at",
                    {
                      ascending: true,
                    }
                  ),
              ]);

            if (
              !likesResult.error
            ) {
              setPublicLikes(
                (likesResult.data ||
                  []) as PostLike[]
              );
            }

            if (
              !commentsResult.error
            ) {
              setPublicComments(
                (commentsResult.data ||
                  []) as PostComment[]
              );
            }
          }
        }

        setConnectionCount(
          connectionsResult.error
            ? 0
            : (
                connectionsResult.data ||
                []
              ).length
        );

        setCommunityCount(
          communitiesResult.count ||
            0
        );
      } catch (error) {
        console.error(
          "Public profile error:",
          error
        );

        setMessage(
          "Something went wrong while loading this profile."
        );
      }

      setPublicLoading(false);
      setPublicStatsLoading(false);
      setPublicPostLoading(false);
    }

    loadPublicProfile();
  }, [
    isPublicProfile,
    profileUserId,
  ]);

  /*
   * LOAD OWN SOCIAL STATS
   */
  useEffect(() => {
    if (
      !userId ||
      isPublicProfile
    ) {
      return;
    }

    async function loadSocialStats() {
      setStatsLoading(true);

      try {
        const [
          connectionsResult,
          postsResult,
          communitiesResult,
        ] = await Promise.all([
          supabase
            .from("connection")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "status",
              "accepted"
            )
            .or(
              `requester_id.eq.${userId},receiver_id.eq.${userId}`
            ),

          supabase
            .from("posts")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "user_id",
              userId
            ),

          supabase
            .from(
              "community_members"
            )
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "user_id",
              userId
            ),
        ]);

        if (
          !connectionsResult.error
        ) {
          setConnectionCount(
            connectionsResult.count ||
              0
          );
        }

        if (
          !postsResult.error
        ) {
          setPostCount(
            postsResult.count ||
              0
          );
        }

        if (
          !communitiesResult.error
        ) {
          setCommunityCount(
            communitiesResult.count ||
              0
          );
        }
      } catch (error) {
        console.error(
          "Social stats error:",
          error
        );
      }

      setStatsLoading(false);
    }

    loadSocialStats();
  }, [
    userId,
    isPublicProfile,
  ]);

  /*
   * UNREAD NOTIFICATIONS
   */
  useEffect(() => {
    if (
      !userId ||
      isPublicProfile
    ) {
      return;
    }

    const loadUnreadNotifications =
      async () => {
        const {
          count,
          error,
        } = await supabase
          .from("notification")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq(
            "user_id",
            userId
          )
          .eq(
            "is_read",
            false
          );

        if (!error) {
          setUnreadNotifications(
            count || 0
          );
        }
      };

    loadUnreadNotifications();
  }, [
    userId,
    isPublicProfile,
  ]);

  /*
   * REALTIME NOTIFICATIONS
   */
  useEffect(() => {
    if (
      !userId ||
      isPublicProfile
    ) {
      return;
    }

    const channel =
      supabase
        .channel(
          `profile-notifications-${userId}`
        )
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
              (current) =>
                current + 1
            );
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [
    userId,
    isPublicProfile,
  ]);

  /*
   * INTEREST TOGGLE
   */
  function toggleInterest(
    interest: string
  ) {
    setInterests(
      (current) =>
        current.includes(interest)
          ? current.filter(
              (item) =>
                item !== interest
            )
          : [
              ...current,
              interest,
            ]
    );
  }

  /*
   * AVATAR UPLOAD
   */
  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (
      !file ||
      !userId
    ) {
      return;
    }

    setMessage("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setMessage(
        "Please select an image file."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setMessage(
        "Profile picture must be smaller than 5MB."
      );
      return;
    }

    setUploadingAvatar(
      true
    );

    try {
      const fileExtension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(
            2,
            10
          )}.${fileExtension}`;

      const filePath =
        `${userId}/${fileName}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from("avatars")
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                file.type,
            }
          );

      if (uploadError) {
        setMessage(
          uploadError.message
        );
        setUploadingAvatar(
          false
        );
        return;
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(
            filePath
          );

      const newAvatarUrl =
        publicUrlData.publicUrl;

      const {
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .update({
            avatar_url:
              newAvatarUrl,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            userId
          );

      if (profileError) {
        setMessage(
          profileError.message
        );
        setUploadingAvatar(
          false
        );
        return;
      }

      setAvatarUrl(
        newAvatarUrl
      );

      setMessage(
        "Profile picture updated successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading your photo."
      );
    }

    setUploadingAvatar(
      false
    );

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }

  /*
   * SAVE OWN PROFILE
   */
  async function handleSave(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!userId) return;

    setSaving(true);
    setMessage("");

    const cleanUsername =
      username
        .trim()
        .toLowerCase();

    const {
      error,
    } =
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name:
            fullName.trim(),
          username:
            cleanUsername,
          country:
            country.trim(),
          bio: bio.trim(),
          age_group:
            ageGroup,
          interests,
          avatar_url:
            avatarUrl.trim() ||
            null,
          updated_at:
            new Date().toISOString(),
        });

    if (error) {
      setMessage(
        error.message
      );
      setSaving(false);
      return;
    }

    setMessage(
      "Profile saved successfully."
    );

    setTimeout(() => {
      router.refresh();
    }, 700);

    setSaving(false);
  }

  /*
   * SIGN OUT
   */
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  /*
   * GET CONNECTION BETWEEN
   * CURRENT USER AND PUBLIC USER
   */
  function getPublicConnection() {
    return publicConnections.find(
      (connection) =>
        (connection.requester_id ===
          userId &&
          connection.receiver_id ===
            profileUserId) ||
        (connection.receiver_id ===
          userId &&
          connection.requester_id ===
            profileUserId)
    );
  }

  /*
   * CONNECTION STATE
   */
  function getConnectionState() {
    const connection =
      getPublicConnection();

    if (!connection) {
      return "connect";
    }

    if (
      connection.status ===
      "accepted"
    ) {
      return "connected";
    }

    if (
      connection.status ===
        "pending" &&
      connection.requester_id ===
        userId
    ) {
      return "sent";
    }

    if (
      connection.status ===
        "pending" &&
      connection.receiver_id ===
        userId
    ) {
      return "incoming";
    }

    return "connect";
  }

  /*
   * SEND CONNECTION REQUEST
   */
  async function handleConnect() {
    if (
      !userId ||
      !profileUserId ||
      connectionAction
    ) {
      return;
    }

    setConnectionAction(
      true
    );
    setMessage("");

    const existing =
      getPublicConnection();

    if (
      existing &&
      existing.status !==
        "declined"
    ) {
      setConnectionAction(
        false
      );
      return;
    }

    if (
      existing &&
      existing.status ===
        "declined"
    ) {
      await supabase
        .from("connection")
        .delete()
        .eq(
          "id",
          existing.id
        );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("connection")
        .insert({
          requester_id:
            userId,
          receiver_id:
            profileUserId,
          status:
            "pending",
        })
        .select()
        .single();

    if (error) {
      setMessage(
        error.message
      );
    } else if (data) {
      setPublicConnections(
        (current) => [
          ...current.filter(
            (item) =>
              item.id !==
              existing?.id
          ),
          data as Connection,
        ]
      );
    }

    setConnectionAction(
      false
    );
  }

  /*
   * ACCEPT INCOMING REQUEST
   */
  async function handleAccept() {
    const connection =
      getPublicConnection();

    if (
      !connection ||
      connectionAction
    ) {
      return;
    }

    setConnectionAction(
      true
    );

    const {
      data,
      error,
    } =
      await supabase
        .from("connection")
        .update({
          status:
            "accepted",
        })
        .eq(
          "id",
          connection.id
        )
                .select()
        .single();

    if (error) {
      setMessage(error.message);
    } else if (data) {
      setPublicConnections((current) =>
        current.map((item) =>
          item.id === connection.id
            ? (data as Connection)
            : item
        )
      );

      setConnectionCount((current) =>
        current + 1
      );
    }

    setConnectionAction(false);
  }

  /*
   * FORMAT DATE
   */
  function formatDate(date: string) {
    const created = new Date(date);
    const now = new Date();

    const difference = Math.floor(
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

  /*
   * PUBLIC POST HELPERS
   */
  function getPostLikes(
    postId: string
  ) {
    return publicLikes.filter(
      (like) =>
        like.post_id === postId
    );
  }

  function getPostComments(
    postId: string
  ) {
    return publicComments.filter(
      (comment) =>
        comment.post_id === postId
    );
  }

  /*
   * TOGGLE PUBLIC POST LIKE
   */
  async function togglePublicLike(
    postId: string
  ) {
    if (!userId) return;

    const existing =
      publicLikes.find(
        (like) =>
          like.post_id ===
            postId &&
          like.user_id ===
            userId
      );

    if (existing) {
      const { error } =
        await supabase
          .from("likes")
          .delete()
          .eq(
            "id",
            existing.id
          );

      if (error) {
        setMessage(
          error.message
        );
        return;
      }

      setPublicLikes(
        (current) =>
          current.filter(
            (like) =>
              like.id !==
              existing.id
          )
      );

      return;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("likes")
        .insert({
          post_id:
            postId,
          user_id:
            userId,
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
      setPublicLikes(
        (current) => [
          ...current,
          data as PostLike,
        ]
      );
    }
  }

  /*
   * SUBMIT PUBLIC PROFILE COMMENT
   */
  async function submitPublicComment(
    postId: string
  ) {
    const content =
      (
        commentText[
          postId
        ] || ""
      ).trim();

    if (
      !content ||
      !userId ||
      commentingPost
    ) {
      return;
    }

    setCommentingPost(
      postId
    );
    setMessage("");

    const {
      data,
      error,
    } =
      await supabase
        .from("comments")
        .insert({
          post_id:
            postId,
          user_id:
            userId,
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
      setCommentingPost(
        null
      );
      return;
    }

    if (data) {
      setPublicComments(
        (current) => [
          ...current,
          data as PostComment,
        ]
      );
    }

    setCommentText(
      (current) => ({
        ...current,
        [postId]:
          "",
      })
    );

    setOpenComments(
      (current) => ({
        ...current,
        [postId]:
          true,
      })
    );

    setCommentingPost(
      null
    );
  }

  /*
   * INITIALS
   */
  const initials =
    useMemo(() => {
      const name =
        (
          isPublicProfile
            ? publicProfile?.full_name
            : fullName
        )?.trim() || "";

      if (!name) {
        return "N";
      }

      return name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) =>
          word
            .charAt(0)
            .toUpperCase()
        )
        .join("");
    }, [
      fullName,
      publicProfile,
      isPublicProfile,
    ]);

  /*
   * PROFILE COMPLETION
   */
  const completionItems = [
    fullName.trim(),
    username.trim(),
    country.trim(),
    bio.trim(),
    interests.length > 0
      ? "yes"
      : "",
  ];

  const completedItems =
    completionItems.filter(
      Boolean
    ).length;

  const completion =
    Math.round(
      (completedItems /
        completionItems.length) *
        100
    );

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-blue-500/40 to-violet-600/40" />

          <p className="text-sm text-white/45">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  /*
   * PUBLIC PROFILE VIEW
   */
  if (isPublicProfile) {
    const profile =
      publicProfile;

    const connectionState =
      getConnectionState();

    return (
      <main className="min-h-screen bg-[#050816] pb-24 text-white sm:pb-10">

        {/* BACKGROUND */}

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[130px]" />

          <div className="absolute right-[-140px] top-[25%] h-[450px] w-[450px] rounded-full bg-violet-600/10 blur-[150px]" />

          <div className="absolute bottom-[-180px] left-[25%] h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[140px]" />
        </div>

        {/* TOP BAR */}

        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050816]/80 backdrop-blur-2xl">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">

            <button
              onClick={() =>
                router.back()
              }
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-sm font-black shadow-lg shadow-blue-500/20">
                ←
              </div>

              <span className="text-sm font-bold text-white/70">
                Back
              </span>
            </button>

            <button
              onClick={() =>
                router.push(
                  "/profile"
                )
              }
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/60"
            >
              My profile
            </button>
          </div>
        </header>

        <div className="relative mx-auto max-w-5xl px-5 pt-7 sm:px-8 sm:pt-10">

          {publicLoading ||
          !profile ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center">
              <p className="text-sm text-white/40">
                {message ||
                  "Loading profile..."}
              </p>
            </div>
          ) : (
            <>
              {/* PUBLIC PROFILE HERO */}

              <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 sm:p-8">

                <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />

                <div className="relative">

                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex min-w-0 items-center gap-5">

                      {profile.avatar_url ? (
                        <img
                          src={
                            profile.avatar_url
                          }
                          alt={
                            profile.full_name ||
                            profile.username ||
                            "Nikelink user"
                          }
                          className="h-24 w-24 shrink-0 rounded-[1.7rem] object-cover ring-2 ring-blue-500/30 shadow-xl shadow-blue-500/10"
                        />
                      ) : (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-3xl font-black shadow-xl shadow-blue-500/20">
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0">

                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
                          Nikelink profile
                        </p>

                        <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
                          {profile.full_name ||
                            "Nikelink user"}
                        </h1>

                        {profile.username && (
                          <p className="mt-1 truncate text-sm text-white/40">
                            @{profile.username}
                          </p>
                        )}

                        {profile.country && (
                          <p className="mt-2 text-sm text-white/45">
                            🌍{" "}
                            {profile.country}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CONNECTION ACTION */}

                    <div className="w-full sm:w-48">

                      {connectionState ===
                        "connect" && (
                        <button
                          onClick={
                            handleConnect
                          }
                          disabled={
                            connectionAction
                          }
                          className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold shadow-xl shadow-blue-600/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {connectionAction
                            ? "Sending..."
                            : "Connect"}
                        </button>
                      )}

                      {connectionState ===
                        "sent" && (
                        <button
                          disabled
                          className="w-full rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 py-3 text-sm font-bold text-violet-300"
                        >
                          ✓ Request Sent
                        </button>
                      )}

                      {connectionState ===
                        "incoming" && (
                        <button
                          onClick={
                            handleAccept
                          }
                          disabled={
                            connectionAction
                          }
                          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold disabled:opacity-50"
                        >
                          {connectionAction
                            ? "Accepting..."
                            : "Accept Request"}
                        </button>
                      )}

                      {connectionState ===
                        "connected" && (
                        <button
                          onClick={() =>
                            router.push(
                              `/messages?user=${profile.id}`
                            )
                          }
                          className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/15"
                        >
                          ✓ Connected · Message
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BIO */}

                  {profile.bio && (
                    <div className="mt-7 border-t border-white/[0.07] pt-6">
                      <p className="max-w-3xl text-sm leading-7 text-white/55">
                        {profile.bio}
                      </p>
                    </div>
                  )}

                  {/* INTERESTS */}

                  {profile.interests &&
                    profile.interests.length >
                      0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {profile.interests.map(
                          (interest) => (
                            <span
                              key={interest}
                              className="rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300"
                            >
                              {interest}
                            </span>
                          )
                        )}
                      </div>
                    )}
                </div>
              </section>

              {/* PUBLIC SOCIAL STATS */}

              <section className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center shadow-xl shadow-black/10 sm:p-5">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-xl">
                    👥
                  </div>

                  <p className="mt-3 text-xl font-black sm:text-2xl">
                    {publicStatsLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-white/10" />
                    ) : (
                      connectionCount
                    )}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/35 sm:text-xs">
                    Connections
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center shadow-xl shadow-black/10 sm:p-5">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                    📝
                  </div>

                  <p className="mt-3 text-xl font-black sm:text-2xl">
                    {publicStatsLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-white/10" />
                    ) : (
                      postCount
                    )}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/35 sm:text-xs">
                    Posts
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center shadow-xl shadow-black/10 sm:p-5">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
                    🌍
                  </div>

                  <p className="mt-3 text-xl font-black sm:text-2xl">
                    {publicStatsLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-white/10" />
                    ) : (
                      communityCount
                    )}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/35 sm:text-xs">
                    Communities
                  </p>
                </div>
              </section>

              {/* PUBLIC MESSAGE */}

              {message && (
                <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-center text-sm text-white/55">
                  {message}
                </div>
              )}

              {/* PUBLIC POSTS */}

              <section className="mt-9">

                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
                    Activity
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    Posts
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    Recent posts shared by{" "}
                    {profile.full_name ||
                      "this user"}.
                  </p>
                </div>

                {publicPostLoading ? (
                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center">
                    <p className="text-sm text-white/40">
                      Loading posts...
                    </p>
                  </div>
                ) : publicPosts.length ===
                  0 ? (
                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 text-3xl">
                      📝
                    </div>

                    <h3 className="mt-5 text-lg font-black">
                      No posts yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
                      This user has not shared any posts yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">

                    {publicPosts.map(
                      (post) => {
                        const postLikes =
                          getPostLikes(
                            post.id
                          );

                        const postComments =
                          getPostComments(
                            post.id
                          );

                        const userLiked =
                          postLikes.some(
                            (like) =>
                              like.user_id ===
                              userId
                          );

                        return (
                          <article
                            key={post.id}
                            className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-xl shadow-black/10"
                          >

                                                        {/* POST HEADER */}

                            <div className="flex items-center gap-3 p-5">

                              {profile.avatar_url ? (
                                <img
                                  src={
                                    profile.avatar_url
                                  }
                                  alt=""
                                  className="h-11 w-11 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 font-bold">
                                  {initials}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold">
                                  {profile.full_name ||
                                    profile.username ||
                                    "Nikelink user"}
                                </p>

                                <p className="text-xs text-white/30">
                                  {formatDate(
                                    post.created_at
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* POST CONTENT */}

                            <div className="px-5 pb-5">
                              <p className="whitespace-pre-wrap text-[15px] leading-7 text-white/85">
                                {post.content}
                              </p>
                            </div>

                            {/* ACTIONS */}

                            <div className="border-t border-white/10 px-3 py-2">

                              <div className="flex items-center gap-1">

                                <button
                                  onClick={() =>
                                    togglePublicLike(
                                      post.id
                                    )
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
                                    {
                                      postLikes.length
                                    }
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
                                    }
                                  }
                                  className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-blue-400"
                                >
                                  <span className="text-lg">
                                    💬
                                  </span>

                                  <span>
                                    {
                                      postComments.length
                                    }
                                  </span>
                                </button>

                              </div>
                            </div>

                            {/* COMMENTS */}

                            {openComments[
                              post.id
                            ] && (
                              <div className="border-t border-white/10 px-5 pb-5 pt-4">

                                <div className="space-y-3">

                                  {postComments.length ===
                                  0 ? (
                                    <p className="py-2 text-center text-xs text-white/30">
                                      No comments yet.
                                    </p>
                                  ) : (
                                    postComments.map(
                                      (
                                        comment
                                      ) => (
                                        <div
                                          key={
                                            comment.id
                                          }
                                          className="flex gap-3"
                                        >
                                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold">
                                            N
                                          </div>

                                          <div className="min-w-0 flex-1 rounded-2xl bg-white/[0.05] px-3 py-2">
                                            <p className="text-xs font-semibold">
                                              Nikelink user
                                            </p>

                                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/70">
                                              {
                                                comment.content
                                              }
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
                                      ] ||
                                      ""
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setCommentText(
                                        (
                                          current
                                        ) => ({
                                          ...current,
                                          [post.id]:
                                            e
                                              .target
                                              .value,
                                        })
                                      )
                                    }
                                    onKeyDown={(
                                      e
                                    ) => {
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
                                            ] ||
                                            ""
                                          ).trim()
                                        ) {
                                          submitPublicComment(
                                            post.id
                                          );
                                        }
                                      }
                                    }}
                                    placeholder="Write a comment..."
                                    maxLength={500}
                                    className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-blue-500/40"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      submitPublicComment(
                                        post.id
                                      )
                                    }
                                    disabled={
                                      commentingPost ===
                                        post.id ||
                                      !(
                                        commentText[
                                          post.id
                                        ] ||
                                        ""
                                      ).trim()
                                    }
                                    className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    {commentingPost ===
                                    post.id
                                      ? "..."
                                      : "Send"}
                                  </button>

                                </div>
                              </div>
                            )}
                          </article>
                        );
                      }
                    )}

                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* MOBILE NAVIGATION */}

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#050816]/90 backdrop-blur-2xl sm:hidden">

          <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2.5">

            <button
              onClick={() =>
                router.push(
                  "/feed"
                )
              }
              className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-[20px] leading-none">
                ⌂
              </span>

              <span className="text-[10px] font-semibold">
                Home
              </span>
            </button>

            <button
              onClick={() =>
                router.push(
                  "/discover"
                )
              }
              className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-[19px] leading-none">
                ⌕
              </span>

              <span className="text-[10px] font-semibold">
                Discover
              </span>
            </button>

            <button
              onClick={() =>
                router.push(
                  "/communities"
                )
              }
              className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-[18px] leading-none">
                👥
              </span>

              <span className="text-[10px] font-semibold">
                Community
              </span>
            </button>

            <button
              onClick={() =>
                router.push(
                  "/messages"
                )
              }
              className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-[18px] leading-none">
                💬
              </span>

              <span className="text-[10px] font-semibold">
                Messages
              </span>
            </button>

            <button
              onClick={() =>
                router.push(
                  "/profile"
                )
              }
              className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl bg-blue-500/10 px-3 py-1.5 text-blue-400"
            >
              <span className="text-[18px] leading-none">
                ●
              </span>

              <span className="text-[10px] font-semibold">
                Profile
              </span>
            </button>

          </div>
        </nav>
      </main>
    );
  }

  /*
   * OWN PROFILE VIEW
   */

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white sm:pb-10">

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute right-[-140px] top-[25%] h-[450px] w-[450px] rounded-full bg-violet-600/10 blur-[150px]" />

        <div className="absolute bottom-[-180px] left-[25%] h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[140px]" />
      </div>

      {/* TOP BAR */}

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050816]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">

          <button
            onClick={() =>
              router.push(
                "/feed"
              )
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-sm font-black shadow-lg shadow-blue-500/20">
              N
            </div>

            <span className="text-lg font-black tracking-tight">
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
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
            >
              🔔

              {unreadNotifications >
                0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white shadow-lg shadow-pink-500/30">
                  {unreadNotifications >
                  99
                    ? "99+"
                    : unreadNotifications}
                </span>
              )}
            </button>

            <button
              onClick={
                handleSignOut
              }
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/55 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              Sign out
            </button>

          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-5 pt-7 sm:px-8 sm:pt-10">

        {/* PROFILE HERO */}

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 sm:p-8">

          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />

          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />

          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">

            {/* IDENTITY */}

            <div className="flex min-w-0 items-center gap-5">

              <div className="relative shrink-0">

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={
                    uploadingAvatar
                  }
                  className="group relative block"
                  aria-label="Change profile picture"
                >

                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile avatar"
                      className="h-24 w-24 rounded-[1.7rem] object-cover ring-2 ring-blue-500/30 shadow-xl shadow-blue-500/10"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-3xl font-black shadow-xl shadow-blue-500/20">
                      {initials}
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center rounded-[1.7rem] bg-black/0 transition group-hover:bg-black/50">
                    <span className="text-xl opacity-0 transition group-hover:opacity-100">
                      📷
                    </span>
                  </div>

                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-[1.7rem] bg-black/70">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    </div>
                  )}

                </button>

                <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#080b1c] bg-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept="image/*"
                  onChange={
                    handleAvatarChange
                  }
                  className="hidden"
                />
              </div>

              <div className="min-w-0">

                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
                  Your profile
                </p>

                <h1 className="truncate text-2xl font-black tracking-tight 
                                    profile.avatar_url
                                  }
                                  alt=""
                                  className="h-11 w-11 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 font-bold">
                                  {initials}
            
