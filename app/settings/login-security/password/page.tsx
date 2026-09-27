"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("Your session has expired. Please log in again.");
        setLoading(false);
        return;
      }

      const email = userData.user.email;

      if (!email) {
        setError("We could not find the email connected to your account.");
        setLoading(false);
        return;
      }

      // Verify the current password first
      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

      if (verifyError) {
        setError("Your current password is incorrect.");
        setLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Unable to change your password.");
        setLoading(false);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage("Your password has been changed successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto min-h-screen max-w-2xl px-5 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl transition hover:bg-white/10"
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-bold">Change password</h1>
            <p className="mt-1 text-sm text-white/50">
              Keep your Nikelink account secure
            </p>
          </div>
        </div>

        {/* Card */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
          <div className="mb-7">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-2xl">
              🔐
            </div>

            <h2 className="text-xl font-semibold">Update your password</h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Enter your current password, then choose a new password for your
              Nikelink account.
            </p>
          </div>

          {/* Current password */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-white/80">
              Current password
            </label>

            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 pr-14 text-white outline-none transition placeholder:text-white/25 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              />

              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white"
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-white/80">
              New password
            </label>

            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 pr-14 text-white outline-none transition placeholder:text-white/25 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              />

              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white"
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>

            <p className="mt-2 text-xs text-white/35">
              Use at least 8 characters.
            </p>
          </div>

          {/* Confirm password */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/80">
              Confirm new password
            </label>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 pr-14 text-white outline-none transition placeholder:text-white/25 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-300">
              {message}
            </div>
          )}

          {/* Button */}
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-5 py-4 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.01] hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Changing password..." : "Change password"}
          </button>
        </section>

        {/* Security note */}
        <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
          <p className="text-xs leading-5 text-white/35">
            For your security, Nikelink verifies your current password before
            updating it.
          </p>
        </div>

        {/* Back */}
        <button
          onClick={() => router.push("/settings/login-security")}
          className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
        >
          ← Back to Login & security
        </button>
      </div>
    </main>
  );
}
