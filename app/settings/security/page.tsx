"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function LoginSecurityPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setError("You are not signed in.");
      setLoading(false);
      return;
    }

    const user = data.user;

    setEmail(user.email || "");
    setUserId(user.id);

    if (user.created_at) {
      setCreatedAt(
        new Date(user.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }

    setLoading(false);
  }

  async function signOut() {
    setSigningOut(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      setSigningOut(false);
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-10">
        {/* Header */}
        <header className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#050816]/90 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/settings")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl transition hover:bg-white/[0.08]"
              aria-label="Go back"
            >
              ←
            </button>

            <div>
              <h1 className="text-lg font-semibold">Login & security</h1>
              <p className="text-xs text-white/45">
                Manage your account security
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-5 pt-6">
          {/* Account */}
          <div>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/40">
              Account
            </p>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <div className="flex items-center gap-4 border-b border-white/10 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 text-lg font-bold">
                  {email ? email.charAt(0).toUpperCase() : "N"}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {loading ? "Loading..." : email || "Nikelink account"}
                  </p>

                  <p className="mt-1 truncate text-xs text-white/45">
                    Your Nikelink account
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-2">
                <div className="bg-[#080b1d] p-4">
                  <p className="text-xs text-white/40">Account created</p>
                  <p className="mt-1 text-sm text-white/80">
                    {loading ? "Loading..." : createdAt || "Not available"}
                  </p>
                </div>

                <div className="bg-[#080b1d] p-4">
                  <p className="text-xs text-white/40">Account ID</p>
                  <p className="mt-1 truncate text-sm text-white/80">
                    {loading
                      ? "Loading..."
                      : userId
                        ? `${userId.slice(0, 8)}••••${userId.slice(-4)}`
                        : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security status */}
          <div>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/40">
              Security status
            </p>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xl">
                  🔐
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Account protection
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Your account uses Nikelink authentication to protect your
                    login.
                  </p>
                </div>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/40">
              Password
            </p>

            <button
              onClick={() => router.push("/settings/security")}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:bg-white/[0.06]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xl">
                🔑
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Change password
                </p>

                <p className="mt-1 text-xs text-white/45">
                  Update your Nikelink password
                </p>
              </div>

              <span className="text-lg text-white/30">›</span>
            </button>
          </div>

          {/* Login session */}
          <div>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/40">
              Login session
            </p>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xl">
                  📱
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Current session
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/45">
                    This is the device currently signed in to your Nikelink
                    account.
                  </p>
                </div>

                <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[11px] font-medium text-blue-300">
                  Current
                </span>
              </div>
            </div>
          </div>

          {/* Future security features */}
          <div>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/40">
              More security
            </p>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <div className="flex items-center gap-4 border-b border-white/10 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-500/10 text-xl">
                  🛡️
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Two-factor authentication
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    Extra protection for your account
                  </p>
                </div>

                <span className="text-xs text-white/30">Coming soon</span>
              </div>

              <div className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xl">
                  💻
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Active devices
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    View and manage devices signed in to your account
                  </p>
                </div>

                <span className="text-xs text-white/30">Coming soon</span>
              </div>
            </div>
