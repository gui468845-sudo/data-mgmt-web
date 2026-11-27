"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, TextInput, Button } from "@/components/ui";
import { PropertyCard } from "@/components/properties/property-card";
import { useLocale } from "@/lib/i18n";
import type { Property } from "@/lib/types";

const PAGE_SIZE = 12;

export function PropertyList({
  properties,
  coverUrls,
}: {
  properties: Property[];
  coverUrls: Record<string, string>;
}) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("available");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((property) => {
      if (status && property.status !== status) return false;
      if (!q) return true;
      const haystack = [
        property.title,
        property.property_code,
        property.township,
        property.ward,
        property.address,
        property.original_text,
        property.price_lakhs?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [properties, search, status]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, status]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("propertiesTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("propertiesSubtitle")}</p>
        </div>
        <Link href="/properties/new">
          <Button type="button">{t("addProperty")}</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <TextInput
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-48"
        >
          <option value="available">{t("statusAvailable")}</option>
          <option value="sold">{t("statusSold")}</option>
          <option value="rented">{t("statusRented")}</option>
          <option value="archived">{t("statusArchived")}</option>
          <option value="">{t("statusAll")}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t("noProperties")}
          description={
            properties.length === 0
              ? t("noPropertiesEmpty")
              : t("noPropertiesFilter")
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            {t("showing", { shown: visible.length, total: filtered.length })}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                coverUrl={coverUrls[property.id]}
              />
            ))}
          </div>
          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                {t("loadMore")}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
