import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/properties/property-form";
import { createClient, getAuthClaims } from "@/lib/supabase/server";
import type { MandalayTownship, Property } from "@/lib/types";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

async function EditPropertyContent({ id }: { id: string }) {
  const [supabase, claims] = await Promise.all([createClient(), getAuthClaims()]);
  const userId = claims?.sub;
  if (!userId) return null;

  const [{ data: property }, { data: townships }, { data: contactRows }] =
    await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("mandalay_townships")
        .select("id, name_mm, name_en")
        .order("id"),
      supabase
        .from("property_contacts")
        .select("contacts(phones)")
        .eq("user_id", userId)
        .eq("property_id", id)
        .eq("role", "owner"),
    ]);

  if (!property) notFound();

  const phones: string[] = [];
  for (const row of contactRows ?? []) {
    const contact = row.contacts as { phones?: unknown } | null;
    const list = contact?.phones;
    if (!Array.isArray(list)) continue;
    for (const phone of list) {
      const value = phone?.toString().trim();
      if (value) phones.push(value);
    }
  }

  return (
    <PropertyForm
      mode="edit"
      propertyId={id}
      initialProperty={property as Property}
      initialPhone={phones.join(", ")}
      townships={(townships ?? []) as MandalayTownship[]}
    />
  );
}

export default async function EditPropertyPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading form…</div>}>
      <EditPropertyContent id={id} />
    </Suspense>
  );
}
