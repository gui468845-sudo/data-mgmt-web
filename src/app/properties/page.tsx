import { Suspense } from "react";
import { PropertyList } from "@/components/properties/property-list";
import { createClient, getAuthClaims } from "@/lib/supabase/server";
import type { Property, PropertyMedia } from "@/lib/types";

export const instant = false;

async function loadCoverUrls(
  userId: string,
  propertyIds: string[],
) {
  if (propertyIds.length === 0) return {} as Record<string, string>;

  const supabase = await createClient();
  const { data: media } = await supabase
    .from("property_media")
    .select(
      "property_id, storage_path, media_type, sort_order, thumbnail_path",
    )
    .eq("user_id", userId)
    .in("property_id", propertyIds)
    .order("sort_order");

  const mediaRows = (media ?? []) as Pick<
    PropertyMedia,
    "property_id" | "storage_path" | "media_type" | "sort_order" | "thumbnail_path"
  >[];

  const byProperty = new Map<string, typeof mediaRows>();
  for (const row of mediaRows) {
    const list = byProperty.get(row.property_id) ?? [];
    list.push(row);
    byProperty.set(row.property_id, list);
  }

  const pathByProperty: Record<string, string> = {};
  for (const [propertyId, rows] of byProperty) {
    const sorted = [...rows].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    const image = sorted.find((row) => row.media_type === "image");
    const videoThumb = sorted.find(
      (row) => row.media_type === "video" && row.thumbnail_path,
    );
    const video = sorted.find((row) => row.media_type === "video");
    const path =
      image?.storage_path ||
      videoThumb?.thumbnail_path ||
      video?.storage_path;
    if (path) pathByProperty[propertyId] = path;
  }

  const paths = Object.values(pathByProperty);
  if (paths.length === 0) return {} as Record<string, string>;

  const { data } = await supabase.storage
    .from("property-media")
    .createSignedUrls(paths, 3600);

  const urlByPath = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
  }

  const coverUrls: Record<string, string> = {};
  for (const [propertyId, path] of Object.entries(pathByProperty)) {
    const url = urlByPath.get(path);
    if (url) coverUrls[propertyId] = url;
  }
  return coverUrls;
}

async function loadProperties() {
  const [supabase, claims] = await Promise.all([createClient(), getAuthClaims()]);
  const userId = claims?.sub;
  if (!userId) return null;

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      error: error.message,
      rows: [] as Property[],
      userId,
    };
  }

  return {
    error: null as string | null,
    rows: (properties ?? []) as Property[],
    userId,
  };
}

async function PropertiesWithCovers({
  userId,
  rows,
}: {
  userId: string;
  rows: Property[];
}) {
  const coverUrls = await loadCoverUrls(
    userId,
    rows.map((row) => row.id),
  );
  return <PropertyList properties={rows} coverUrls={coverUrls} />;
}

async function PropertiesContent() {
  const loaded = await loadProperties();
  if (!loaded) return null;

  if (loaded.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
        Failed to load properties: {loaded.error}
      </div>
    );
  }

  const { rows, userId } = loaded;

  // Show rows first; signed cover URLs stream in after (often the slowest call).
  return (
    <Suspense fallback={<PropertyList properties={rows} coverUrls={{}} />}>
      <PropertiesWithCovers userId={userId} rows={rows} />
    </Suspense>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-muted">Loading properties…</div>}
    >
      <PropertiesContent />
    </Suspense>
  );
}
