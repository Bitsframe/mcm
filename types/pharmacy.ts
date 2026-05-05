export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  city?: string;
  state: string;
  zip_code: string;
  phone_number: string | null;
  spanish_language_service?: boolean;
  disabled_access?: boolean;
  license_status?: string;
  opening_hours: any | null; // json type in DB
  delivers: boolean;
  delivered_to_status_updated: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreatePharmacyData {
  name: string;
  address: string;
  city?: string;
  state: string;
  zip_code: string;
  phone_number?: string;
  spanish_language_service?: boolean;
  disabled_access?: boolean;
  license_status?: string;
  opening_hours?: any;
  delivers?: boolean;
  is_active?: boolean;
}
