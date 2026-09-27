"use client";

import { useRouter } from "next/navigation";

export default function HelpSupportPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto min-h-screen max-w-2xl px-5 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-bold">Help & Support</h1>
            <p className="mt-1 text-sm text-white/50">
              Get help with your Nikelink account
            </p>
          </div>
        </div>

        {/* Welcome */}
        <section className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-fuchsia-500/20 text-2xl">
            💬
          </div>

          <h2 className="text-xl font-semibold">
            How can we help?
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Find answers to common questions or get help with your Nikelink
            account and experience.
          </p>
        </section>

        {/* Help options */}
        <section className="mb-5 space-y-3">
          <button
            onClick={() =>
              alert(
                "If you are having trouble with your account, first check your internet connection and make sure you are using the correct login details."
              )
            }
            className="flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-blue-500/20 hover:bg-white/[0.07]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">
              🔐
            </div>

            <div className="flex-1">
              <h3 className="font-semibold">Account & Login</h3>
              <p className="mt-1 text-sm text-white/40">
                Problems signing in or accessing your account
              </p>
            </div>

            <span className="text-xl text-white/30">›</span>
          </button>

          <button
            onClick={() =>
              alert(
                "You can manage your profile, password, blocked users, and other account settings from the Settings section."
              )
            }
            className="flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-violet-500/20 hover:bg-white/[0.07]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-xl">
              ⚙️
            </div>

            <div className="flex-1">
              <h3 className="font-semibold">Account Settings</h3>
              <p className="mt-1 text-sm text-white/40">
                Manage your Nikelink account and preferences
              </p>
            </div>

            <span className="text-xl text-white/30">›</span>
          </button>

          <button
            onClick={() =>
              alert(
                "If you see content or behaviour that violates Nikelink rules, use the available report tools on the relevant post, profile, or conversation."
              )
            }
            className="flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-fuchsia-500/20 hover:bg-white/[0.07]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-xl">
              🚩
            </div>

            <div className="flex-1">
              <h3 className="font-semibold">Report a Problem</h3>
              <p className="mt-1 text-sm text-white/40">
                Report content, accounts, or technical problems
              </p>
            </div>

            <span className="text-xl text-white/30">›</span>
          </button>
        </section>

        {/* Frequently asked questions */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-5 text-lg font-semibold">
            Frequently asked questions
          </h2>

          <div className="space-y-4">
            <details className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <summary className="cursor-pointer list-none font-medium">
                How do I change my password?
              </summary>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Go to Settings, open Security, then select Login & security
                and choose Change password.
              </p>
            </details>

            <details className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <summary className="cursor-pointer list-none font-medium">
                How do I block someone?
              </summary>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Open the person's profile and use the available blocking
                option. You can manage blocked accounts from Settings.
              </p>
            </details>

            <details className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <summary className="cursor-pointer list-none font-medium">
                How do I report a post?
              </summary>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Open the post menu and use the report option when available.
                Please provide accurate information when reporting content.
              </p>
            </details>

            <details className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <summary className="cursor-pointer list-none font-medium">
                How do I manage my account?
              </summary>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Open Settings from your Nikelink account to access your
                account, security, blocked users, and other available
                settings.
              </p>
            </details>
          </div>
        </section>

        {/* Contact support */}
        <section className="mb-5 rounded-3xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.08] to-blue-500/[0.04] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-xl">
            🛟
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            Still need help?
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/50">
            If you cannot find an answer, contact the Nikelink support team
            with details about the problem you are experiencing.
          </p>

          <button
            onClick={() =>
              alert(
                "Nikelink support contact will be connected here as the support system is expanded."
              )
            }
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-5 py-4 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.01]"
          >
            Contact Nikelink Support
          </button>
        </section>

        {/* Back */}
        <button
          onClick={() => router.push("/settings")}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
        >
          ← Back to Settings
        </button>
      </div>
    </main>
  );
            }
