// Landing page placeholder — implemented in TASK-095
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold tracking-tight">AI Habit Coach</h1>
      <p className="max-w-prose text-center text-lg text-muted-foreground">
        Build lasting habits with AI-powered coaching and real social accountability.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Get Started Free
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-input px-6 py-3 hover:bg-accent"
        >
          Log In
        </Link>
      </div>
    </main>
  );
}
