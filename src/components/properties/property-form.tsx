"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  parseOptionalInt,
  parseOptionalNumber,
  splitCsv,
  splitPhones,
} from "@/lib/format";
import type {
  MandalayTownship,
  MandalayWard,
  Property,
  PropertyDraft,
} from "@/lib/types";
import {
  BackButton,
  Button,
  ErrorBanner,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/ui";
import { useLocale } from "@/lib/i18n";

type FormState = {
  title: string;
  property_code: string;
  phone: string;
  price_lakhs: string;
  price_type: string;
  offer_type: string;
  property_type: string;
  structure_type: string;
  city: string;
  township_id: string;
  ward_id: string;
  address: string;
  land_width: string;
  land_length: string;
  floors: string;
  bedrooms: string;
  master_bedrooms: string;
  bathrooms: string;
  direction: string;
  aircon_count: string;
  has_solar: boolean;
  solar_panels: string;
  battery_capacity: string;
  amenities: string;
  status: string;
  deal_type: string;
  original_text: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    property_code: "",
    phone: "",
    price_lakhs: "",
    price_type: "negotiable",
    offer_type: "",
    property_type: "",
    structure_type: "",
    city: "Mandalay",
    township_id: "",
    ward_id: "",
    address: "",
    land_width: "",
    land_length: "",
    floors: "",
    bedrooms: "",
    master_bedrooms: "",
    bathrooms: "",
    direction: "",
    aircon_count: "",
    has_solar: false,
    solar_panels: "",
    battery_capacity: "",
    amenities: "",
    status: "available",
    deal_type: "",
    original_text: "",
  };
}

function fromProperty(property: Property, phone: string): FormState {
  return {
    title: property.title ?? "",
    property_code: property.property_code ?? "",
    phone,
    price_lakhs: property.price_lakhs?.toString() ?? "",
    price_type: property.price_type ?? "negotiable",
    offer_type: property.offer_type ?? "",
    property_type: property.property_type ?? "",
    structure_type: property.structure_type ?? "",
    city: property.city ?? "Mandalay",
    township_id: property.township_id?.toString() ?? "",
    ward_id: property.ward_id?.toString() ?? "",
    address: property.address ?? "",
    land_width: property.land_width?.toString() ?? "",
    land_length: property.land_length?.toString() ?? "",
    floors: property.floors?.toString() ?? "",
    bedrooms: property.bedrooms?.toString() ?? "",
    master_bedrooms: property.master_bedrooms?.toString() ?? "",
    bathrooms: property.bathrooms?.toString() ?? "",
    direction: property.direction ?? "",
    aircon_count: property.aircon_count?.toString() ?? "",
    has_solar: property.has_solar ?? false,
    solar_panels: property.solar_panels?.toString() ?? "",
    battery_capacity: property.battery_capacity ?? "",
    amenities: (property.amenities ?? []).join(", "),
    status: property.status || "available",
    deal_type: property.deal_type ?? "",
    original_text: property.original_text ?? "",
  };
}

