"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const interestOptions = [
  "Technology",
  "Business",
  "Music",
  "Sports",
  "Education",
  "Fashion",
  "Gaming",
  "Travel",
  "Art",
  "Photography",
  "Movies",
  "Fitness",
];

export default function ProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.replace("/login");
        return;
      }

      setUserId(userData.user.id);
      setEmail(userData.user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name ?? "");
        setUsername(profile.username ?? "");
        setCountry(profile.country ?? "");
        setBio(profile.bio ?? "");
        setAgeGroup(profile.age_group ?? "");
        setInterests(profile.interests ?? []);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      country: country.trim(),
      bio: bio.trim(),
      age_group: ageGroup,
      interests,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Profile saved successfully.");

    setTimeout(() => {
      router.replace("/dashboard");
    }, 800);

    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <p className="text-white/50">Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-black">
              N
            </div>

            <span className="text-xl font-black">Nikelink</span>
          </div>

          <button
            onClick={handleSignOut}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>

        {/* TITLE */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-400">
            Your profile
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Tell the world about you.
          </h1>

          <p className="mt-4 max-w-2xl text-white/45">
            Complete your Nikelink profile so people can discover and connect
            with you.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSave}
          className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl sm:p-8"
        >
          {/* EMAIL */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Email
            </label>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white/40">
              {email}
            </div>
          </div>

          {/* FULL NAME */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Full name
            </label>

            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-blue-500"
            />
          </div>

          {/* USERNAME */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Username
            </label>

            <div className="flex items-center rounded-xl border border-white/10 bg-[#050816]">
              <span className="pl-4 text-white/30">@</span>

              <input
                type="text"
                required
                minLength={3}
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                  )
                }
                placeholder="username"
                className="w-full bg-transparent px-2 py-3 text-white outline-none placeholder:text-white/25"
              />
            </div>
          </div>

          {/* COUNTRY */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Country
            </label>

            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Nigeria"
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-blue-500"
            />
          </div>

          {/* AGE GROUP */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Age group
            </label>

            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">Select age group</option>
              <option value="18-24">18–24</option>
              <option value="25-34">25–34</option>
              <option value="35-44">35–44</option>
              <option value="45-54">45–54</option>
              <option value="55+">55+</option>
            </select>
          </div>

          {/* BIO */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a little about yourself..."
              rows={4}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-blue-500"
            />
          </div>

          {/* INTERESTS */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-semibold text-white/70">
              Your interests
            </label>

            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => {
                const selected = interests.includes(interest);

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SAVE */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving profile..." : "Save profile"}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-white/60">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
