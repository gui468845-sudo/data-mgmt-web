"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatLocation,
  formatPriceLakhs,
  offerLabel,
  propertyDisplayTitle,
  statusLabel,
} from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import type { Property, PropertyMedia } from "@/lib/types";
import { BackButton, Button, ConfirmDialog, ErrorBanner } from "@/components/ui";

type MediaItem = PropertyMedia & { url?: string | null };

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card px-5 py-4 shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {title}
      </h2>
      <dl className="divide-y divide-border/60">{children}</dl>
    </section>
  );
}

function MediaPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center bg-slate-100 text-sm text-muted">
      {label}
    </div>
  );
}

export function PropertyDetailView({
  property,
  phones,
  media,
}: {
  property: Property;
  phones: string[];
  media: MediaItem[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const labels = {
    untitled: t("untitled"),
    lakhs: t("lakhs"),
    negotiable: t("negotiable"),
    exact: t("exact"),
    sale: t("offerSale"),
    rent: t("offerRent"),
    available: t("statusAvailable"),
    sold: t("statusSold"),
    rented: t("statusRented"),
    archived: t("statusArchived"),
  };

  const active = media[activeIndex] ?? media[0];
  const priceText = formatPriceLakhs(
    property.price_lakhs,
    property.price_type,
    labels,
  );
  const offerText = offerLabel(property.offer_type, labels);
  const statusText = statusLabel(property.status, labels);

  async function onDelete() {
    setDeleting(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const paths = media
        .flatMap((item) => [item.storage_path, item.thumbnail_path])
        .filter((path): path is string => Boolean(path));

      if (paths.length > 0) {
        await supabase.storage.from("property-media").remove(paths);
      }

      const { error: deleteError } = await supabase
        .from("properties")
        .delete()
        .eq("id", property.id)
        .eq("user_id", user.id);
      if (deleteError) throw new Error(deleteError.message);

      router.push("/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const landValue =
    property.land_width != null || property.land_length != null
      ? `${property.land_width ?? "—"} × ${property.land_length ?? "—"} ${property.land_unit ?? "ft"}`
      : null;

  const solarValue =
    property.has_solar
      ? `${t("yes")}${property.solar_panels != null ? ` (${property.solar_panels})` : ""}`
      : property.has_solar === false
        ? t("no")
        : null;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <BackButton href="/properties" label={t("backToProperties")} />
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-[1.75rem]">
              {propertyDisplayTitle(property, labels)}
            </h1>
            <p className="text-sm text-muted">{formatLocation(property)}</p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {priceText !== "—" ? (
                <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
                  {priceText}
                </span>
              ) : null}
              {offerText !== "—" ? (
                <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-navy">
                  {offerText}
                </span>
              ) : null}
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {statusText}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:pl-12">
          <Link href={`/properties/${property.id}/edit`}>
            <Button type="button" variant="secondary">
              {t("edit")}
            </Button>
          </Link>
          <Button
            type="button"
            variant="danger"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
          >
            {t("delete")}
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} />

      {media.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_7.5rem]">
            <div className="relative bg-slate-100">
              {active?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.url}
                  alt={active.file_name ?? ""}
                  className="aspect-[16/10] w-full object-cover lg:aspect-[16/9]"
                />
              ) : (
                <MediaPlaceholder label={active?.media_type ?? "Media"} />
              )}
              {media.length > 1 ? (
                <span className="absolute bottom-3 right-3 rounded-full bg-navy/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  {activeIndex + 1} / {media.length}
                </span>
              ) : null}
            </div>

            {media.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto border-t border-border/70 p-2 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:border-t-0 lg:border-l lg:border-border/70 lg:max-h-[28rem]">
                {media.map((item, index) => {
                  const selected = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Photo ${index + 1}`}
                      aria-pressed={selected}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition lg:h-20 lg:w-full ${
                        selected
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-card"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {item.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={item.file_name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <MediaPlaceholder label={item.media_type} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50 text-sm text-muted">
          —
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <DetailSection title={t("sectionPricing")}>
          <DetailRow label={t("labelPrice")} value={priceText} />
          <DetailRow label={t("labelOffer")} value={offerText} />
          <DetailRow label={t("labelStatus")} value={statusText} />
          <DetailRow label={t("labelDealType")} value={property.deal_type} />
        </DetailSection>

        <DetailSection title={t("sectionLocation")}>
          <DetailRow label={t("labelCity")} value={property.city} />
          <DetailRow label={t("labelArea")} value={formatLocation(property)} />
          <DetailRow label={t("labelAddress")} value={property.address} />
          <DetailRow label={t("labelCode")} value={property.property_code} />
        </DetailSection>

        <DetailSection title={t("sectionBuilding")}>
          <DetailRow label={t("labelType")} value={property.property_type} />
          <DetailRow
            label={t("labelStructure")}
            value={property.structure_type}
          />
          <DetailRow label={t("labelLand")} value={landValue} />
          <DetailRow label={t("labelFloors")} value={property.floors} />
          <DetailRow label={t("labelBedrooms")} value={property.bedrooms} />
          <DetailRow
            label={t("labelMasterBeds")}
            value={property.master_bedrooms}
          />
          <DetailRow label={t("labelBathrooms")} value={property.bathrooms} />
          <DetailRow label={t("labelDirection")} value={property.direction} />
          <DetailRow label={t("labelAircon")} value={property.aircon_count} />
          <DetailRow label={t("labelSolar")} value={solarValue} />
          <DetailRow
            label={t("labelBattery")}
            value={property.battery_capacity}
          />
          <DetailRow
            label={t("labelAmenities")}
            value={(property.amenities ?? []).join(", ") || null}
          />
        </DetailSection>

        <DetailSection title={t("sectionContact")}>
          <DetailRow
            label={t("labelPhone")}
            value={phones.length > 0 ? phones.join(", ") : null}
          />
        </DetailSection>
      </div>

      {property.original_text ? (
        <section className="rounded-2xl border border-border/80 bg-card px-5 py-4 shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {t("originalAd")}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-navy-soft">
            {property.original_text}
          </p>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        danger
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
