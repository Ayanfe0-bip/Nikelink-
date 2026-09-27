"use client";

import { useRouter } from "next/navigation";

export default function TermsPrivacyPage() {
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
            <h1 className="text-2xl font-bold">Terms & Privacy</h1>
            <p className="mt-1 text-sm text-white/50">
              Your privacy and your use of Nikelink
            </p>
          </div>
        </div>

        {/* Intro */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-fuchsia-500/20 text-2xl">
            🛡️
          </div>

          <h2 className="text-xl font-semibold">
            Nikelink Terms & Privacy
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/50">
            This page provides general information about how Nikelink is
            intended to operate and how users should use the platform.
          </p>

          <p className="mt-3 text-xs text-white/30">
            Last updated: September 2026
          </p>
        </section>

        {/* Terms of Use */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Terms of Use
          </h2>

          <p className="text-sm leading-7 text-white/60">
            By using Nikelink, you agree to use the platform responsibly and
            respect other members of the community.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <h3 className="font-medium text-white">
                1. Respect other users
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Do not use Nikelink to harass, threaten, impersonate, or
                deliberately harm other people.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">
                2. Use accurate information
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Do not intentionally create accounts or profiles designed to
                deceive other users.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">
                3. Respect intellectual property
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Only share content that you have the right to share or that
                you are otherwise legally permitted to use.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">
                4. Do not misuse the platform
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Do not attempt to disrupt Nikelink, abuse its systems, access
                other users' accounts, or interfere with platform security.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">
                5. Content responsibility
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                You are responsible for the content you choose to publish,
                share, upload, or communicate through Nikelink.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Privacy
          </h2>

          <p className="text-sm leading-7 text-white/60">
            Nikelink is designed to provide social and community features
            while giving users control over their account information and
            interactions.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <h3 className="font-medium text-white">
                Information you provide
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                This may include information such as your name, email address,
                profile information, posts, comments, and other information
                you choose to provide.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">
                Account information
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Account information is used to provide authentication,
                security, and access to Nikelink features.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">
                Your content
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Content you publish may be visible to other users depending on
                the feature and visibility settings available on Nikelink.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">
                Security
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Nikelink uses security measures intended to protect accounts
                and information. However, no online service can guarantee
                complete security.
              </p>
            </div>
          </div>
        </section>

        {/* Data control */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Your account and data
          </h2>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <h3 className="font-medium">Manage your account</h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                You can manage available account and security settings from
                the Settings section.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <h3 className="font-medium">Control your interactions</h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Nikelink provides features such as blocking and reporting to
                help users manage their interactions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <h3 className="font-medium">Keep your account secure</h3>
              <p className="mt-1 text-sm leading-6 text-white/40">
                Keep your password private and use a strong password that you
                do not reuse across multiple services.
              </p>
            </div>
          </div>
        </section>

        {/* Future policy notice */}
        <section className="mb-5 rounded-3xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.08] to-blue-500/[0.04] p-6">
          <h2 className="mb-3 text-lg font-semibold">
            Policy updates
          </h2>

          <p className="text-sm leading-7 text-white/50">
            As Nikelink grows and new features are introduced, these terms and
            privacy information may be updated. Important changes will be
            communicated through the platform where appropriate.
          </p>
        </section>

        {/* Company */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Nikelink
          </p>

          <p className="mt-2 font-semibold">
            Ayanfe Innovation Labs Limited
          </p>

          <p className="mt-2 text-xs text-white/30">
            Connect. Share. Belong.
          </p>
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
