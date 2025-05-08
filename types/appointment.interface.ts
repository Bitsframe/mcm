
interface Location {
  id: number;
  title: string;
  address: string;
}

interface Appointment {
  id: number;
  email_address: string;
  date_and_time: string;
  address: string;
  location_id: number;
  first_name: string;
  dob: string;
  last_name: string;
  service: string;
  sex: string;
  phone: string;
  created_at: string;
  location?: LocationInterface;
  in_office_patient: boolean;
  new_patient: boolean;
}

interface LocationInterface {
  id: number;
  created_at: string;
  phone: string;
  direction: string;
  email: string;
  address: string;
  mon_timing: string;
  tuesday_timing: string;
  wednesday_timing: string;
  thursday_timing: string;
  friday_timing: string;
  saturday_timing: string;
  sunday_timing: string;
  title: string;
  Group: string;
}

interface RenderDetailFields {
  label: string;
  key: string;
  type?: string;
  date_format?: boolean;
  can_sort?: boolean;
}


interface AppointmentResponse {
  id: number;
  email_Address: string | null;
  date_and_time: string | null;
  address: string | null;
  location_id: number;
  first_name: string | null;
  dob: string | null;
  last_name: string | null;
  service: string | null;
  sex: string | null;
  phone: string | null;
  created_at: string;
  in_office_patient: boolean;
  new_patient: boolean;
  isApproved: boolean;
}
