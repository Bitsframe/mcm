export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  state: string;
  zipcode: string;
  phone: string | null;
  opening_hours: any | null; // json type in DB
  delivers: boolean;
  delivered_to_status_updated: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreatePharmacyData {
  name: string;
  address: string;
  state: string;
  zipcode: string;
  phone?: string;
  opening_hours?: any;
  delivers?: boolean;
  is_active?: boolean;
}
