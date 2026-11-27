export type Property = {
  id: string;
  user_id: string;
  source_message_id?: string | null;
  property_code?: string | null;
  title?: string | null;
  property_type?: string | null;
  structure_type?: string | null;
  price_lakhs?: number | null;
  price_type?: string | null;
  city?: string | null;
  township?: string | null;
  ward?: string | null;
  township_id?: number | null;
  ward_id?: number | null;
  offer_type?: string | null;
  address?: string | null;
  land_width?: number | null;
  land_length?: number | null;
  land_unit?: string | null;
  building_area?: number | null;
  floors?: number | null;
  bedrooms?: number | null;
  master_bedrooms?: number | null;
  bathrooms?: number | null;
  direction?: string | null;
  aircon_count?: number | null;
  has_solar?: boolean | null;
  solar_panels?: number | null;
  battery_capacity?: string | null;
  amenities?: string[] | null;
  deal_type?: string | null;
  status: string;
  original_text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PropertyDraft = {
  property_code?: string | null;
  title?: string | null;
  property_type?: string | null;
  structure_type?: string | null;
  price_lakhs?: number | null;
  price_type?: string | null;
  city?: string | null;
  township?: string | null;
  ward?: string | null;
  township_id?: number | null;
  ward_id?: number | null;
  offer_type?: string | null;
  address?: string | null;
  land_width?: number | null;
  land_length?: number | null;
  land_unit?: string;
  floors?: number | null;
  bedrooms?: number | null;
  master_bedrooms?: number | null;
  bathrooms?: number | null;
  direction?: string | null;
  aircon_count?: number | null;
  has_solar?: boolean | null;
  solar_panels?: number | null;
  battery_capacity?: string | null;
  amenities?: string[];
  deal_type?: string | null;
  status: string;
  original_text?: string | null;
};

export type PropertyMedia = {
  id: string;
  user_id: string;
  property_id: string;
  storage_path: string;
  media_type: string;
  sort_order: number;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  thumbnail_path?: string | null;
};

export type MandalayTownship = {
  id: number;
  name_mm: string;
  name_en?: string | null;
};

export type MandalayWard = {
  id: number;
  township_id: number;
  name_mm: string;
};
