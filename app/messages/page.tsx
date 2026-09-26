"use client";

import { useEffect, useState } from "react";
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
  const [connections, setConnections] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMessagesPage();
  }, []);

  async function loadMessagesPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data: connectionData, error: connectionError } =
      await supabase
        .from("connections")
        .select("requester_id, receiver_id")
        .eq("status", "accepted")
        .or(
          `requester_id.eq.${user.id},receiver_id.eq.${user.id}`
        );

    if (connectionError) {
      console.error(connectionError);
      setMessage(connectionError.message);
      setLoading(false);
      return;
    }

    if (!connectionData || connectionData.length === 0) {
      setConnections([]);
      setLoading(false);
      return;
    }

    const otherUserIds = connectionData.map((connection) =>
      connection.requester_id === user.id
        ? connection.receiver_id
        : connection.requester_id
    );

    const { data: profiles, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, username, country")
        .in("id", otherUserIds);

    if (profileError) {
      console.error(profileError);
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    setConnections(profiles || []);
    setLoading(false);
  }

  async function openConversation(profile: Profile) {
    if (!userId) return;

    setSelectedUser(profile);
    setLoadingMessages(true);
    setMessage("");

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, sender_id, receiver_id, content, created_at"
      )
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setMessage(error.message);
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setMessages(data || []);
    setLoadingMessages(false);
  }

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId || !selectedUser || !text.trim() || sending) {
      return;
    }

    setSending(true);
    setMessage("");

    const content = text.trim();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        receiver_id: selectedUser.id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setMessage(error.message);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((current) => [...current, data]);
    }

    setText("");
    setSending(false);
  }

  useEffect(() => {
    if (!selectedUser || !userId) return;

    const channel = supabase
      .channel(`messages-${userId}-${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;

          const belongsToConversation =
            (newMessage.sender_id === userId &&
              newMessage.receiver_id === selectedUser.id) ||
            (newMessage.sender_id === selectedUser.id &&
              newMessage.receiver_id === userId);

          if (!belongsToConversation) return;

          setMessages((current) => {
            const alreadyExists = current.some(
              (item) => item.id === newMessage.id
            );

            if (alreadyExists) {
              return current;
            }

            return [...current, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, userId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <p className="text-white/50">
          Loading your messages...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#050816]/95 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 font-black">
              N
            </div>

            <span className="text-xl font-black">
              Nikelink
            </span>
          </button>

          <button
            onClick={handleSignOut}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* MAIN */}
      <section className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        {message && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center text-sm text-white/60">
            {message}
          </div>
        )}

        <div className="grid min-h-[calc(100vh-150px)] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-2xl md:grid-cols-[300px_1fr]">
          {/* CONNECTION LIST */}
          <aside
            className={`border-white/10 md:border-r ${
              selectedUser ? "hidden md:block" : "block"
            }`}
          >
            <div className="border-b border-white/10 p-5">
              <h1 className="text-2xl font-black">
                Messages
              </h1>

              <p className="mt-1 text-sm text-white/40">
                Chat with your connections.
              </p>
            </div>

            {connections.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl">💬</div>

                <p className="mt-4 font-semibold">
                  No connections yet
                </p>

                <p className="mt-2 text-sm text-white/40">
                  Connect with people before starting a chat.
                </p>

                <button
                  onClick={() => router.push("/discover")}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold"
                >
                  Discover people
                </button>
              </div>
            ) : (
              <div className="p-2">
                {connections.map((profile) => {
                  const initials =
                    profile.full_name
                      ?.trim()
                      .charAt(0)
                      .toUpperCase() ||
                    profile.username
                      ?.trim()
                      .charAt(0)
                      .toUpperCase() ||
                    "?";

                  const active =
                    selectedUser?.id === profile.id;

                  return (
                    <button
                      key={profile.id}
                      onClick={() => openConversation(profile)}
                      className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                        active
                          ? "bg-blue-600/20"
                          : "hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 font-bold">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {profile.full_name ||
                            "Nikelink User"}
                        </p>

                        {profile.username && (
                          <p className="truncate text-sm text-white/40">
                            @{profile.username}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* CHAT */}
          <section
            className={`flex min-h-[calc(100vh-150px)] flex-col ${
              selectedUser ? "block" : "hidden md:flex"
            }`}
          >
            {!selectedUser ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 text-4xl">
                  💬
                </div>

                <h2 className="text-2xl font-black">
                  Your conversations
                </h2>

                <p className="mt-2 max-w-md text-sm text-white/40">
                  Choose a connection to start a conversation.
                </p>
              </div>
            ) : (
              <>
                {/* CHAT HEADER */}
                <div className="flex items-center gap-3 border-b border-white/10 p-4">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="mr-1 rounded-xl p-2 text-white/50 hover:bg-white/10 md:hidden"
                  >
                    ←
                  </button>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 font-bold">
                    {selectedUser.full_name
                      ?.trim()
                      .charAt(0)
                      .toUpperCase() ||
                      selectedUser.username
                        ?.trim()
                        .charAt(0)
                        .toUpperCase() ||
                      "?"}
                  </div>

                  <div>
                    <h2 className="font-bold">
                      {selectedUser.full_name ||
                        "Nikelink User"}
                    </h2>

                    {selectedUser.username && (
                      <p className="text-xs text-white/40">
                        @{selectedUser.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-white/40">
                        Loading conversation...
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="text-3xl">👋</div>

                      <p className="mt-3 font-semibold">
                        Start the conversation
                      </p>

                      <p className="mt-1 text-sm text-white/40">
                        Send your first message.
                      </p>
                    </div>
                  ) : (
                    messages.map((item) => {
                      const mine =
                        item.sender_id === userId;

                      return (
                        <div
                          key={item.id}
                          className={`flex ${
                            mine
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              mine
                                ? "rounded-br-md bg-blue-600"
                                : "rounded-bl-md bg-white/[0.08]"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {item.content}
                            </p>

                            <p
                              className={`mt-1 text-[10px] ${
                                mine
                                  ? "text-white/60"
                                  : "text-white/30"
                              }`}
                            >
                              {formatTime(
                                item.created_at
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* COMPOSER */}
                <form
                  onSubmit={sendMessage}
                  className="border-t border-white/10 p-4"
                >
                  <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
                    <input
                      value={text}
                      onChange={(e) =>
                        setText(e.target.value)
                      }
                      placeholder="Write a message..."
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
                    />

                    <button
                      type="submit"
                      disabled={
                        sending || !text.trim()
                      }
                      className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? "..." : "Send"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
      }
