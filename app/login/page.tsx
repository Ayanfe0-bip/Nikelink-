"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          setMessage(
            "Account created! Check your email to confirm your account."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          setMessage("Login successful! Welcome to Nikelink.");
        }
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
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold">
            N
          </div>

          <h1 className="text-3xl font-bold">
            {isSignUp ? "Join Nikelink" : "Welcome back"}
          </h1>

          <p className="mt-2 text-slate-400">
            {isSignUp
              ? "Create your Nikelink account"
              : "Sign in to your Nikelink account"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
        >
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>

            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-slate-300">
              {message}
            </p>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
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
            className="mt-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            {isSignUp ? "Sign in instead" : "Create an account"}
          </button>
        </div>

      </div>
    </main>
  );
}
