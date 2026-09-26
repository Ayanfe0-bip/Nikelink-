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

export default function MessagesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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

      const ids = (connections || []).map((c) =>
        c.requester_id === id ? c.receiver_id : c.requester_id
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

    const channel = supabase
      .channel("nikelink-messages")
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
              if (old.some((m) => m.id === message.id)) return old;
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

  const conversation = useMemo(() => {
    if (!selected) return [];

    return messages.filter(
      (m) =>
        (m.sender_id === userId && m.receiver_id === selected.id) ||
        (m.sender_id === selected.id && m.receiver_id === userId)
    );
  }, [messages, selected, userId]);

  function lastMessage(id: string) {
    const list = messages.filter(
      (m) =>
        (m.sender_id === userId && m.receiver_id === id) ||
        (m.sender_id === id && m.receiver_id === userId)
    );

    return list[list.length - 1];
  }

  async function sendMessage() {
    if (!text.trim() || !selected || !userId || sending) return;

    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        receiver_id: selected.id,
        content: text.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((old) => [...old, data]);
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

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <header className="border-b border-white/10 p-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-white/50"
        >
          ← Dashboard
        </button>

        <h1 className="mt-2 text-2xl font-bold">Messages</h1>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside
          className={`w-full border-r border-white/10 md:w-80 ${
            selected ? "hidden md:block" : "block"
          }`}
        >
          <div className="border-b border-white/10 p-4 font-semibold">
            Conversations
          </div>

          {loading ? (
            <p className="p-5 text-white/40">
              Loading...
            </p>
          ) : profiles.length === 0 ? (
            <div className="p-6 text-center text-white/40">
              No connections yet.
            </div>
          ) : (
            profiles.map((profile) => {
              const last = lastMessage(profile.id);

              return (
                <button
                  key={profile.id}
                  onClick={() => setSelected(profile)}
                  className="flex w-full gap-3 border-b border-white/5 p-4 text-left hover:bg-white/5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 font-bold">
                    {name(profile)[0]?.toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="truncate font-semibold">
                        {name(profile)}
                      </span>

                      {last && (
                        <span className="text-[10px] text-white/30">
                          {time(last.created_at)}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-xs text-white/40">
                      {last
                        ? last.sender_id === userId
                          ? `You: ${last.content}`
                          : last.content
                        : "Start a conversation"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        <section
          className={`flex min-h-[calc(100vh-90px)] flex-1 flex-col ${
            selected ? "flex" : "hidden md:flex"
          }`}
        >
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-white/40">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-white/10 p-4">
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden"
                >
                  ←
                </button>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 font-bold">
                  {name(selected)[0]?.toUpperCase()}
                </div>

                <div>
                  <p className="font-semibold">
                    {name(selected)}
                  </p>

                  <p className="text-xs text-white/40">
                    {selected.username
                      ? `@${selected.username}`
                      : selected.country || "Nikelink connection"}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {conversation.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-white/40">
                    <div>
                      <div className="mb-3 text-3xl">👋</div>
                      <p>Start the conversation.</p>
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
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            mine
                              ? "bg-gradient-to-r from-violet-600 to-pink-500"
                              : "border border-white/10 bg-white/5"
                          }`}
                        >
                          <p className="break-words text-sm">
                            {message.content}
                          </p>

                          <p className="mt-1 text-[10px] text-white/40">
                            {time(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                    placeholder="Write a message..."
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={!text.trim() || sending}
                    className="rounded-xl bg-violet-600 px-5 font-bold disabled:opacity-40"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
                      }
