"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [avatarUrl, setAvatarUrl] = useState("");

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

      const user = userData.user;

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name ?? "");
        setUsername(profile.username ?? "");
        setCountry(profile.country ?? "");
        setBio(profile.bio ?? "");
        setAgeGroup(profile.age_group ?? "");
        setInterests(profile.interests ?? []);
        setAvatarUrl(profile.avatar_url ?? "");
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

    const cleanUsername = username.trim().toLowerCase();

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim(),
      username: cleanUsername,
      country: country.trim(),
      bio: bio.trim(),
      age_group: ageGroup,
      interests,
      avatar_url: avatarUrl.trim() || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Profile saved successfully.");

    setTimeout(() => {
      router.refresh();
    }, 700);

    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const initials = useMemo(() => {
    const name = fullName.trim();

    if (!name) return "N";

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }, [fullName]);

  const completionItems = [
    fullName.trim(),
    username.trim(),
    country.trim(),
    bio.trim(),
    interests.length > 0 ? "yes" : "",
  ];

  const completedItems = completionItems.filter(Boolean).length;
  const completion = Math.round((completedItems / completionItems.length) * 100);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-blue-600/40" />
          <p className="text-sm text-white/45">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white sm:pb-10">
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute right-[-100px] top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-[140px]" />
        <div className="absolute bottom-[-150px] left-1/3 h-80 w-80 rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      {/* TOP BAR */}
      <header className="relative border-b border-white/[0.06] bg-[#050816]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-black shadow-lg shadow-blue-500/20">
              N
            </div>

            <span className="text-lg font-black tracking-tight">
              Nikelink
            </span>
          </button>

          <button
            onClick={handleSignOut}
            className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-white/55 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-5 pt-8 sm:px-8 sm:pt-12">
        {/* PROFILE HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="absolute right-[-80px] top-[-100px] h-64 w-64 rounded-full bg-blue-600/10 blur-[90px]" />

          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {/* AVATAR */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile avatar"
                    className="h-24 w-24 rounded-[1.7rem] object-cover ring-2 ring-blue-500/30"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-3xl font-black shadow-xl shadow-blue-500/20">
                    {initials}
                  </div>
                )}

                <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#080b1c] bg-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                  Your profile
                </p>

                <h1 className="truncate text-2xl font-black sm:text-3xl">
                  {fullName || "Your name"}
                </h1>

                <p className="mt-1 truncate text-sm text-white/40">
                  @{username || "username"}
                </p>

                {country && (
                  <p className="mt-2 text-sm text-white/45">
                    🌍 {country}
                  </p>
                )}
              </div>
            </div>

            {/* COMPLETION */}
            <div className="w-full sm:w-48">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/40">
                  Profile completion
                </span>

                <span className="text-xs font-bold text-blue-400">
                  {completion}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>

          {bio && (
            <div className="relative mt-7 border-t border-white/[0.07] pt-6">
              <p className="max-w-3xl text-sm leading-7 text-white/55">
                {bio}
              </p>
            </div>
          )}

          {interests.length > 0 && (
            <div className="relative mt-5 flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* EDIT SECTION */}
        <section className="mt-8">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              Profile settings
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Edit your profile
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Keep your profile updated so people know who they are connecting
              with.
            </p>
          </div>

          <form
            onSubmit={handleSave}
            className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl sm:p-8"
          >
            {/* EMAIL */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                Email
              </label>

              <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5 text-sm text-white/35">
                {email}
              </div>
            </div>

            {/* AVATAR URL */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                Profile image URL
              </label>

              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500"
              />

              <p className="mt-2 text-xs text-white/25">
                Photo uploads will be added with Nikelink storage.
              </p>
            </div>

            {/* NAME + USERNAME */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                  Full name
                </label>

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                  Username
                </label>

                <div className="flex rounded-xl border border-white/10 bg-[#050816]">
                  <span className="flex items-center pl-4 text-white/25">
                    @
                  </span>

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
                    className="w-full bg-transparent px-2 py-3.5 text-sm text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>

            {/* COUNTRY + AGE */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                  Country
                </label>

                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nigeria"
                  className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                  Age group
                </label>

                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">Select age group</option>
                  <option value="18-24">18–24</option>
                  <option value="25-34">25–34</option>
                  <option value="35-44">35–44</option>
                  <option value="45-54">45–54</option>
                  <option value="55+">55+</option>
                </select>
              </div>
            </div>

            {/* BIO */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                  Bio
                </label>

                <span className="text-xs text-white/20">
                  {bio.length}/300
                </span>
              </div>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people a little about yourself..."
                rows={4}
                maxLength={300}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-blue-500"
              />
            </div>

            {/* INTERESTS */}
            <div className="mt-7">
              <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-white/40">
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
                      className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                        selected
                          ? "border-blue-400/30 bg-blue-500 text-white shadow-lg shadow-blue-500/10"
                          : "border-white/10 bg-white/[0.025] text-white/45 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SAVE */}
            <div className="mt-8 border-t border-white/[0.07] pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 text-sm font-bold shadow-xl shadow-blue-600/10 transition hover:from-blue-500 hover:to-violet-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving profile..." : "Save changes"}
              </button>

              {message && (
                <p className="mt-4 text-center text-sm text-white/55">
                  {message}
                </p>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#050816]/90 backdrop-blur-2xl sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-3 py-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/40 transition hover:text-white"
          >
            <span className="text-lg">⌂</span>
            <span className="text-[10px] font-semibold">Home</span>
          </button>

          <button
            onClick={() => router.push("/Feed")}
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/40 transition hover:text-white"
          >
            <span className="text-lg">◉</span>
            <span className="text-[10px] font-semibold">Feed</span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center gap-1 px-4 py-1 text-blue-400"
          >
            <span className="text-lg">●</span>
            <span className="text-[10px] font-semibold">Profile</span>
          </button>
        </div>
      </nav>
    </main>
  );
                    }
