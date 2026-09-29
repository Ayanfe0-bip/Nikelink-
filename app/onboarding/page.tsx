"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const INTERESTS = [
  "Technology",
  "Business",
  "Education",
  "Music",
  "Sports",
  "Gaming",
  "Creativity",
  "Career",
  "Faith",
  "Community",
  "Science",
  "Entertainment",
  "Travel",
  "Fashion",
  "Health",
  "Finance",
];

export default function OnboardingPage() {
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profile")
      .select("full_name, interests")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      setUserName(profile.full_name || "");

      if (Array.isArray(profile.interests)) {
        setSelected(profile.interests);
      }
    }

    setLoading(false);
  }

  function toggleInterest(interest: string) {
    setSelected((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest);
      }

      if (current.length >= 6) {
        return current;
      }

      return [...current, interest];
    });
  }

  async function saveInterests() {
    if (selected.length === 0) return;

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("profile")
      .update({
        interests: selected,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Unable to save your interests. Please try again.");
      setSaving(false);
      return;
    }

    router.replace("/discover");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
            <p className="mt-4 text-sm text-white/40">
              Preparing your Nikelink experience...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute bottom-[-120px] right-[-100px] h-72 w-72 rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push("/feed")}
            className="text-xl font-black tracking-tight"
          >
            Nike<span className="text-violet-400">link</span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            Skip
          </button>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12">
          <div className="mb-8">
            <div className="mb-5 inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              Personalize Nikelink
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              {userName
                ? `Welcome, ${userName.split(" ")[0]}.`
                : "Welcome to Nikelink."}
              <span className="mt-2 block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                What are you interested in?
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
              Choose up to 6 interests. We'll use them to help you discover
              people, communities and conversations that match what you care
              about.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {INTERESTS.map((interest) => {
              const active = selected.includes(interest);

              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`group relative min-h-[72px] rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-violet-400/50 bg-violet-500/15 shadow-lg shadow-violet-600/10"
                      : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-black ${
                        active ? "text-white" : "text-white/65"
                      }`}
                    >
                      {interest}
                    </span>

                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-black transition ${
                        active
                          ? "border-violet-300 bg-violet-500 text-white"
                          : "border-white/10 bg-white/5 text-white/20"
                      }`}
                    >
                      {active ? "✓" : "+"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-white/35">
              {selected.length}/6 selected
            </p>

            {selected.length >= 6 && (
              <p className="text-xs font-semibold text-violet-300">
                Maximum reached
              </p>
            )}
          </div>

          <button
            onClick={saveInterests}
            disabled={selected.length === 0 || saving}
            className="mt-7 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 py-4 text-sm font-black shadow-xl shadow-violet-600/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving your interests..." : "Continue to Nikelink →"}
          </button>

          <p className="mt-4 text-center text-[11px] leading-5 text-white/25">
            You can change your interests later from your profile.
          </p>
        </section>
      </div>
    </main>
  );
          }
