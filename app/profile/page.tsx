"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [userId, setUserId] = useState("");
  const [unreadNotifications, setUnreadNotifications] =
  useState(0);
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

useEffect(() => {
  if (!userId) return;

  const loadUnreadNotifications = async () => {
    const { count, error } = await supabase
      .from("notification")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      setUnreadNotifications(count || 0);
    }
  };

  loadUnreadNotifications();
}, [userId]);

  function toggleInterest(interest: string) {
  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  }

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !userId) return;

    setMessage("");

    // Basic validation
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    // 5MB maximum
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Profile picture must be smaller than 5MB.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}.${fileExtension}`;

      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        setMessage(uploadError.message);
        setUploadingAvatar(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newAvatarUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        setMessage(profileError.message);
        setUploadingAvatar(false);
        return;
      }

      setAvatarUrl(newAvatarUrl);
      setMessage("Profile picture updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading your photo."
      );
    }

    setUploadingAvatar(false);

    // Allows selecting the same image again later.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const completion = Math.round(
    (completedItems / completionItems.length) * 100
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-blue-500/40 to-violet-600/40" />

          <p className="text-sm text-white/45">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] pb-24 text-white sm:pb-10">

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute right-[-140px] top-[25%] h-[450px] w-[450px] rounded-full bg-violet-600/10 blur-[150px]" />

        <div className="absolute bottom-[-180px] left-[25%] h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[140px]" />
      </div>

      {/* TOP BAR */}

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050816]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">

          <button
            onClick={() => router.push("/feed")}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-sm font-black shadow-lg shadow-blue-500/20">
              N
            </div>

            <span className="text-lg font-black tracking-tight">
              Nikelink
            </span>
          </button>

          <button
            onClick={handleSignOut}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/55 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* MAIN */}

      <div className="relative mx-auto max-w-5xl px-5 pt-7 sm:px-8 sm:pt-10">

        {/* PROFILE HERO */}

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 sm:p-8">

          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />

          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />

          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">

            {/* IDENTITY */}

            <div className="flex min-w-0 items-center gap-5">

              {/* AVATAR */}

              <div className="relative shrink-0">

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="group relative block"
                  aria-label="Change profile picture"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile avatar"
                      className="h-24 w-24 rounded-[1.7rem] object-cover ring-2 ring-blue-500/30 shadow-xl shadow-blue-500/10"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 text-3xl font-black shadow-xl shadow-blue-500/20">
                      {initials}
                    </div>
                  )}

                  {/* HOVER OVERLAY */}

                  <div className="absolute inset-0 flex items-center justify-center rounded-[1.7rem] bg-black/0 transition group-hover:bg-black/50">
                    <span className="text-xl opacity-0 transition group-hover:opacity-100">
                      📷
                    </span>
                  </div>

                  {/* UPLOAD INDICATOR */}

                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-[1.7rem] bg-black/70">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    </div>
                  )}
                </button>

                {/* ONLINE */}

                <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#080b1c] bg-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>

                {/* HIDDEN FILE INPUT */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div className="min-w-0">

                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
                  Your profile
                </p>

                <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
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

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="mt-3 text-xs font-semibold text-blue-400 transition hover:text-blue-300 disabled:opacity-50"
                >
                  {uploadingAvatar
                    ? "Uploading..."
                    : avatarUrl
                    ? "Change profile picture"
                    : "Add profile picture"}
                </button>
              </div>
            </div>

            {/* COMPLETION */}

            <div className="w-full rounded-2xl border border-white/[0.06] bg-black/10 p-4 sm:w-52">

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
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <p className="mt-2 text-[10px] text-white/25">
                Complete your profile to help people connect with you.
              </p>
            </div>
          </div>

          {/* BIO */}

          {bio && (
            <div className="relative mt-7 border-t border-white/[0.07] pt-6">
              <p className="max-w-3xl text-sm leading-7 text-white/55">
                {bio}
              </p>
            </div>
          )}

          {/* INTERESTS */}

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

        {/* EDIT PROFILE */}

        <section className="mt-9">

          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Profile settings
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Edit your profile
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
              Keep your profile updated so people know who they are
              connecting with.
            </p>
          </div>

          <form
            onSubmit={handleSave}
            className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-8"
          >

            {/* EMAIL */}

            <div className="mb-7">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                Email
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5 text-sm text-white/35">
                <span className="text-base">
                  ✉
                </span>

                <span className="truncate">
                  {email}
                </span>

                <span className="ml-auto shrink-0 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  Verified
                </span>
              </div>
            </div>

            {/* NAME + USERNAME */}

            <div className="grid gap-6 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                  Full name
                </label>

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                  Username
                </label>

                <div className="flex rounded-xl border border-white/10 bg-[#050816] focus-within:border-blue-500/60">

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
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                  Country
                </label>

                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nigeria"
                  className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
                  Age group
                </label>

                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="">
                    Select age group
                  </option>

                  <option value="18-24">
                    18–24
                  </option>

                  <option value="25-34">
                    25–34
                  </option>

                  <option value="35-44">
                    35–44
                  </option>

                  <option value="45-54">
                    45–54
                  </option>

                  <option value="55+">
                    55+
                  </option>
                </select>
              </div>
            </div>

            {/* BIO */}

            <div className="mt-6">

              <div className="mb-2 flex items-center justify-between">

                <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
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
                className="w-full resize-none rounded-xl border border-white/10 bg-[#050816] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            {/* INTERESTS */}

            <div className="mt-7">

              <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
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
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-5 py-4 text-sm font-bold shadow-xl shadow-blue-600/10 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving profile..."
                  : "Save changes"}
              </button>

              {message && (
                <div
                  className={`mt-4 rounded-xl border px-4 py-3 text-center text-sm ${
                    message ===
                    "Profile picture updated successfully."
                      ? "border-emerald-400/10 bg-emerald-500/5 text-emerald-400"
                      : message ===
                        "Profile saved successfully."
                      ? "border-emerald-400/10 bg-emerald-500/5 text-emerald-400"
                      : "border-white/[0.08] bg-white/[0.03] text-white/55"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </form>
        </section>

        {/* FOOTER */}

        <div className="py-10 text-center">
          <p className="text-xs text-white/20">
            Nikelink · Connect. Share. Belong.
          </p>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#050816]/90 backdrop-blur-2xl sm:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2.5">

          <button
            onClick={() => router.push("/feed")}
            className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-[20px] leading-none">
              ⌂
            </span>

            <span className="text-[10px] font-semibold">
              Home
            </span>
          </button>

          <button
            onClick={() => router.push("/discover")}
            className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-[19px] leading-none">
              ⌕
            </span>

            <span className="text-[10px] font-semibold">
              Discover
            </span>
          </button>

          <button
            onClick={() => router.push("/communities")}
            className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-[18px] leading-none">
              👥
            </span>

            <span className="text-[10px] font-semibold">
              Community
            </span>
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-[18px] leading-none">
              💬
            </span>

            <span className="text-[10px] font-semibold">
              Messages
            </span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl bg-blue-500/10 px-3 py-1.5 text-blue-400"
          >
            <span className="text-[18px] leading-none">
              ●
            </span>

            <span className="text-[10px] font-semibold">
              Profile
            </span>
          </button>
        </div>
     </nav>
    </main>
  );
  }
