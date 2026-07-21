type RawPatientRow = Record<string, unknown>;
type RawAppointmentRow = Record<string, unknown>;

export type ComingBackPatient = {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  phone: string;
  sex: string;
  dob: string;
  date_and_time: string;
};

export function normalizePhone(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

export function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\.\@/g, "@");
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function parseDobText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, month, day, year] = dashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return "";
}

function pickDob(...values: unknown[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const parsed = parseDobText(String(value));
    if (parsed) return parsed;
  }
  return "";
}

/** Merge allpatients + optional appointment + duplicate patient row (two storage shapes). */
export function normalizeComingBackPatient(
  patient: RawPatientRow,
  appointment?: RawAppointmentRow | null,
  duplicatePatient?: RawPatientRow | null
): ComingBackPatient {
  const id = Number(patient.id ?? patient.patient_id ?? patient.patientid);
  return {
    id,
    first_name: pickString(
      patient.firstname,
      patient.first_name,
      patient.firstName,
      appointment?.first_name,
      duplicatePatient?.firstname,
      duplicatePatient?.first_name
    ),
    last_name: pickString(
      patient.lastname,
      patient.last_name,
      patient.lastName,
      appointment?.last_name,
      duplicatePatient?.lastname,
      duplicatePatient?.last_name
    ),
    email_address: pickString(
      patient.email,
      patient.email_address,
      patient.emailAddress,
      appointment?.email_address,
      duplicatePatient?.email
    ),
    phone: pickString(
      patient.phone,
      patient.mobile,
      patient.phone_number,
      appointment?.phone,
      duplicatePatient?.phone
    ),
    sex: pickString(
      patient.sex,
      patient.gender,
      appointment?.sex,
      duplicatePatient?.gender,
      duplicatePatient?.sex
    ),
    dob: pickDob(
      patient.dob,
      patient.dateOfBirth,
      patient.date_of_birth,
      appointment?.dob,
      duplicatePatient?.dob,
      duplicatePatient?.dateOfBirth,
      duplicatePatient?.date_of_birth
    ),
    date_and_time: pickString(appointment?.date_and_time),
  };
}

export function indexLatestAppointmentsByPatientId(
  rows: RawAppointmentRow[] | null | undefined
): Map<number, RawAppointmentRow> {
  const map = new Map<number, RawAppointmentRow>();
  for (const row of rows || []) {
    const patientId = Number(row.patient_id);
    if (!Number.isFinite(patientId) || patientId <= 0) continue;
    if (!map.has(patientId)) map.set(patientId, row);
  }
  return map;
}

function indexLatestByKey<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  getKey: (row: T) => string
): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows || []) {
    const key = getKey(row);
    if (!key || map.has(key)) continue;
    map.set(key, row);
  }
  return map;
}

export function indexLatestAppointmentsByPhone(
  rows: RawAppointmentRow[] | null | undefined
): Map<string, RawAppointmentRow> {
  return indexLatestByKey(rows, (row) => normalizePhone(row.phone));
}

export function indexLatestAppointmentsByEmail(
  rows: RawAppointmentRow[] | null | undefined
): Map<string, RawAppointmentRow> {
  return indexLatestByKey(rows, (row) => normalizeEmail(row.email_address));
}

export function indexPatientsByPhone(
  rows: RawPatientRow[] | null | undefined
): Map<string, RawPatientRow> {
  return indexLatestByKey(rows, (row) => normalizePhone(row.phone));
}

export function indexPatientsByEmail(
  rows: RawPatientRow[] | null | undefined
): Map<string, RawPatientRow> {
  return indexLatestByKey(rows, (row) => normalizeEmail(row.email));
}

export function resolveAppointmentFallback(
  patient: RawPatientRow,
  maps: {
    byPatientId: Map<number, RawAppointmentRow>;
    byPhone: Map<string, RawAppointmentRow>;
    byEmail: Map<string, RawAppointmentRow>;
  }
): RawAppointmentRow | null {
  const patientId = Number(patient.id);
  if (Number.isFinite(patientId) && maps.byPatientId.has(patientId)) {
    return maps.byPatientId.get(patientId) ?? null;
  }

  const phoneKey = normalizePhone(patient.phone);
  if (phoneKey.length >= 10 && maps.byPhone.has(phoneKey)) {
    return maps.byPhone.get(phoneKey) ?? null;
  }

  const emailKey = normalizeEmail(patient.email);
  if (emailKey && maps.byEmail.has(emailKey)) {
    return maps.byEmail.get(emailKey) ?? null;
  }

  return null;
}

export function resolveDuplicatePatientWithDob(
  patient: RawPatientRow,
  maps: {
    byPhone: Map<string, RawPatientRow>;
    byEmail: Map<string, RawPatientRow>;
  }
): RawPatientRow | null {
  const patientId = Number(patient.id);

  const phoneKey = normalizePhone(patient.phone);
  if (phoneKey.length >= 10 && maps.byPhone.has(phoneKey)) {
    const match = maps.byPhone.get(phoneKey)!;
    if (Number(match.id) !== patientId) return match;
  }

  const emailKey = normalizeEmail(patient.email);
  if (emailKey && maps.byEmail.has(emailKey)) {
    const match = maps.byEmail.get(emailKey)!;
    if (Number(match.id) !== patientId) return match;
  }

  return null;
}
