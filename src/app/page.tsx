import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthClaims } from "@/lib/supabase/server";

export const instant = false;

async function HomeRedirect(): Promise<never> {
  const claims = await getAuthClaims();
  redirect(claims?.sub ? "/properties" : "/login");
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  );
}
