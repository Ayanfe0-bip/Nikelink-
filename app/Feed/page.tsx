"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Post = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default function FeedPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState("");

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, content, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    async function initialize() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
        return;
      }

      setUserId(data.user.id);
      await loadPosts();
    }

    initialize();
  }, [router]);

  async function createPost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!content.trim() || !userId) return;

    setPosting(true);

    const { error } = await supabase.from("posts").insert({
      user_id: userId,
      content: content.trim(),
    });

    if (!error) {
      setContent("");
      await loadPosts();
    }

    setPosting(false);
  }

  async function deletePost(id: string) {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (!error) {
      setPosts((current) =>
        current.filter((post) => post.id !== id)
      );
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">

          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black">
              N
            </div>

            <span className="text-xl font-black">
              Nikelink
            </span>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
          >
            Dashboard
          </button>

        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-2xl px-5 py-10">

        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-400">
            Your social world
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Feed
          </h1>

          <p className="mt-3 text-white/40">
            Share your thoughts and discover what people are saying.
          </p>
        </div>

        {/* CREATE POST */}
        <form
          onSubmit={createPost}
          className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-2xl border border-white/10 bg-[#050816] px-4 py-4 text-white outline-none placeholder:text-white/25 focus:border-blue-500"
          />

          <div className="mt-4 flex items-center justify-between">

            <span className="text-xs text-white/25">
              {content.length}/1000
            </span>

            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {posting ? "Posting..." : "Post"}
            </button>

          </div>
        </form>

        {/* POSTS */}
        <div className="mt-8 space-y-5">

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/40">
              Loading your feed...
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                ✦
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Your feed is empty
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Be the first person to share something on Nikelink.
              </p>

            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
              >

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-bold">
                    N
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Nikelink member
                    </p>

                    <p className="text-xs text-white/30">
                      {formatDate(post.created_at)}
                    </p>
                  </div>

                  {post.user_id === userId && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="ml-auto text-xs font-semibold text-red-400/70 hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}

                </div>

                <p className="mt-5 whitespace-pre-wrap leading-7 text-white/75">
                  {post.content}
                </p>

                <div className="mt-5 flex gap-6 border-t border-white/10 pt-4 text-sm text-white/35">
                  <button className="hover:text-white">
                    ♡ Like
                  </button>

                  <button className="hover:text-white">
                    ◯ Comment
                  </button>

                  <button className="hover:text-white">
                    ↗ Share
                  </button>
                </div>

              </article>
            ))
          )}

        </div>

      </section>
    </main>
  );
      }
