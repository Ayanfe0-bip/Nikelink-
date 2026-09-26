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

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
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

  const [userId, setUserId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    };

    getUser();
  }, [router]);

  // Load accepted connections
  useEffect(() => {
    if (!userId) return;

    const loadConnections = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) {
        console.error("Connections error:", error);
        setLoading(false);
        return;
      }

      const connectionData = data || [];
      setConnections(connectionData);

      const otherUserIds = connectionData.map((connection) =>
        connection.requester_id === userId
          ? connection.receiver_id
          : connection.requester_id
      );

      if (otherUserIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, username, country")
          .in("id", otherUserIds);

        if (profileError) {
          console.error("Profiles error:", profileError);
        } else {
          setProfiles(profileData || []);
        }
      } else {
        setProfiles([]);
      }

      setLoading(false);
    };

    loadConnections();
  }, [userId]);

  // Load all messages involving current user
  useEffect(() => {
    if (!userId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Messages error:", error);
        return;
      }

      setMessages(data || []);
    };

    loadMessages();
  }, [userId]);

  // Realtime new messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const incomingMessage = payload.new as Message;

          if (
            incomingMessage.sender_id === userId ||
            incomingMessage.receiver_id === userId
          ) {
            setMessages((current) => {
              const exists = current.some(
                (message) => message.id === incomingMessage.id
              );

              if (exists) return current;

              return [...current, incomingMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Messages for selected person
  const selectedMessages = useMemo(() => {
    if (!selectedUser || !userId) return [];

    return messages.filter(
      (message) =>
        (message.sender_id === userId &&
          message.receiver_id === selectedUser.id) ||
        (message.sender_id === selectedUser.id &&
          message.receiver_id === userId)
    );
  }, [messages, selectedUser, userId]);

  // Get last message for each connection
  const getLastMessage = (profileId: string) => {
    const conversation = messages.filter(
      (message) =>
        (message.sender_id === userId &&
          message.receiver_id === profileId) ||
        (message.sender_id === profileId &&
          message.receiver_id === userId)
    );

    if (conversation.length === 0) return null;

    return conversation[conversation.length - 1];
  };

  // Simple unread indicator based on the latest incoming message
  const hasUnread = (profileId: string) => {
    const lastMessage = getLastMessage(profileId);

    if (!lastMessage) return false;

    return lastMessage.sender_id === profileId && selectedUser?.id !== profileId;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatConversationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (sameDay) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  };

  const getDisplayName = (profile: Profile) => {
    return (
      profile.full_name ||
      profile.username ||
      "Nikelink User"
    );
  };

  const getInitial = (profile: Profile) => {
    return getDisplayName(profile).charAt(0).toUpperCase();
  };

  // Send message
  const sendMessage = async () => {
    if (!userId || !selectedUser || !newMessage.trim() || sending) {
      return;
    }

    setSending(true);

    const content = newMessage.trim();

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
      console.error("Send message error:", error);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((current) => {
        const exists = current.some((message) => message.id === data.id);

        if (exists) return current;

        return [...current, data];
      });
    }

    setNewMessage("");
    setSending(false);
  };

  // Send with Enter
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col">

        {/* Header */}
        <header className="border-b border-white/10 bg-[#050816]/95 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push("/dashboard")}
                className="mb-1 text-sm text-white/50 transition hover:text-white"
              >
                ← Dashboard
              </button>

              <h1 className="text-2xl font-bold">
                Messages
              </h1>

              <p className="text-sm text-white/50">
                Chat with your Nikelink connections
              </p>
            </div>

            <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200">
              {profiles.length} connection
              {profiles.length === 1 ? "" : "s"}
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">

          {/* Conversation List */}
          <aside
            className={`w-full border-r border-white/10 bg-[#080b1c] md:w-[360px] ${
              selectedUser ? "hidden md:block" : "block"
            }`}
          >
            <div className="border-b border-white/10 px-4 py-4">
              <h2 className="font-semibold">
                Conversations
              </h2>
            </div>

            <div className="overflow-y-auto">
              {loading ? (
                <div className="px-5 py-10 text-center text-sm text-white/50">
                  Loading conversations...
                </div>
              ) : profiles.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 text-2xl">
                    💬
                  </div>

                  <h3 className="mb-2 font-semibold">
                    No conversations yet
                  </h3>

                  <p className="text-sm leading-6 text-white/45">
                    Connect with people on Nikelink to start chatting.
                  </p>

                  <button
                    onClick={() => router.push("/connections")}
                    className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                  >
                    View Connections
                  </button>
                </div>
              ) : (
                profiles.map((profile) => {
                  const lastMessage = getLastMessage(profile.id);
                  const unread = hasUnread(profile.id);
                  const isSelected =
                    selectedUser?.id === profile.id;

                  return (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedUser(profile)}
                      className={`flex w-full items-center gap-3 border-b border-white/5 px-4 py-4 text-left transition ${
                        isSelected
                          ? "bg-violet-500/10"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-pink-500 text-lg font-bold">
                          {getInitial(profile)}
                        </div>

                        {unread && (
                          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#080b1c] bg-pink-500" />
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className={`truncate text-sm ${
                              unread
                                ? "font-bold text-white"
                                : "font-semibold text-white/90"
                            }`}
                          >
                            {getDisplayName(profile)}
                          </h3>

                          {lastMessage && (
                            <span className="shrink-0 text-[10px] text-white/35">
                              {formatConversationTime(
                                lastMessage.created_at
                              )}
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-1 truncate text-xs ${
                            unread
                              ? "font-medium text-white/75"
                              : "text-white/40"
                          }`}
                        >
                          {lastMessage
                            ? lastMessage.sender_id === userId
                              ? `You: ${lastMessage.content}`
                              : lastMessage.content
                            : "Start a conversation"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat Area */}
          <section
            className={`flex flex-1 flex-col ${
              selectedUser ? "flex" : "hidden md:flex"
            }`}
          >
            {!selectedUser ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <div>
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 text-3xl">
                    💬
                  </div>

                  <h2 className="text-xl font-semibold">
                    Your messages
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
                    Select a connection to start or continue a conversation.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-white/10 bg-[#080b1c] px-4 py-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="mr-1 text-xl text-white/60 md:hidden"
                  >
                    ←
                  </button>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-pink-500 font-bold">
                    {getInitial(selectedUser)}
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      {getDisplayName(selectedUser)}
                    </h2>

                    <p className="text-xs text-white/40">
                      {selectedUser.username
                        ? `@${selectedUser.username}`
                        : selectedUser.country || "Nikelink connection"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  {selectedMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl">
                          👋
                        </div>

