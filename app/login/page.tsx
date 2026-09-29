"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const { data, error } =
          await supabase.auth.signUp({
            email,
            password,
          });

        if (error) {
          setMessage(error.message);
          return;
        }

        /*
         * If email confirmation is disabled,
         * Supabase may immediately create a session.
         * Send the new user directly to onboarding.
         */
        if (data.session) {
          router.replace("/onboarding");
          return;
        }

        /*
         * If email confirmation is enabled,
         * the user must confirm their email first.
         */
        setMessage(
          "Account created! Check your email to confirm your account, then sign in."
        );
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (!data.user) {
          setMessage(
            "Unable to sign in. Please try again."
          );
          return;
        }

        /*
         * Check whether the user has already
         * completed Nikelink onboarding.
         */
        const { data: profile, error: profileError } =
          await supabase
            .from("profile")
            .select("interests")
            .eq("id", data.user.id)
            .maybeSingle();

        /*
         * If the profile does not exist yet,
         * send the user to onboarding so the
         * onboarding page can complete their profile.
         */
        if (profileError || !profile) {
          router.replace("/onboarding");
          return;
        }

        /*
         * Users with no selected interests are
         * treated as new users who have not
         * completed onboarding.
         */
        const interests = profile.interests;

        const hasInterests =
          Array.isArray(interests) &&
          interests.length > 0;

        if (!hasInterests) {
          router.replace("/onboarding");
          return;
        }

        /*
         * Existing users who already completed
         * onboarding continue to the normal app.
         */
        router.replace("/dashboard");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-white">
      <div className="w-full max-w-md">

        {/* BRAND */}
        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 text-2xl font-black shadow-lg shadow-violet-500/20">
            N
          </div>

          <h1 className="text-3xl font-black tracking-tight">
            {isSignUp
              ? "Join Nikelink"
              : "Welcome back"}
          </h1>

          <p className="mt-2 text-white/40">
            {isSignUp
              ? "Create your Nikelink account"
              : "Sign in to your Nikelink account"}
          </p>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >

          {/* EMAIL */}
          <div className="mb-5">

            <label className="mb-2 block text-sm font-medium text-white/70">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
            />

          </div>

          {/* PASSWORD */}
          <div className="mb-6">

            <label className="mb-2 block text-sm font-medium text-white/70">
              Password
            </label>

            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="At least 6 characters"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
            />

          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 px-4 py-3.5 font-bold shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>

          {/* MESSAGE */}
          {message && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
              {message}
            </div>
          )}

        </form>

        {/* SWITCH LOGIN / SIGNUP */}
        <div className="mt-6 text-center">

          <p className="text-sm text-white/40">
            {isSignUp
              ? "Already have an account?"
              : "Don't have a Nikelink account?"}
          </p>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage("");
            }}
            className="mt-2 text-sm font-bold text-violet-400 transition hover:text-violet-300"
          >
            {isSignUp
              ? "Sign in instead"
              : "Create an account"}
          </button>

        </div>

        {/* TAGLINE */}
        <p className="mt-8 text-center text-xs font-medium tracking-wide text-white/20">
          Connect. Share. Belong.
        </p>

      </div>
    </main>
  );
          }
