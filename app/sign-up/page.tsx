import Link from "next/link";
import { signUp } from "../auth/actions";
import Mascot from "@/components/Mascot";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-clay-surface border border-surface-border">
        {/* Logo & Mascot */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-clay-surface mb-4">
            <Mascot pose="celebrate" size={64} />
          </div>
          <div className="flex flex-col items-center">
            <span className="font-label-lg text-primary tracking-tight font-extrabold uppercase">LEGO</span>
            <span className="font-label-sm text-text-muted font-bold tracking-wide">Learn And Go</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-headline-lg text-text-primary tracking-tight font-extrabold">Create an Account</h1>
          <p className="mt-1 font-body-md text-text-muted">Join LEGO to start your learning adventure</p>
        </div>

        {/* Error Message */}
        {params.error && (
          <div className="mb-4 rounded-xl border border-error bg-error/10 p-4 text-sm text-error">
            {params.error}
          </div>
        )}

        {/* Form */}
        <form action={signUp} className="space-y-4">
          <div>
            <label className="block font-label-md text-text-primary mb-1">Display Name</label>
            <input
              type="text"
              name="displayName"
              placeholder="Your name"
              className="mt-1 block w-full rounded-xl border border-surface-border bg-surface-container px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block font-label-md text-text-primary mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-xl border border-surface-border bg-surface-container px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block font-label-md text-text-primary mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-surface-border bg-surface-container px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-primary text-on-primary px-4 py-2.5 font-label-md font-bold uppercase tracking-wider shadow-clay-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all active:translate-y-[2px]"
          >
            Sign Up
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center font-body-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-label-md font-bold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
