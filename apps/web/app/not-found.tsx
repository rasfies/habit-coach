import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-neutral-900">404</h1>
      <p className="mb-6 text-neutral-500">Page not found.</p>
      <Link
        href="/"
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        Go home
      </Link>
    </div>
  );
}
