"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale, type Locale } from "@/lib/i18n";
import { Button, ConfirmDialog } from "@/components/ui";

export function AppHeader({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  }

  function localeButtonClass(active: boolean) {
    return `rounded px-2 py-1 text-xs font-semibold transition ${
      active ? "bg-white text-navy" : "text-white/80 hover:bg-white/10"
    }`;
  }

  return (
    <>
      <header className="border-b border-border bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/properties" className="text-lg font-bold tracking-tight">
              {t("brand")}
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/properties"
                className={`rounded-md px-3 py-1.5 ${
                  pathname.startsWith("/properties") && !pathname.includes("/new")
                    ? "bg-white/15"
                    : "hover:bg-white/10"
                }`}
              >
                {t("navProperties")}
              </Link>
              <Link
                href="/properties/new"
                className={`rounded-md px-3 py-1.5 ${
                  pathname === "/properties/new"
                    ? "bg-white/15"
                    : "hover:bg-white/10"
                }`}
              >
                {t("navAddNew")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="inline-flex items-center rounded-md border border-white/25 p-0.5"
              role="group"
              aria-label={t("language")}
            >
              {(["my", "en"] as Locale[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={localeButtonClass(locale === code)}
                  onClick={() => setLocale(code)}
                  aria-pressed={locale === code}
                >
                  {code === "my" ? "မြန်မာ" : "EN"}
                </button>
              ))}
            </div>
            {email ? (
              <span className="hidden text-sm text-white/80 sm:inline">{email}</span>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => setConfirmOpen(true)}
            >
              {t("signOut")}
            </Button>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        title={t("signOutTitle")}
        message={t("signOutMessage")}
        confirmLabel={t("signOut")}
        cancelLabel={t("cancel")}
        danger
        busy={signingOut}
        onConfirm={signOut}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
