"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

const navItems = [
  {
    label: "Home",
    icon: "⌂",
    path: "/feed",
  },
  {
    label: "Discover",
    icon: "⌕",
    path: "/discover",
  },
  {
    label: "Community",
    icon: "◉",
    path: "/communities",
  },
  {
    label: "Messages",
    icon: "✉",
    path: "/messages",
  },
];

export default function MessagesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [unreadNotifications, setUnreadNotifications] =
  useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
        return;
      }

      const id = data.user.id;
      setUserId(id);

      const { data: connections } = await supabase
        .from("connections")
        .select("requester_id, receiver_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${id},receiver_id.eq.${id}`);

      const ids = (connections || []).map((connection) =>
        connection.requester_id === id
          ? connection.receiver_id
          : connection.requester_id
      );

      if (ids.length) {
        const { data: people } = await supabase
          .from("profiles")
          .select("id, full_name, username, country")
          .in("id", ids);

        setProfiles(people || []);
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);
    }

    load();
  }, [router]);
useEffect(() => {
  if (!userId) return;

  const loadUnreadNotifications = async () => {
    const { count, error } = await supabase
      .from("notification")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      setUnreadNotifications(count || 0);
    }
  };

  loadUnreadNotifications();
}, [userId]);
  useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel(`messages-notifications-${userId}`)
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
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`nikelink-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new as Message;

          if (
            message.sender_id === userId ||
            message.receiver_id === userId
          ) {
            setMessages((old) => {
              if (old.some((item) => item.id === message.id)) {
                return old;
              }

              return [...old, message];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const filteredProfiles = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return profiles;

    return profiles.filter((profile) => {
      const fullName = profile.full_name?.toLowerCase() || "";
      const username = profile.username?.toLowerCase() || "";
      const country = profile.country?.toLowerCase() || "";

      return (
        fullName.includes(value) ||
        username.includes(value) ||
        country.includes(value)
      );
    });
  }, [profiles, search]);

  const conversation = useMemo(() => {
    if (!selected) return [];

    return messages.filter(
      (message) =>
        (message.sender_id === userId &&
          message.receiver_id === selected.id) ||
        (message.sender_id === selected.id &&
          message.receiver_id === userId)
    );
  }, [messages, selected, userId]);

  function lastMessage(id: string) {
    const list = messages.filter(
      (message) =>
        (message.sender_id === userId && message.receiver_id === id) ||
        (message.sender_id === id && message.receiver_id === userId)
    );

    return list[list.length - 1];
  }

  async function sendMessage() {
    const content = text.trim();

    if (!content || !selected || !userId || sending) return;

    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        receiver_id: selected.id,
        content,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((old) => {
        if (old.some((message) => message.id === data.id)) {
          return old;
        }

        return [...old, data];
      });

      setText("");
    }

    setSending(false);
  }

  function time(value: string) {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function name(profile: Profile) {
    return profile.full_name || profile.username || "Nikelink User";
  }

  function initials(profile: Profile) {
    const value = name(profile).trim();

    if (!value) return "N";

    const parts = value.split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value.slice(0, 2).toUpperCase();
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-pink-600/10 blur-[110px]" />
      </div>

      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              Nikelink
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Messages
            </h1>
          </div>

          <button
  onClick={() => router.push("/notifications")}
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
        </div>
      </header>

      <div className="relative mx-auto flex max-w-6xl overflow-hidden border-x border-white/5">
        {/* Conversation list */}
        <aside
          className={`w-full border-r border-white/10 bg-white/[0.015] md:block md:w-[350px] ${
            selected ? "hidden" : "block"
          }`}
        >
          <div className="border-b border-white/10 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-white/90">
                Your connections
              </p>

              <p className="mt-1 text-xs text-white/35">
                Conversations with people you're connected to.
              </p>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
                ⌕
              </span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-500/60 focus:bg-white/[0.07]"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                >
                  <div className="h-12 w-12 rounded-full bg-white/10" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-white/10" />
                    <div className="h-3 w-40 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-2xl">
                💬
              </div>

              <h2 className="mt-5 font-semibold">
                {search ? "No conversations found" : "No connections yet"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/35">
                {search
                  ? "Try another name, username or country."
                  : "Connect with people on Nikelink and your conversations will appear here."}
              </p>

              {!search && (
                <button
                  onClick={() => router.push("/discover")}
                  className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3 text-sm font-bold"
                >
                  Discover people
                </button>
              )}
            </div>
          ) : (
            <div className="p-2">
              {filteredProfiles.map((profile) => {
                const last = lastMessage(profile.id);
                const active = selected?.id === profile.id;

                return (
                  <button
                    key={profile.id}
                    onClick={() => setSelected(profile)}
                    className={`mb-1 flex w-full gap-3 rounded-2xl p-3 text-left transition ${
                      active
                        ? "border border-violet-500/30 bg-violet-500/10"
                        : "border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-pink-500 text-sm font-bold shadow-lg shadow-violet-900/20">
                        {initials(profile)}
                      </div>

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#080a18] bg-emerald-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">
                          {name(profile)}
                        </span>

                        {last && (
                          <span className="shrink-0 text-[10px] text-white/25">
                            {time(last.created_at)}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-white/35">
                        {last
                          ? last.sender_id === userId
                            ? `You: ${last.content}`
                            : last.content
                          : "Start a conversation"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Chat area */}
        <section
          className={`flex min-h-[calc(100vh-80px)] flex-1 flex-col ${
            selected ? "flex" : "hidden md:flex"
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
                  Select a connection to start a private conversation on
                  Nikelink.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.015] p-4">
                <button
                  onClick={() => setSelected(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/70 md:hidden"
                >
                  ←
                </button>

                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-pink-500 text-sm font-bold">
                    {initials(selected)}
                  </div>

                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#080a18] bg-emerald-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {name(selected)}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-white/35">
                    {selected.username
                      ? `@${selected.username}`
                      : selected.country || "Nikelink connection"}
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
                        Say hello to {name(selected)}.
                      </p>
                    </div>
                  </div>
                ) : (
                  conversation.map((message) => {
                    const mine = message.sender_id === userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          mine ? "justify-end" : "justify-start"
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
                              mine ? "text-white/55" : "text-white/30"
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
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
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
                    disabled={!text.trim() || sending}
                    className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 text-sm font-bold shadow-lg shadow-violet-950/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {sending ? "..." : "Send"}
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
            const active = item.path === "/messages";

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-4 py-2 transition ${
                  active
                    ? "bg-violet-500/10 text-violet-300"
                    : "text-white/35 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>

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
