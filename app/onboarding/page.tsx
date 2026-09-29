"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const interests = [
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
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profile")
      .select("interests")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.interests && Array.isArray(profile.interests)) {
      setSelected(profile.interests);
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
    if (selected.length === 0) {
      setMessage("Choose at least one interest to continue.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const userId = authData.user.id;

    const { data: existingProfile, error: profileCheckError } =
      await supabase
        .from("profile")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

    if (profileCheckError) {
      setMessage(profileCheckError.message);
      setSaving(false);
      return;
    }

    let error;

    if (existingProfile) {
      const result = await supabase
        .from("profile")
        .update({
          interests: selected,
        })
        .eq("id", userId);

      error = result.error;
    } else {
      const result = await supabase.from("profile").insert({
        id: userId,
        full_name:
          authData.user.user_metadata?.full_name ||
          authData.user.email?.split("@")[0] ||
          "Nikelink User",
        username:
          authData.user.user_metadata?.username ||
          `user_${userId.slice(0, 8)}`,
        avatar_url: null,
        country: authData.user.user_metadata?.country || null,
        interests: selected,
      });

      error = result.error;
    }

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.replace("/discover");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-sm text-white/50">
          Preparing your Nikelink experience...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white px-5 py-8">
      <div className="mx-auto flex min-h-[90vh] max-w-2xl flex-col justify-center">

        {/* BRAND */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-blue-500 text-2xl font-black shadow-2xl shadow-violet-600/30">
            N
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300/70">
            Welcome to Nikelink
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Find your people.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
            Choose the things you're interested in and we'll help you discover
            people, communities and conversations that match you.
          </p>
        </div>

        {/* INTEREST CARD */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-7">

          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black">
                What are you into?
              </h2>

              <p className="mt-1 text-xs text-white/35">
                Select up to 6 interests.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black text-white/50">
              {selected.length}/6
            </div>
          </div>

          {/* INTEREST BUTTONS */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {interests.map((interest) => {
              const active = selected.includes(interest);

              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-bold transition ${
                    active
                      ? "border-violet-400/50 bg-gradient-to-br from-violet-600/30 to-blue-600/20 text-white shadow-lg shadow-violet-600/10"
                      : "border-white/10 bg-white/[0.025] text-white/55 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{interest}</span>

                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-200">
              {message}
            </div>
          )}

          {/* CONTINUE */}
          <button
            type="button"
            onClick={saveInterests}
            disabled={saving}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-600 py-4 text-sm font-black text-white shadow-xl shadow-violet-600/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving your interests..." : "Continue to Nikelink →"}
          </button>

          {/* SKIP */}
          <button
            type="button"
            onClick={() => router.replace("/discover")}
            className="mt-4 w-full py-2 text-xs font-bold text-white/30 transition hover:text-white/60"
          >
            Skip for now
          </button>
        </section>

        {/* FOOTER */}
        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
          Connect. Share. Belong.
        </p>
      </div>
    </main>
  );
        }
