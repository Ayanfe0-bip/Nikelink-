"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function SecurityPage() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updatePassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setUpdating(true);

    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (updateError) {
      setError(updateError.message);
      setUpdating(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage("Your password has been updated successfully.");
    setUpdating(false);
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-10">

        {/* HEADER */}
        <header className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#050816]/90 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                router.push("/settings/login-security")
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl transition hover:bg-white/[0.08]"
              aria-label="Go back"
            >
              ←
            </button>

            <div>
              <h1 className="text-lg font-semibold">
                Change password
              </h1>

              <p className="text-xs text-white/45">
                Update your Nikelink password
              </p>
            </div>

          </div>
        </header>

        {/* CONTENT */}
        <section className="pt-6">

          {/* INTRO */}
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
              🔐
            </div>

            <h2 className="text-xl font-bold">
              Create a new password
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/45">
              Choose a strong password that you do not use
              on other websites.
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={updatePassword}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
          >

            {/* NEW PASSWORD */}
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                New password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter your new password"
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
              />

              <p className="mt-2 text-xs text-white/30">
                Use at least 8 characters.
              </p>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="mt-5">
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Enter the password again"
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-300">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-5 text-emerald-300">
                {message}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={
                updating ||
                !newPassword ||
                !confirmPassword
              }
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3.5 text-sm font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {updating
                ? "Updating password..."
                : "Update password"}
            </button>

          </form>

          {/* SECURITY NOTE */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex gap-3">

              <span className="text-lg">
                🛡️
              </span>

              <div>
                <p className="text-sm font-medium text-white/80">
                  Keep your account secure
                </p>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Never share your Nikelink password with
                  anyone. Nikelink will never ask you to send
                  your password through a message.
                </p>
              </div>

            </div>
          </div>

          {/* BACK */}
          <button
            onClick={() =>
              router.push("/settings/login-security")
            }
            className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            Back to Login & security
          </button>

          <p className="pb-6 pt-6 text-center text-xs text-white/20">
            Nikelink • Connect. Share. Belong.
          </p>

        </section>
      </div>
    </main>
  );
                                 }
