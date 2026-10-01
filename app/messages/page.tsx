"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  last_seen: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

const navItems = [
  { label: "Home", icon: "⌂", path: "/feed" },
  { label: "Discover", icon: "⌕", path: "/discover" },
  { label: "Community", icon: "◉", path: "/communities" },
  { label: "Messages", icon: "✉", path: "/messages" },
];

export default function MessagesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  /*
   * UNREAD MESSAGES PER CONVERSATION
   */
  const [unreadByUser, setUnreadByUser] =
    useState<Record<string, number>>({});

  /*
   * ONLINE / OFFLINE PRESENCE
   */
  const [onlineUsers, setOnlineUsers] =
    useState<Set<string>>(new Set());

  const [profiles, setProfiles] =
    useState<Profile[]>([]);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [selected, setSelected] =
    useState<Profile | null>(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  /*
   * TOTAL UNREAD MESSAGES
   */
  const unreadMessages = useMemo(() => {
    return Object.values(unreadByUser).reduce(
      (total, count) => total + count,
      0
    );
  }, [unreadByUser]);

  /*
   * INITIAL LOAD
   */
  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const currentUserId = user.id;

    setUserId(currentUserId);

    /*
     * LOAD SAVED UNREAD COUNTS
     */
    try {
      const saved =
        localStorage.getItem(
          `nikelink-unread-conversations-${currentUserId}`
        );

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          setUnreadByUser(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Unread storage error:",
        error
      );
    }

    /*
     * LOAD ACCEPTED CONNECTIONS
     */
    const {
      data: connectionData,
      error: connectionError,
    } = await supabase
      .from("connections")
      .select(
        "requester_id, receiver_id, status"
      )
      .eq("status", "accepted")
      .or(
        `requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
      );

    if (connectionError) {
      console.error(
        "Connection error:",
        connectionError
      );
    }

    const connectedIds = new Set<string>();

    (connectionData || []).forEach(
      (connection) => {
        const otherUser =
          connection.requester_id ===
          currentUserId
            ? connection.receiver_id
            : connection.requester_id;

        connectedIds.add(otherUser);
      }
    );

    /*
     * LOAD CONNECTED PROFILES
     */
    if (connectedIds.size > 0) {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, username, country, last_seen"
        )
        .in(
          "id",
          Array.from(connectedIds)
        );

      if (profileError) {
        console.error(
          "Profile error:",
          profileError
        );
      } else {
        setProfiles(
          (profileData || []) as Profile[]
        );
      }
    } else {
      setProfiles([]);
    }

    /*
     * LOAD MESSAGES
     */
    const {
      data: messageData,
      error: messageError,
    } = await supabase
      .from("messages")
      .select(
        "id, sender_id, receiver_id, content, created_at"
      )
      .or(
        `sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`
      )
      .order("created_at", {
        ascending: true,
      });

    if (messageError) {
      console.error(
        "Messages error:",
        messageError
      );
    } else {
      setMessages(
        (messageData || []) as Message[]
      );
    }

    setLoading(false);
  }

  /*
   * SAVE UNREAD COUNTS
   */
  useEffect(() => {
    if (!userId) return;

    localStorage.setItem(
      `nikelink-unread-conversations-${userId}`,
      JSON.stringify(unreadByUser)
    );
  }, [unreadByUser, userId]);

  /*
   * NOTIFICATION UNREAD COUNT
   */
  useEffect(() => {
    if (!userId) return;

    const loadUnreadNotifications =
      async () => {
        const { count, error } =
          await supabase
            .from("notification")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (!error) {
          setUnreadNotifications(
            count || 0
          );
        }
      };

    loadUnreadNotifications();
  }, [userId]);

  /*
   * REALTIME NOTIFICATIONS
   */
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(
        `messages-notifications-${userId}`
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
            (current) => current + 1
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /*
   * REALTIME ONLINE PRESENCE
   */
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(
      "nikelink-online-users",
      {
        config: {
          presence: {
            key: userId,
          },
        },
      }
    );

    const updateOnlineUsers = () => {
      const state =
        channel.presenceState();

      const users = new Set<string>();

      Object.keys(state).forEach(
        (key) => {
          users.add(key);
        }
      );

      setOnlineUsers(users);
    };

    channel.on(
      "presence",
      {
        event: "sync",
      },
      updateOnlineUsers
    );

    channel.on(
      "presence",
      {
        event: "join",
      },
      updateOnlineUsers
    );

    channel.on(
      "presence",
      {
        event: "leave",
      },
      updateOnlineUsers
    );

    channel.subscribe(
      async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            online_at:
              new Date().toISOString(),
          });
        }
      }
    );

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /*
   * UPDATE LAST SEEN
   */
  useEffect(() => {
    if (!userId) return;

    const updateLastSeen =
      async () => {
        const timestamp =
          new Date().toISOString();

        const { error } =
          await supabase
            .from("profiles")
            .update({
              last_seen: timestamp,
            })
            .eq("id", userId);

        if (error) {
          console.error(
            "Last seen update error:",
            error
          );
          return;
        }

        /*
         * Keep our local profile data
         * updated immediately.
         */
        setProfiles((current) =>
          current.map((profile) =>
            profile.id === userId
              ? {
                  ...profile,
                  last_seen: timestamp,
                }
              : profile
          )
        );
      };

    updateLastSeen();

    const interval = setInterval(
      updateLastSeen,
      60 * 1000
    );

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          updateLastSeen();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [userId]);

  /*
   * REALTIME MESSAGES
   */
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(
        `nikelink-messages-${userId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message =
            payload.new as Message;

          if (
            message.sender_id ===
              userId ||
            message.receiver_id ===
              userId
          ) {
            setMessages((old) => {
              if (
                old.some(
                  (item) =>
                    item.id ===
                    message.id
                )
              ) {
                return old;
              }

              return [...old, message];
            });

            /*
             * Count incoming messages
             * only when their conversation
             * is not currently open.
             */
            if (
              message.receiver_id ===
              userId
            ) {
              if (
                selected?.id ===
                message.sender_id
              ) {
                return;
              }

              setUnreadByUser(
                (current) => ({
                  ...current,
                  [message.sender_id]:
                    (current[
                      message.sender_id
                    ] || 0) + 1,
                })
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selected]);

  /*
   * SEARCH
   */
  const filteredProfiles =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return profiles;
      }

      return profiles.filter(
        (profile) => {
          const fullName =
            profile.full_name?.toLowerCase() ||
            "";

          const username =
            profile.username?.toLowerCase() ||
            "";

          const country =
            profile.country?.toLowerCase() ||
            "";

          return (
            fullName.includes(value) ||
            username.includes(value) ||
            country.includes(value)
          );
        }
      );
    }, [profiles, search]);

  /*
   * CURRENT CONVERSATION
   */
  const conversation = useMemo(() => {
    if (!selected) return [];

    return messages.filter(
      (message) =>
        (message.sender_id ===
          userId &&
          message.receiver_id ===
            selected.id) ||
        (message.sender_id ===
          selected.id &&
          message.receiver_id ===
            userId)
    );
  }, [messages, selected, userId]);

  /*
   * LAST MESSAGE
   */
  function lastMessage(id: string) {
    const list = messages.filter(
      (message) =>
        (message.sender_id ===
          userId &&
          message.receiver_id ===
            id) ||
        (message.sender_id ===
          id &&
          message.receiver_id ===
            userId)
    );

    return list[list.length - 1];
  }

  /*
   * OPEN CONVERSATION
   */
  function openConversation(
    profile: Profile
  ) {
    setSelected(profile);

    setUnreadByUser((current) => {
      if (!current[profile.id]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[profile.id];

      return next;
    });
  }

  /*
   * SEND MESSAGE
   */
  async function sendMessage() {
    const content = text.trim();

    if (
      !content ||
      !selected ||
      !userId ||
      sending
    ) {
      return;
    }

    setSending(true);

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        receiver_id: selected.id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Send message error:",
        error
      );
      setSending(false);
      return;
    }

    if (data) {
      setMessages((old) => {
        if (
          old.some(
            (message) =>
              message.id === data.id
          )
        ) {
          return old;
        }

        return [...old, data];
      });

      setText("");
    }

    setSending(false);
  }

  /*
   * ONLINE CHECK
   */
  function isOnline(
    profileId: string
  ) {
    return onlineUsers.has(profileId);
  }

  /*
   * LAST SEEN TEXT
   */
  function lastSeenText(
    profile: Profile
  ) {
    if (isOnline(profile.id)) {
      return "Online";
    }

    if (!profile.last_seen) {
      return "Offline";
    }

    const lastSeen =
      new Date(
        profile.last_seen
      ).getTime();

    const now = Date.now();

    const difference = Math.floor(
      (now - lastSeen) / 1000
    );

    if (difference < 60) {
      return "Last seen just now";
    }

    if (difference < 3600) {
      return `Last seen ${Math.floor(
        difference / 60
      )}m ago`;
    }

    if (difference < 86400) {
      return `Last seen ${Math.floor(
        difference / 3600
      )}h ago`;
    }

    if (difference < 604800) {
      return `Last seen ${Math.floor(
        difference / 86400
      )}d ago`;
    }

    return `Last seen ${new Date(
      profile.last_seen
    ).toLocaleDateString()}`;
  }

  /*
   * MESSAGE TIME
   */
  function time(value: string) {
    return new Date(
      value
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /*
   * DISPLAY NAME
   */
  function name(profile: Profile) {
    return (
      profile.full_name ||
      profile.username ||
      "Nikelink User"
    );
  }

  /*
   * INITIALS
   */
  function initials(
    profile: Profile
  ) {
    const value = name(
      profile
    ).trim();

    if (!value) return "N";

    const parts =
      value.split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value
      .slice(0, 2)
      .toUpperCase();
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="animate-pulse">
            <div className="h-5 w-28 rounded bg-white/10" />

            <div className="mt-3 h-9 w-44 rounded bg-white/10" />

            <div className="mt-7 h-12 rounded-2xl bg-white/5" />

            <div className="mt-8 space-y-3">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-full bg-white/10" />

                      <div className="flex-1">
                        <div className="h-4 w-32 rounded bg-white/10" />

                        <div className="mt-2 h-3 w-44 rounded bg-white/10" />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-[#050816] pb-24 text-white">
    {/* Background */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="absolute -right-40 top-80 h-96 w-96 rounded-full bg-pink-600/10 blur-3xl" />
    </div>

    {/* Top header */}
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/90 backdrop-blur-2xl">
      <div className="mx-auto max-w-5xl px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-400">
              Nikelink
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Messages
            </h1>

            <p className="mt-1 text-sm text-white/35">
              Private conversations with your connections.
            </p>
          </div>

          <button
            onClick={() => router.push("/profile")}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
            aria-label="Open profile"
          >
            👤
          </button>
        </div>
      </div>
    </header>

    {/* Main messaging area */}
    <div className="relative z-10 mx-auto flex max-w-5xl overflow-hidden border-x border-white/10 bg-white/[0.015] md:min-h-[calc(100vh-145px)]">
      {/* Conversations */}
      <aside
        className={`w-full shrink-0 border-r border-white/10 md:w-[340px] ${
          selected
            ? "hidden md:block"
            : "block"
        }`}
      >
        <div className="p-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/30">
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search connections..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-500/40"
            />
          </div>
        </div>

        <div className="px-2 pb-6">
          {filteredProfiles.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-2xl">
                ✉
              </div>

              <h2 className="mt-5 font-bold">
                No conversations
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/30">
                Connect with people in Discover to start messaging.
              </p>

              <button
                onClick={() =>
                  router.push("/discover")
                }
                className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3 text-sm font-bold"
              >
                Find people
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProfiles.map((profile) => {
                const last =
                  lastMessage(profile.id);

                const unread =
                  unreadByUser[profile.id] || 0;

                const active =
                  selected?.id === profile.id;

                return (
                  <button
                    key={profile.id}
                    onClick={() =>
                      openConversation(profile)
                    }
                    className={`w-full rounded-2xl p-3 text-left transition ${
                      active
                        ? "bg-violet-500/10"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-pink-500 text-sm font-bold">
                          {initials(profile)}
                        </div>

                        {isOnline(profile.id) && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#080a18] bg-emerald-400 shadow-lg shadow-emerald-400/40" />
                        )}

                        {unread > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-black text-white shadow-lg shadow-pink-500/30">
                            {unread > 99
                              ? "99+"
                              : unread}
                          </span>
                        )}
                      </div>

                      {/* Conversation details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-sm ${
                              unread > 0
                                ? "font-black text-white"
                                : "font-semibold text-white/90"
                            }`}
                          >
                            {name(profile)}
                          </p>

                          {last && (
                            <span className="shrink-0 text-[10px] text-white/25">
                              {time(last.created_at)}
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-1 truncate text-xs ${
                            unread > 0
                              ? "font-semibold text-white/60"
                              : "text-white/30"
                          }`}
                        >
                          {last
                            ? last.content
                            : "Start a conversation"}
                        </p>

                        <p
                          className={`mt-1 text-[10px] ${
                            isOnline(profile.id)
                              ? "text-emerald-400"
                              : "text-white/20"
                          }`}
                        >
                          {isOnline(profile.id)
                            ? "Online"
                            : lastSeenText(profile)}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-pink-500/10 px-2 py-1 text-[9px] font-black text-pink-400">
                          New
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <section
        className={`flex min-h-[calc(100vh-145px)] flex-1 flex-col ${
          selected
            ? "flex"
            : "hidden md:flex"
        }`}
      >
        {!selected ? (
          <div className="relative flex flex-1 items-center justify-center px-8 text-center">
            <div>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-pink-500/10 text-3xl shadow-2xl shadow-violet-900/20">
                ✉
              </div>

              <h2 className="mt-6 text-xl font-bold">
                Your conversations
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/35">
                Select a connection to start a private conversation on Nikelink.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.015] p-4">
              <button
                onClick={() =>
                  setSelected(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/70 md:hidden"
              >
                ←
              </button>

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-pink-500 text-sm font-bold">
                  {initials(selected)}
                </div>

                {isOnline(selected.id) && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#080a18] bg-emerald-400 shadow-lg shadow-emerald-400/40" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {name(selected)}
                </p>

                <p
                  className={`mt-0.5 truncate text-xs ${
                    isOnline(selected.id)
                      ? "text-emerald-400"
                      : "text-white/35"
                  }`}
                >
                  {isOnline(selected.id)
                    ? "🟢 Online"
                    : lastSeenText(selected)}
                </p>
              </div>

              <button
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white sm:flex"
                title="More options"
              >
                •••
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
              {conversation.length === 0 ? (
                <div className="flex min-h-[55vh] items-center justify-center text-center">
                  <div>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-2xl">
                      👋
                    </div>

                    <h3 className="mt-4 font-semibold">
                      Start the conversation
                    </h3>

                    <p className="mt-2 text-sm text-white/35">
                      Say hello to{" "}
                      {name(selected)}.
                    </p>
                  </div>
                </div>
              ) : (
                conversation.map((message) => {
                  const mine =
                    message.sender_id === userId;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        mine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-lg ${
                          mine
                            ? "rounded-br-md bg-gradient-to-br from-violet-600 to-pink-500 shadow-violet-950/20"
                            : "rounded-bl-md border border-white/10 bg-white/[0.06]"
                        }`}
                      >
                        <p className="break-words text-sm leading-6">
                          {message.content}
                        </p>

                        <p
                          className={`mt-1 text-[10px] ${
                            mine
                              ? "text-white/55"
                              : "text-white/30"
                          }`}
                        >
                          {time(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/10 bg-[#050816]/90 p-3 backdrop-blur-xl">
              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                <button
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg text-white/40 transition hover:bg-white/10 hover:text-white"
                  title="Add attachment"
                >
                  +
                </button>

                <textarea
                  value={text}
                  onChange={(event) =>
                    setText(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Write a message..."
                  rows={1}
                  className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                />

                <button
                  onClick={sendMessage}
                  disabled={
                    !text.trim() || sending
                  }
                  className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 text-sm font-bold shadow-lg shadow-violet-950/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {sending
                    ? "..."
                    : "Send"}
                </button>
              </div>

              <p className="mt-2 hidden text-center text-[10px] text-white/20 sm:block">
                Press Enter to send · Shift + Enter for a new line
              </p>
            </div>
          </>
        )}
      </section>
    </div>

    {/* Bottom navigation */}
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active =
            item.path === "/messages";

          return (
            <button
              key={item.path}
              onClick={() =>
                router.push(item.path)
              }
              className={`relative flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-4 py-2 transition ${
                active
                  ? "bg-violet-500/10 text-violet-300"
                  : "text-white/35 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              <span className="relative text-xl leading-none">
                {item.icon}

                {item.path === "/messages" &&
                  unreadMessages > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-black leading-none text-white shadow-lg shadow-pink-500/30">
                      {unreadMessages > 99
                        ? "99+"
                        : unreadMessages}
                    </span>
                  )}
              </span>

              <span className="text-[10px] font-semibold">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
    </main>
);
}
