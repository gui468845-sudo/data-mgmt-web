import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PropertyDetailView } from "@/components/properties/property-detail";
import { createClient, getAuthClaims } from "@/lib/supabase/server";
import type { Property, PropertyMedia } from "@/lib/types";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

async function PropertyDetailContent({ id }: { id: string }) {
  const [supabase, claims] = await Promise.all([createClient(), getAuthClaims()]);
  const userId = claims?.sub;
  if (!userId) return null;

  const [{ data: property }, { data: contactRows }, { data: mediaRows }] =
    await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("property_contacts")
        .select("contacts(phones)")
        .eq("user_id", userId)
        .eq("property_id", id),
      supabase
        .from("property_media")
        .select("*")
        .eq("user_id", userId)
        .eq("property_id", id)
        .order("sort_order"),
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

  const media = (mediaRows ?? []) as PropertyMedia[];
  const paths = media
    .map((item) =>
      item.media_type === "image"
        ? item.storage_path
        : item.thumbnail_path || item.storage_path,
    )
    .filter(Boolean);

  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("property-media")
      .createSignedUrls(paths, 3600);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
    }
  }

  const mediaWithUrls = media.map((item) => {
    const path =
      item.media_type === "image"
        ? item.storage_path
        : item.thumbnail_path || item.storage_path;
    return { ...item, url: path ? urlByPath.get(path) ?? null : null };
  });

  return (
    <PropertyDetailView
      property={property as Property}
      phones={phones}
      media={mediaWithUrls}
    />
  );
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={<div className="text-sm text-muted">Loading property…</div>}
    >
      <PropertyDetailContent id={id} />
    </Suspense>
  );
}
