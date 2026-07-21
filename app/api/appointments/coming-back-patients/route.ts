import {
  indexLatestAppointmentsByEmail,
  indexLatestAppointmentsByPatientId,
  indexLatestAppointmentsByPhone,
  indexPatientsByEmail,
  indexPatientsByPhone,
  normalizeComingBackPatient,
  resolveAppointmentFallback,
  resolveDuplicatePatientWithDob,
  type ComingBackPatient,
} from "@/components/Appointment/Add_Appointment_Modal/patientMapping";
import { getServiceRoleSupabase } from "@/utils/supabase/service-role-client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function fetchInChunks<T>(
  ids: number[],
  fetcher: (chunk: number[]) => Promise<T[]>
): Promise<T[]> {
  const results: T[] = [];
  const chunkSize = 500;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const rows = await fetcher(chunk);
    results.push(...rows);
  }
  return results;
}

async function fetchAllPaginated<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>
): Promise<T[]> {
  const all: T[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const page = await fetchPage(from, from + pageSize - 1);
    if (!page.length) break;
    all.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

export async function GET(request: NextRequest) {
  try {
    const locationId = Number(
      request.nextUrl.searchParams.get("locationId") ?? ""
    );
    if (!Number.isFinite(locationId) || locationId <= 0) {
      return NextResponse.json(
        { error: "locationId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleSupabase();

    const { data: patients, error: patientsError } = await supabase
      .from("allpatients")
      .select("id, firstname, lastname, email, phone, gender, dob")
      .eq("locationid", locationId)
      .is("deleted_at", null);

    if (patientsError) {
      return NextResponse.json(
        { error: patientsError.message },
        { status: 500 }
      );
    }

    const rows = patients ?? [];
    const patientIds = rows
      .map((p) => Number(p.id))
      .filter((id) => Number.isFinite(id) && id > 0);

    const appointmentByPatientId = new Map<number, Record<string, unknown>>();

    if (patientIds.length > 0) {
      const apptRows = await fetchInChunks(patientIds, async (chunk) => {
        const { data, error } = await supabase
          .from("Appoinments")
          .select(
            "patient_id, first_name, last_name, email_address, phone, sex, dob, date_and_time, created_at, location_id"
          )
          .in("patient_id", chunk)
          .not("dob", "is", null)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
      });

      indexLatestAppointmentsByPatientId(apptRows).forEach((value, key) => {
        appointmentByPatientId.set(key, value);
      });
    }

    const apptFallbackRows = await fetchAllPaginated(async (from, to) => {
      const { data, error } = await supabase
        .from("Appoinments")
        .select(
          "patient_id, first_name, last_name, email_address, phone, sex, dob, date_and_time, created_at, location_id"
        )
        .not("dob", "is", null)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw new Error(error.message);
      return data ?? [];
    });

    const appointmentByPhone = indexLatestAppointmentsByPhone(apptFallbackRows);
    const appointmentByEmail = indexLatestAppointmentsByEmail(apptFallbackRows);

    const dobPatients = await fetchAllPaginated(async (from, to) => {
      const { data, error } = await supabase
        .from("allpatients")
        .select("id, firstname, lastname, email, phone, gender, dob, locationid")
        .not("dob", "is", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw new Error(error.message);
      return data ?? [];
    });

    const patientDobByPhone = indexPatientsByPhone(dobPatients);
    const patientDobByEmail = indexPatientsByEmail(dobPatients);

    const normalized: ComingBackPatient[] = rows.map((patient) => {
      const appointment = resolveAppointmentFallback(patient, {
        byPatientId: appointmentByPatientId,
        byPhone: appointmentByPhone,
        byEmail: appointmentByEmail,
      });

      const duplicatePatient = resolveDuplicatePatientWithDob(patient, {
        byPhone: patientDobByPhone,
        byEmail: patientDobByEmail,
      });

      return normalizeComingBackPatient(
        patient,
        appointment,
        duplicatePatient
      );
    });

    return NextResponse.json({ success: true, data: normalized });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load coming back patients" },
      { status: 500 }
    );
  }
}
