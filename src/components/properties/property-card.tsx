"use client";

import Link from "next/link";
import {
  formatLocation,
  formatPriceLakhs,
  offerLabel,
  propertyDisplayTitle,
  statusLabel,
} from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import type { Property } from "@/lib/types";

export function PropertyCard({
  property,
  coverUrl,
}: {
  property: Property;
  coverUrl?: string | null;
}) {
  const { t } = useLocale();
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

  return (
    <Link
      href={`/properties/${property.id}`}
      className="block overflow-hidden rounded-xl border border-border bg-card transition hover:border-accent/40 hover:shadow-sm"
    >
      <div className="aspect-[16/10] bg-slate-100">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            —
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-base font-semibold text-navy">
            {propertyDisplayTitle(property, labels)}
          </h2>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-navy-soft">
            {statusLabel(property.status, labels)}
          </span>
        </div>
        <p className="text-sm text-muted">{formatLocation(property)}</p>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-navy">
            {formatPriceLakhs(property.price_lakhs, property.price_type, labels)}
          </span>
          <span className="text-muted">
            {offerLabel(property.offer_type, labels)}
          </span>
        </div>
      </div>
    </Link>
  );
}
