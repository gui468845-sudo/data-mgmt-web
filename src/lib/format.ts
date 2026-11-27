import type { Property } from "./types";

export type FormatLabels = {
  untitled?: string;
  lakhs?: string;
  negotiable?: string;
  exact?: string;
  sale?: string;
  rent?: string;
  available?: string;
  sold?: string;
  rented?: string;
  archived?: string;
};

export function propertyDisplayTitle(
  property: Property,
  labels?: FormatLabels,
): string {
  const title = property.title?.trim();
  if (title) return title;
  const code = property.property_code?.trim();
  if (code) return code;
  return labels?.untitled ?? "Untitled property";
}

export function formatPriceLakhs(
  price: number | null | undefined,
  priceType?: string | null,
  labels?: FormatLabels,
): string {
  if (price == null || Number.isNaN(price)) return "—";
  // Latin digits avoid SSR/client hydration mismatch.
  const unit = labels?.lakhs ?? "lakhs";
  const base = `${price.toLocaleString("en-US")} ${unit}`;
  if (priceType === "negotiable") {
    return `${base} (${labels?.negotiable ?? "negotiable"})`;
  }
  if (priceType === "exact") {
    return `${base} (${labels?.exact ?? "exact"})`;
  }
  return base;
}

export function formatLocation(property: Property): string {
  return [property.township, property.ward].filter(Boolean).join(" / ") || "—";
}

export function offerLabel(
  offerType?: string | null,
  labels?: FormatLabels,
): string {
  if (offerType === "sale") return labels?.sale ?? "Sale";
  if (offerType === "rent") return labels?.rent ?? "Rent";
  return "—";
}

export function statusLabel(status: string, labels?: FormatLabels): string {
  switch (status) {
    case "available":
      return labels?.available ?? "Available";
    case "sold":
      return labels?.sold ?? "Sold";
    case "rented":
      return labels?.rented ?? "Rented";
    case "archived":
      return labels?.archived ?? "Archived";
    default:
      return status;
  }
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function parseOptionalInt(value: string): number | null {
  const n = parseOptionalNumber(value);
  if (n == null) return null;
  return Math.trunc(n);
}

export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function splitPhones(value: string): string[] {
  return value
    .split(/[,/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}