async function setPropertyPhone(
  propertyId: string,
  userId: string,
  phone: string,
) {
  const supabase = createClient();
  const cleaned = splitPhones(phone);

  const { data: existing, error: existingError } = await supabase
    .from("property_contacts")
    .select("id, contact_id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .eq("role", "owner");

  if (existingError) throw new Error(existingError.message);

  if (cleaned.length === 0) {
    for (const row of existing ?? []) {
      await supabase.from("property_contacts").delete().eq("id", row.id);
      await supabase
        .from("contacts")
        .delete()
        .eq("id", row.contact_id)
        .eq("user_id", userId);
    }
    return;
  }

  if (existing && existing.length > 0) {
    const first = existing[0];
    const { error } = await supabase
      .from("contacts")
      .update({ phones: cleaned, name: cleaned[0] })
      .eq("id", first.contact_id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    for (const row of existing.slice(1)) {
      await supabase.from("property_contacts").delete().eq("id", row.id);
      await supabase
        .from("contacts")
        .delete()
        .eq("id", row.contact_id)
        .eq("user_id", userId);
    }
    return;
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      name: cleaned[0],
      contact_type: "owner",
      phones: cleaned,
    })
    .select("id")
    .single();
  if (contactError) throw new Error(contactError.message);

  const { error: linkError } = await supabase.from("property_contacts").insert({
    user_id: userId,
    property_id: propertyId,
    contact_id: contact.id,
    role: "owner",
  });
  if (linkError) throw new Error(linkError.message);
}

async function uploadImages(propertyId: string, userId: string, files: File[]) {
  if (files.length === 0) return;
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("property_media")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`Image ${file.name} exceeds 10 MB limit`);
    }

    const ext = file.name.includes(".")
      ? `.${file.name.split(".").pop()}`
      : ".jpg";
    const path = `${userId}/${propertyId}/images/${crypto.randomUUID()}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("property-media")
      .upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) throw new Error(uploadError.message);

    const { error: insertError } = await supabase.from("property_media").insert({
      user_id: userId,
      property_id: propertyId,
      storage_path: path,
      media_type: "image",
      sort_order: sortOrder,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || "image/jpeg",
    });
    if (insertError) throw new Error(insertError.message);
    sortOrder += 1;
  }
}

export function PropertyForm({
  mode,
  propertyId,
  initialProperty,
  initialPhone = "",
  townships,
}: {
  mode: "create" | "edit";
  propertyId?: string;
  initialProperty?: Property | null;
  initialPhone?: string;
  townships: MandalayTownship[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(
    initialProperty
      ? fromProperty(initialProperty, initialPhone)
      : emptyForm(),
  );
  const [wards, setWards] = useState<MandalayWard[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const townshipId = form.township_id
    ? Number.parseInt(form.township_id, 10)
    : null;

  useEffect(() => {
    let cancelled = false;
    async function loadWards() {
      if (townshipId == null || Number.isNaN(townshipId)) {
        setWards([]);
        return;
      }
      const supabase = createClient();
      const { data, error: wardsError } = await supabase
        .from("mandalay_wards")
        .select("id, township_id, name_mm")
        .eq("township_id", townshipId)
        .order("name_mm");
      if (cancelled) return;
      if (wardsError) {
        setError(wardsError.message);
        return;
      }
      setWards((data ?? []) as MandalayWard[]);
    }
    void loadWards();
    return () => {
      cancelled = true;
    };
  }, [townshipId]);

  const townshipName = useMemo(
    () =>
      townships.find((t) => t.id === townshipId)?.name_mm ?? null,
    [townships, townshipId],
  );

  const wardId = form.ward_id ? Number.parseInt(form.ward_id, 10) : null;
  const wardName = useMemo(
    () => wards.find((w) => w.id === wardId)?.name_mm ?? null,
    [wards, wardId],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildDraft(): PropertyDraft {
    const price = parseOptionalNumber(form.price_lakhs);
    return {
      property_code: form.property_code.trim() || null,
      title: form.title.trim() || null,
      property_type: form.property_type.trim() || null,
      structure_type: form.structure_type.trim() || null,
      price_lakhs: price,
      price_type: price == null ? null : form.price_type || "negotiable",
      city: form.city.trim() || null,
      township: townshipName,
      ward: wardName,
      township_id: townshipId,
      ward_id: wardId != null && !Number.isNaN(wardId) ? wardId : null,
      offer_type: form.offer_type || null,
      address: form.address.trim() || null,
      land_width: parseOptionalNumber(form.land_width),
      land_length: parseOptionalNumber(form.land_length),
      land_unit: "ft",
      floors: parseOptionalInt(form.floors),
      bedrooms: parseOptionalInt(form.bedrooms),
      master_bedrooms: parseOptionalInt(form.master_bedrooms),
      bathrooms: parseOptionalInt(form.bathrooms),
      direction: form.direction.trim() || null,
      aircon_count: parseOptionalInt(form.aircon_count),
      has_solar: form.has_solar,
      solar_panels: form.has_solar
        ? parseOptionalInt(form.solar_panels)
        : null,
      battery_capacity: form.battery_capacity.trim() || null,
      amenities: splitCsv(form.amenities),
      deal_type: form.deal_type || null,
      status: form.status || "available",
      original_text: form.original_text.trim() || null,
    };
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const draft = buildDraft();

      if (mode === "edit") {
        if (!propertyId) throw new Error("Missing property id");
        const { error: updateError } = await supabase
          .from("properties")
          .update(draft)
          .eq("id", propertyId)
          .eq("user_id", user.id);
        if (updateError) throw new Error(updateError.message);

        await setPropertyPhone(propertyId, user.id, form.phone);
        await uploadImages(propertyId, user.id, files);
        // Navigate only — destination RSC fetch is already fresh (dynamic).
        router.push(`/properties/${propertyId}`);
        return;
      }

      const { data: created, error: insertError } = await supabase
        .from("properties")
        .insert({ ...draft, user_id: user.id })
        .select()
        .single();
      if (insertError) throw new Error(insertError.message);

      await setPropertyPhone(created.id, user.id, form.phone);
      await uploadImages(created.id, user.id, files);
      router.push(`/properties/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <BackButton
            href={
              mode === "edit" && propertyId
                ? `/properties/${propertyId}`
                : "/properties"
            }
            label={t("back")}
          />
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {mode === "edit" ? t("editProperty") : t("newProperty")}
            </h1>
            <p className="mt-1 text-sm text-muted">{t("formSubtitle")}</p>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? t("saving") : t("save")}
        </Button>
      </div>

      <ErrorBanner message={error} />

      <section className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="title">{t("fieldTitle")}</FieldLabel>
          <TextInput
            id="title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="property_code">{t("fieldPropertyCode")}</FieldLabel>
          <TextInput
            id="property_code"
            value={form.property_code}
            onChange={(e) => update("property_code", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="phone">{t("fieldPhone")}</FieldLabel>
          <TextInput
            id="phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="09..."
          />
        </div>
        <div>
          <FieldLabel htmlFor="price_lakhs">{t("fieldPriceLakhs")}</FieldLabel>
          <TextInput
            id="price_lakhs"
            inputMode="decimal"
            value={form.price_lakhs}
            onChange={(e) => update("price_lakhs", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="price_type">{t("fieldPriceType")}</FieldLabel>
          <SelectInput
            id="price_type"
            value={form.price_type}
            onChange={(e) => update("price_type", e.target.value)}
          >
            <option value="negotiable">{t("optionNegotiable")}</option>
            <option value="exact">{t("optionExact")}</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="offer_type">{t("fieldOfferType")}</FieldLabel>
          <SelectInput
            id="offer_type"
            value={form.offer_type}
            onChange={(e) => update("offer_type", e.target.value)}
          >
            <option value="">—</option>
            <option value="sale">{t("offerSale")}</option>
            <option value="rent">{t("offerRent")}</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="property_type">{t("fieldPropertyType")}</FieldLabel>
          <TextInput
            id="property_type"
            value={form.property_type}
            onChange={(e) => update("property_type", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="structure_type">{t("fieldStructureType")}</FieldLabel>
          <TextInput
            id="structure_type"
            value={form.structure_type}
            onChange={(e) => update("structure_type", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="city">{t("fieldCity")}</FieldLabel>
          <TextInput
            id="city"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="township_id">{t("fieldTownship")}</FieldLabel>
          <SelectInput
            id="township_id"
            value={form.township_id}
            onChange={(e) => {
              update("township_id", e.target.value);
              update("ward_id", "");
            }}
          >
            <option value="">—</option>
            {townships.map((township) => (
              <option key={township.id} value={township.id}>
                {township.name_mm}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="ward_id">{t("fieldWard")}</FieldLabel>
          <SelectInput
            id="ward_id"
            value={form.ward_id}
            onChange={(e) => update("ward_id", e.target.value)}
            disabled={!form.township_id}
          >
            <option value="">—</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name_mm}
              </option>
            ))}
          </SelectInput>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="address">{t("fieldAddress")}</FieldLabel>
          <TextArea
            id="address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="land_width">{t("fieldLandWidth")}</FieldLabel>
          <TextInput
            id="land_width"
            inputMode="decimal"
            value={form.land_width}
            onChange={(e) => update("land_width", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="land_length">{t("fieldLandLength")}</FieldLabel>
          <TextInput
            id="land_length"
            inputMode="decimal"
            value={form.land_length}
            onChange={(e) => update("land_length", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="floors">{t("fieldFloors")}</FieldLabel>
          <TextInput
            id="floors"
            inputMode="numeric"
            value={form.floors}
            onChange={(e) => update("floors", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="bedrooms">{t("fieldBedrooms")}</FieldLabel>
          <TextInput
            id="bedrooms"
            inputMode="numeric"
            value={form.bedrooms}
            onChange={(e) => update("bedrooms", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="master_bedrooms">{t("fieldMasterBedrooms")}</FieldLabel>
          <TextInput
            id="master_bedrooms"
            inputMode="numeric"
            value={form.master_bedrooms}
            onChange={(e) => update("master_bedrooms", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="bathrooms">{t("fieldBathrooms")}</FieldLabel>
          <TextInput
            id="bathrooms"
            inputMode="numeric"
            value={form.bathrooms}
            onChange={(e) => update("bathrooms", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="direction">{t("fieldDirection")}</FieldLabel>
          <TextInput
            id="direction"
            value={form.direction}
            onChange={(e) => update("direction", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="aircon_count">{t("fieldAirconCount")}</FieldLabel>
          <TextInput
            id="aircon_count"
            inputMode="numeric"
            value={form.aircon_count}
            onChange={(e) => update("aircon_count", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 pt-7">
          <input
            id="has_solar"
            type="checkbox"
            checked={form.has_solar}
            onChange={(e) => update("has_solar", e.target.checked)}
            className="size-4 accent-accent"
          />
          <label htmlFor="has_solar" className="text-sm font-medium text-navy">
            {t("fieldHasSolar")}
          </label>
        </div>
        {form.has_solar ? (
          <div>
            <FieldLabel htmlFor="solar_panels">{t("fieldSolarPanels")}</FieldLabel>
            <TextInput
              id="solar_panels"
              inputMode="numeric"
              value={form.solar_panels}
              onChange={(e) => update("solar_panels", e.target.value)}
            />
          </div>
        ) : null}
        <div>
          <FieldLabel htmlFor="battery_capacity">{t("fieldBatteryCapacity")}</FieldLabel>
          <TextInput
            id="battery_capacity"
            value={form.battery_capacity}
            onChange={(e) => update("battery_capacity", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="amenities">{t("fieldAmenities")}</FieldLabel>
          <TextInput
            id="amenities"
            value={form.amenities}
            onChange={(e) => update("amenities", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="status">{t("fieldStatus")}</FieldLabel>
          <SelectInput
            id="status"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="available">{t("statusAvailable")}</option>
            <option value="sold">{t("statusSold")}</option>
            <option value="rented">{t("statusRented")}</option>
            <option value="archived">{t("statusArchived")}</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="deal_type">{t("fieldDealType")}</FieldLabel>
          <SelectInput
            id="deal_type"
            value={form.deal_type}
            onChange={(e) => update("deal_type", e.target.value)}
          >
            <option value="">—</option>
            <option value="direct">{t("optionDirect")}</option>
            <option value="agent">{t("optionAgent")}</option>
            <option value="other">{t("optionOther")}</option>
          </SelectInput>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="original_text">{t("fieldOriginalText")}</FieldLabel>
          <TextArea
            id="original_text"
            value={form.original_text}
            onChange={(e) => update("original_text", e.target.value)}
            className="min-h-32"
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="photos">{t("fieldPhotos")}</FieldLabel>
          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-accent"
          />
          {files.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              {t("filesSelected", { count: files.length })}
            </p>
          ) : null}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
