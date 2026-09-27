"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function SettingsPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("Nikelink User");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setUserName(
          profile.full_name ||
            profile.username ||
            "Nikelink User"
        );
      }

      setLoading(false);
    }

    loadSettings();
  }, [router]);

  function showMessage(text: string) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-black shadow-lg shadow-blue-500/20">
            N
          </div>

          <p className="text-sm text-white/40">
            Loading settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-5">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ←
          </button>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
              Nikelink
            </p>

            <h1 className="text-xl font-black">
              Settings
            </h1>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-3xl px-5 py-6">
        {message && (
          <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-center text-sm text-blue-300">
            {message}
          </div>
        )}

        {/* ACCOUNT */}
        <div className="mb-6">
          <p className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-white/30">
            Account
          </p>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
            <button
              onClick={() => router.push("/profile")}
              className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.04]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-violet-600 to-pink-500 text-xl font-black shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {userName}
                </p>

                <p className="mt-1 truncate text-sm text-white/40">
                  {email}
                </p>
              </div>

              <span className="text-xl text-white/25">
                →
              </span>
            </button>

            <div className="border-t border-white/10" />

            <button
              onClick={() => router.push("/profile")}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-sm font-semibold">
                  Edit profile
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Change your name, username and bio
                </p>
              </div>

              <span className="text-white/25">
                →
              </span>
            </button>
          </div>
        </div>

        {/* PREFERENCES */}
        <div className="mb-6">
          <p className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-white/30">
            Preferences
          </p>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
            {/* NOTIFICATIONS */}
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-xl">
                🔔
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Notifications
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Receive connection and activity alerts
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotifications(!notifications);
                  showMessage(
                    !notifications
                      ? "Notifications enabled."
                      : "Notifications disabled."
                  );
                }}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  notifications
                    ? "bg-violet-600"
                    : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    notifications
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-white/10" />

            {/* DARK MODE */}
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">
                🌙
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Dark mode
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Use Nikelink's dark appearance
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDarkMode(!darkMode);
                  showMessage(
                    !darkMode
                      ? "Dark mode enabled."
                      : "Dark mode setting changed."
                  );
                }}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  darkMode
                    ? "bg-blue-600"
                    : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    darkMode
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* PRIVACY */}
        
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
  <button
    onClick={() => router.push("/settings/blocked")}
    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.04]"
  >
    <div>
      <p className="text-sm font-semibold">
        Blocked users
      </p>

      <p className="mt-1 text-sm text-white/40">
        Manage people you've blocked
      </p>
    </div>

    <span className="text-white/25">
      →
    </span>
  </button>
</div>

        {/* SECURITY */}
        <div className="mb-6">
          <p className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-white/30">
            Security
          </p>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
            <button
              onClick={() =>
                showMessage(
                  "Password management will be connected next."
                )
              }
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-sm font-semibold">
                  Change password
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Update your Nikelink password
                </p>
              </div>

              <span className="text-white/25">
                →
              </span>
            </button>

            <div className="border-t border-white/10" />

            <button
              onClick={() =>
                showMessage(
                  "Account security options will be added next."
                )
              }
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-sm font-semibold">
                  Login & security
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Manage account security
                </p>
              </div>

              <span className="text-white/25">
                →
              </span>
            </button>
          </div>
        </div>

        {/* ABOUT */}
        <div className="mb-6">
          <p className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-white/30">
            About Nikelink
          </p>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
            <button
              onClick={() =>
                showMessage(
                  "Nikelink is built by Ayanfe Innovation Labs Limited."
                )
              }
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-sm font-semibold">
                  About
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Learn more about Nikelink
                </p>
              </div>

              <span className="text-white/25">
                →
              </span>
            </button>

            <div className="border-t border-white/10" />

            <button
              onClick={() =>
                showMessage(
                  "Nikelink help center will be added later."
                )
              }
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-sm font-semibold">
                  Help & support
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Get help with your account
                </p>
              </div>

              <span className="text-white/25">
                →
              </span>
            </button>

            <div className="border-t border-white/10" />

            <button
              onClick={() =>
                showMessage(
                  "Terms and privacy pages will be added later."
                )
              }
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-sm font-semibold">
                  Terms & privacy
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Nikelink policies and terms
                </p>
              </div>

              <span className="text-white/25">
                →
              </span>
            </button>
          </div>
        </div>

        {/* SIGN OUT */}
        <button
          onClick={handleSignOut}
          className="mb-6 w-full rounded-2xl border border-red-500/20 bg-red-500/5 py-4 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
        >
          Sign out
        </button>

        <div className="pb-6 text-center">
          <p className="text-xs font-semibold text-white/20">
            Nikelink
          </p>

          <p className="mt-1 text-[10px] text-white/15">
            Connect. Share. Belong.
          </p>

          <p className="mt-2 text-[10px] text-white/10">
            Ayanfe Innovation Labs Limited
          </p>
        </div>
      </section>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-around px-2">
          <button
            onClick={() => router.push("/feed")}
            className="flex flex-col items-center gap-1 px-4 text-white/40"
          >
            <span className="text-xl">⌂</span>
            <span className="text-[10px]">
              Home
            </span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="flex flex-col items-center gap-1 px-4 text-white/40"
          >
            <span className="text-xl">⌕</span>
            <span className="text-[10px]">
              Discover
            </span>
          </button>

          <button
            onClick={() => router.push("/feed")}
            className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl font-light shadow-lg shadow-blue-500/20"
          >
            +
          </button>

          <button
            onClick={() => router.push("/notifications")}
            className="flex flex-col items-center gap-1 px-4 text-white/40"
          >
            <span className="text-xl">♡</span>
            <span className="text-[10px]">
              Alerts
            </span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center gap-1 px-4 text-white/40"
          >
            <span className="text-xl">◯</span>
            <span className="text-[10px]">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
      }
