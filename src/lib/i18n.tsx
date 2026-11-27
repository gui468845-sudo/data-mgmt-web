"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "my";

const STORAGE_KEY = "data-mgmt-locale";

const messages = {
  en: {
    brand: "Data Mgmt",
    navProperties: "Properties",
    navAddNew: "Add new",
    signOut: "Sign out",
    signOutTitle: "Sign out?",
    signOutMessage: "You will need to sign in again to manage properties.",
    cancel: "Cancel",
    confirm: "Confirm",
    pleaseWait: "Please wait…",
    propertiesTitle: "Properties",
    propertiesSubtitle: "Same listings as the phone app for your account.",
    addProperty: "Add property",
    searchPlaceholder: "Search title, code, township, ward…",
    statusAvailable: "Available",
    statusSold: "Sold",
    statusRented: "Rented",
    statusArchived: "Archived",
    statusAll: "All statuses",
    noProperties: "No properties found",
    noPropertiesEmpty: "Add your first property to get started.",
    noPropertiesFilter: "Try a different search or status filter.",
    showing: "Showing {shown} of {total}",
    loadMore: "Load more",
    edit: "Edit",
    delete: "Delete",
    deleteTitle: "Delete property?",
    deleteMessage: "This will permanently delete the property and its media.",
    back: "Back",
    backToProperties: "Back to properties",
    sectionPricing: "Pricing",
    sectionLocation: "Location",
    sectionBuilding: "Building",
    sectionContact: "Contact",
    originalAd: "Original ad text",
    labelPrice: "Price",
    labelOffer: "Offer",
    labelStatus: "Status",
    labelDealType: "Deal type",
    labelCity: "City",
    labelArea: "Area",
    labelAddress: "Address",
    labelCode: "Code",
    labelType: "Type",
    labelStructure: "Structure",
    labelLand: "Land",
    labelFloors: "Floors",
    labelBedrooms: "Bedrooms",
    labelMasterBeds: "Master beds",
    labelBathrooms: "Bathrooms",
    labelDirection: "Direction",
    labelAircon: "Aircon",
    labelSolar: "Solar",
    labelBattery: "Battery",
    labelAmenities: "Amenities",
    labelPhone: "Phone",
    offerSale: "Sale",
    offerRent: "Rent",
    newProperty: "New property",
    editProperty: "Edit property",
    formSubtitle: "Saves to the same Supabase tables as the phone app.",
    save: "Save",
    saving: "Saving…",
    untitled: "Untitled property",
    negotiable: "negotiable",
    exact: "exact",
    lakhs: "lakhs",
    yes: "Yes",
    no: "No",
    language: "Language",
    fieldTitle: "Title",
    fieldPropertyCode: "Property code",
    fieldPhone: "Phone",
    fieldPriceLakhs: "Price (lakhs)",
    fieldPriceType: "Price type",
    fieldOfferType: "Sale / Rent",
    fieldPropertyType: "Property type",
    fieldStructureType: "Structure type",
    fieldCity: "City",
    fieldTownship: "Township",
    fieldWard: "Ward",
    fieldAddress: "Address",
    fieldLandWidth: "Land width (ft)",
    fieldLandLength: "Land length (ft)",
    fieldFloors: "Floors",
    fieldBedrooms: "Bedrooms",
    fieldMasterBedrooms: "Master bedrooms",
    fieldBathrooms: "Bathrooms",
    fieldDirection: "Direction",
    fieldAirconCount: "Aircon count",
    fieldHasSolar: "Has solar",
    fieldSolarPanels: "Solar panels",
    fieldBatteryCapacity: "Battery capacity",
    fieldAmenities: "Amenities (comma separated)",
    fieldStatus: "Status",
    fieldDealType: "Deal type",
    fieldOriginalText: "Original ad text",
    fieldPhotos: "Photos",
    filesSelected: "{count} file(s) selected",
    optionNegotiable: "Negotiable",
    optionExact: "Exact",
    optionDirect: "Direct",
    optionAgent: "Agent",
    optionOther: "Other",
  },
  my: {
    brand: "ဒေတာ စီမံ",
    navProperties: "အိမ်ခြံမြေများ",
    navAddNew: "အသစ်ထည့်ရန်",
    signOut: "ထွက်ရန်",
    signOutTitle: "ထွက်မလား?",
    signOutMessage: "အိမ်ခြံမြေများ စီမံရန် ထပ်မံ ဝင်ရောက်ရပါမည်။",
    cancel: "ပယ်ဖျက်",
    confirm: "အတည်ပြု",
    pleaseWait: "ခဏစောင့်ပါ…",
    propertiesTitle: "အိမ်ခြံမြေများ",
    propertiesSubtitle: "ဖုန်းအက်ပ်နှင့် တူညီသော သင့်စာရင်းများ။",
    addProperty: "အိမ်ခြံမြေ ထည့်ရန်",
    searchPlaceholder: "ခေါင်းစဉ်၊ ကုဒ်၊ မြို့နယ်၊ ရပ်ကွက် ရှာရန်…",
    statusAvailable: "ရရှိနိုင်",
    statusSold: "ရောင်းပြီး",
    statusRented: "ငှားပြီး",
    statusArchived: "သိမ်းဆည်းထား",
    statusAll: "အခြေအနေအားလုံး",
    noProperties: "အိမ်ခြံမြေ မတွေ့ပါ",
    noPropertiesEmpty: "စတင်ရန် ပထမဆုံး အိမ်ခြံမြေ ထည့်ပါ။",
    noPropertiesFilter: "ရှာဖွေမှု သို့မဟုတ် အခြေအနေ ပြောင်းကြည့်ပါ။",
    showing: "{total} မှ {shown} ပြသနေသည်",
    loadMore: "ထပ်ကြည့်ရန်",
    edit: "ပြင်ရန်",
    delete: "ဖျက်ရန်",
    deleteTitle: "အိမ်ခြံမြေ ဖျက်မလား?",
    deleteMessage: "အိမ်ခြံမြေနှင့် မီဒီယာများကို အပြီးဖျက်ပါမည်။",
    back: "နောက်သို့",
    backToProperties: "အိမ်ခြံမြေများသို့ ပြန်ရန်",
    sectionPricing: "ဈေးနှုန်း",
    sectionLocation: "တည်နေရာ",
    sectionBuilding: "အဆောက်အအုံ",
    sectionContact: "ဆက်သွယ်ရန်",
    originalAd: "မူရင်းကြော်ငြာစာသား",
    labelPrice: "ဈေး",
    labelOffer: "အမျိုးအစား",
    labelStatus: "အခြေအနေ",
    labelDealType: "အရောင်းအမျိုးအစား",
    labelCity: "မြို့",
    labelArea: "ဧရိယာ",
    labelAddress: "လိပ်စာ",
    labelCode: "ကုဒ်",
    labelType: "အမျိုးအစား",
    labelStructure: "ဖွဲ့စည်းပုံ",
    labelLand: "မြေ",
    labelFloors: "ထပ်",
    labelBedrooms: "အိပ်ခန်း",
    labelMasterBeds: "မာစတာအိပ်ခန်း",
    labelBathrooms: "ရေချိုးခန်း",
    labelDirection: "ဦးတည်ချက်",
    labelAircon: "အဲယားကွန်း",
    labelSolar: "ဆိုလာ",
    labelBattery: "ဘက်ထရီ",
    labelAmenities: "အဆောက်အဦးပစ္စည်း",
    labelPhone: "ဖုန်း",
    offerSale: "ရောင်း",
    offerRent: "ငှား",
    newProperty: "အိမ်ခြံမြေ အသစ်",
    editProperty: "အိမ်ခြံမြေ ပြင်ရန်",
    formSubtitle: "ဖုန်းအက်ပ်နှင့် တူညီသော Supabase ဇယားများသို့ သိမ်းသည်။",
    save: "သိမ်းရန်",
    saving: "သိမ်းနေသည်…",
    untitled: "ခေါင်းစဉ်မဲ့ အိမ်ခြံမြေ",
    negotiable: "ညှိနှိုင်းနိုင်",
    exact: "တိကျ",
    lakhs: "သိန်း",
    yes: "ရှိ",
    no: "မရှိ",
    language: "ဘာသာစကား",
    fieldTitle: "ခေါင်းစဉ်",
    fieldPropertyCode: "အိမ်ခြံမြေ ကုဒ်",
    fieldPhone: "ဖုန်း",
    fieldPriceLakhs: "ဈေး (သိန်း)",
    fieldPriceType: "ဈေးအမျိုးအစား",
    fieldOfferType: "ရောင်း / ငှား",
    fieldPropertyType: "အိမ်ခြံမြေ အမျိုးအစား",
    fieldStructureType: "ဖွဲ့စည်းပုံ အမျိုးအစား",
    fieldCity: "မြို့",
    fieldTownship: "မြို့နယ်",
    fieldWard: "ရပ်ကွက်",
    fieldAddress: "လိပ်စာ",
    fieldLandWidth: "မြေ အကျယ် (ပေ)",
    fieldLandLength: "မြေ အရှည် (ပေ)",
    fieldFloors: "ထပ်အရေအတွက်",
    fieldBedrooms: "အိပ်ခန်း",
    fieldMasterBedrooms: "မာစတာအိပ်ခန်း",
    fieldBathrooms: "ရေချိုးခန်း",
    fieldDirection: "ဦးတည်ချက်",
    fieldAirconCount: "အဲယားကွန်း အရေအတွက်",
    fieldHasSolar: "ဆိုလာ ရှိသည်",
    fieldSolarPanels: "ဆိုလာပြား",
    fieldBatteryCapacity: "ဘက်ထရီ စွမ်းရည်",
    fieldAmenities: "အဆောက်အဦးပစ္စည်းများ (ကော်မာခြား)",
    fieldStatus: "အခြေအနေ",
    fieldDealType: "အရောင်းအမျိုးအစား",
    fieldOriginalText: "မူရင်းကြော်ငြာစာသား",
    fieldPhotos: "ဓာတ်ပုံများ",
    filesSelected: "ဖိုင် {count} ခု ရွေးထားသည်",
    optionNegotiable: "ညှိနှိုင်းနိုင်",
    optionExact: "တိကျ",
    optionDirect: "တိုက်ရိုက်",
    optionAgent: "ပွဲစား",
    optionOther: "အခြား",
  },
} as const;

export type MessageKey = keyof typeof messages.en;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "my";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "my" ? stored : "my";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("my");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      let text: string = messages[locale][key] ?? messages.en[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
