"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  country: string | null;
  bio: string | null;
  interests: string[] | null;
};

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
};

export default function DiscoverPage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadDiscover();
  }, []);

  async function loadDiscover() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .order("created_at", { ascending: false });

      if (profileError) {
        console.error("Profile loading error:", profileError);
      } else {
        setProfiles(profileData || []);
      }

      const { data: connectionData, error: connectionError } =
        await supabase
          .from("connections")
          .select("*")
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (connectionError) {
        console.error("Connection loading error:", connectionError);
      } else {
        setConnections(connectionData || []);
      }
    } catch (error) {
      console.error("Discover error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getConnection(profileId: string) {
    return connections.find(
      (connection) =>
        (connection.requester_id === userId &&
          connection.receiver_id === profileId) ||
        (connection.receiver_id === userId &&
          connection.requester_id === profileId)
    );
  }

  function getConnectionLabel(profileId: string) {
    const connection = getConnection(profileId);

    if (!connection) {
      return "Connect";
    }

    if (connection.status === "accepted") {
      return "Connected";
    }

    if (
      connection.status === "pending" &&
      connection.requester_id === userId
    ) {
      return "Request Sent";
    }

    if (
      connection.status === "pending" &&
      connection.receiver_id === userId
    ) {
      return "Respond";
    }

    if (connection.status === "declined") {
      return "Connect";
    }

    return "Connect";
  }

  async function handleConnect(profileId: string) {
    if (!userId) return;

    const existingConnection = getConnection(profileId);

    if (existingConnection) {
      if (existingConnection.status === "accepted") {
        return;
      }

      if (
        existingConnection.status === "pending" &&
        existingConnection.requester_id === userId
      ) {
        return;
      }

      if (
        existingConnection.status === "pending" &&
        existingConnection.receiver_id === userId
      ) {
        router.push("/notifications");
        return;
      }
    }

    setConnectingId(profileId);

    try {
      const { data, error } = await supabase
        .from("connections")
        .insert({
          requester_id: userId,
          receiver_id: profileId,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Connection request error:", error);
        alert(error.message);
        return;
      }

      if (data) {
        setConnections((current) => [...current, data]);
      }
    } catch (error) {
      console.error("Connect error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setConnectingId(null);
    }
  }

  const filteredProfiles = profiles.filter((profile) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    const fullName = profile.full_name?.toLowerCase() || "";
    const username = profile.username?.toLowerCase() || "";
    const country = profile.country?.toLowerCase() || "";
    const bio = profile.bio?.toLowerCase() || "";
    const interests = profile.interests?.join(" ").toLowerCase() || "";

    return (
      fullName.includes(searchText) ||
      username.includes(searchText) ||
      country.includes(searchText) ||
      bio.includes(searchText) ||
      interests.includes(searchText)
    );
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(91, 33, 182, 0.25), transparent 35%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.15), transparent 30%), #050816",
        color: "#fff",
        paddingBottom: "90px",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "24px 18px 18px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(5, 8, 22, 0.88)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#8b5cf6",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "5px",
                }}
              >
                Nikelink
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.1,
                  fontWeight: 800,
                }}
              >
                Discover
              </h1>
            </div>

            <button
              onClick={() => router.push("/profile")}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "1px solid rgba(139,92,246,0.45)",
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(14,165,233,0.18))",
                color: "#fff",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              👤
            </button>
          </div>

          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0 14px",
              height: "50px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.055)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                opacity: 0.65,
              }}
            >
              🔍
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people, interests or countries..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#fff",
                fontSize: "14px",
              }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <section
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "22px 18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 750,
              }}
            >
              People you may know
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "rgba(255,255,255,0.55)",
                fontSize: "13px",
              }}
            >
              Connect with people around the world.
            </p>
          </div>

          <span
            style={{
              fontSize: "12px",
              color: "#a78bfa",
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.2)",
              padding: "7px 10px",
              borderRadius: "999px",
            }}
          >
            {filteredProfiles.length}
          </span>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "70px 20px",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            <div
              style={{
                fontSize: "30px",
                marginBottom: "12px",
              }}
            >
              ✨
            </div>

            <p>Discovering people...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "70px 20px",
              borderRadius: "22px",
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "12px",
              }}
            >
              🌍
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "19px",
              }}
            >
              No people found
            </h3>

            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.55)",
                fontSize: "14px",
              }}
            >
              Try another search.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {filteredProfiles.map((profile) => {
              const connectionLabel = getConnectionLabel(profile.id);

              const initials =
                profile.full_name?.trim()?.charAt(0)?.toUpperCase() ||
                profile.username?.trim()?.charAt(0)?.toUpperCase() ||
                "?";

              const isConnecting = connectingId === profile.id;

              return (
                <article
                  key={profile.id}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "22px",
                    padding: "18px",
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)",
                      top: "-60px",
                      right: "-40px",
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "58px",
                        height: "58px",
                        minWidth: "58px",
                        borderRadius: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "21px",
                        fontWeight: 800,
                        background:
                          "linear-gradient(135deg, #7c3aed, #2563eb, #ec4899)",
                        boxShadow: "0 8px 25px rgba(124,58,237,0.3)",
                      }}
                    >
                      {initials}
                    </div>

                    {/* Profile details */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "17px",
                          fontWeight: 750,
                        }}
                      >
                        {profile.full_name || "Nikelink User"}
                      </h3>

                      {profile.username && (
                        <p
                          style={{
                            margin: "3px 0 0",
                            color: "#a78bfa",
                            fontSize: "13px",
                          }}
                        >
                          @{profile.username}
                        </p>
                      )}

                      {profile.country && (
                        <p
                          style={{
                            margin: "5px 0 0",
                            color: "rgba(255,255,255,0.55)",
                            fontSize: "12px",
                          }}
                        >
                          🌍 {profile.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p
                      style={{
                        position: "relative",
                        zIndex: 1,
                        margin: "15px 0 0",
                        color: "rgba(255,255,255,0.68)",
                        fontSize: "13px",
                        lineHeight: 1.55,
                      }}
                    >
                      {profile.bio}
                    </p>
                  )}

                  {/* Interests */}
                  {profile.interests && profile.interests.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "7px",
                        marginTop: "13px",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {profile.interests.slice(0, 5).map((interest) => (
                        <span
                          key={interest}
                          style={{
                            padding: "6px 9px",
                            borderRadius: "999px",
                            background: "rgba(139,92,246,0.1)",
                            border:
                              "1px solid rgba(139,92,246,0.18)",
                            color: "#c4b5fd",
                            fontSize: "11px",
                          }}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: "9px",
                      marginTop: "17px",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <button
                      onClick={() =>
                        router.push(`/profile?user=${profile.id}`)
                      }
                      style={{
                        flex: 1,
                        height: "42px",
                        borderRadius: "13px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.045)",
                        color: "#fff",
                        fontWeight: 650,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() => handleConnect(profile.id)}
                      disabled={
                        isConnecting ||
                        connectionLabel === "Connected" ||
                        connectionLabel === "Request Sent"
                      }
                      style={{
                        flex: 1,
                        height: "42px",
                        borderRadius: "13px",
                        border: "none",
                        background:
                          connectionLabel === "Connected"
                            ? "rgba(34,197,94,0.15)"
                            : connectionLabel === "Request Sent"
                              ? "rgba(255,255,255,0.08)"
                              : connectionLabel === "Respond"
                                ? "linear-gradient(135deg, #ec4899, #8b5cf6)"
                                : "linear-gradient(135deg, #7c3aed, #2563eb)",
                        color:
                          connectionLabel === "Connected"
                            ? "#86efac"
                            : "#fff",
                        fontWeight: 750,
                        fontSize: "12px",
                        cursor:
                          isConnecting ||
                          connectionLabel === "Connected" ||
                          connectionLabel === "Request Sent"
                            ? "default"
                            : "pointer",
                        opacity: isConnecting ? 0.7 : 1,
                        boxShadow:
                          connectionLabel === "Connect"
                            ? "0 8px 25px rgba(124,58,237,0.25)"
                            : "none",
                      }}
                    >
                      {isConnecting ? "Sending..." : connectionLabel}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom navigation */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "72px",
          background: "rgba(5,8,22,0.94)",
          backdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
        
