import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { getAuthClaims } from "@/lib/supabase/server";

export const instant = false;

async function HeaderFromAuth() {
  const claims = await getAuthClaims();
  return <AppHeader email={typeof claims?.email === "string" ? claims.email : null} />;
}

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Keep header and page data in separate Suspense trees so they fetch in parallel
  // instead of page waiting on layout auth.
  return (
    <>
      <Suspense
        fallback={
          <header className="border-b border-border bg-navy px-4 py-3 text-white">
            <div className="mx-auto max-w-6xl text-sm text-white/70">Loading…</div>
          </header>
        }
      >
        <HeaderFromAuth />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
