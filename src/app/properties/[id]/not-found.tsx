import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-navy">Property not found</h1>
      <p className="mt-2 text-sm text-muted">
        It may have been deleted, or you do not have access.
      </p>
      <Link
        href="/properties"
        className="mt-6 inline-block text-sm font-semibold text-accent hover:underline"
      >
        Back to properties
      </Link>
    </div>
  );
}
