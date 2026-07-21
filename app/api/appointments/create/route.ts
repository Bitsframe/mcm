import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/utils/supabase/service-role-client";

function emptyToNull(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function normalizeDobInput(dob: unknown): string | null {
  if (dob === undefined || dob === null) return null;
  const s = String(dob).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function extractAppointmentId(result: Record<string, unknown>): number | null {
  const raw =
    result.appointment_id ??
    (result as { appointment?: { id?: unknown } }).appointment?.id;
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawLocation =
      body.location_id ?? body.locationId ?? body.locationid;
    const {
      first_name,
      last_name,
      email_address,
      phone,
      sex,
      service,
      date_and_time,
      dob,
        address,
    } = body;

    const parsedLocationId = (() => {
      if (
        rawLocation === undefined ||
        rawLocation === null ||
        rawLocation === ""
      ) {
        return null;
      }
      const n = Number(rawLocation);
      return Number.isFinite(n) && n > 0 ? n : null;
    })();

    if (parsedLocationId === null) {
      return NextResponse.json(
        { error: "location_id is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleSupabase();

    const rawPatientId = body.patient_id ?? body.patientId;
    const patientId = (() => {
      if (rawPatientId === undefined || rawPatientId === null || rawPatientId === "") {
        return null;
      }
      const n = Number(rawPatientId);
      return Number.isFinite(n) && n > 0 ? n : null;
    })();

    const appointmentPayload: Record<string, unknown> = {
      location_id: parsedLocationId,
      first_name: emptyToNull(first_name),
      last_name: emptyToNull(last_name),
      email_address: emptyToNull(email_address),
      phone: emptyToNull(phone),
      sex: emptyToNull(sex),
      service: emptyToNull(service),
      date_and_time: emptyToNull(date_and_time),
      dob: normalizeDobInput(dob),
      address: emptyToNull(address),
      in_office_patient: true,
      new_patient: false,
      text_opt: false,
      email_opt: false,
      isApproved: true,
    };

    if (patientId != null) {
      appointmentPayload.patient_id = patientId;
    }

    const { data: createdAppointment, error: insertError } = await supabase
      .from("Appoinments")
      .insert([appointmentPayload])
      .select("*")
      .single();

    if (insertError) {
      console.error("Error creating appointment row:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    const normalizedDob = normalizeDobInput(dob);
    if (patientId != null && normalizedDob) {
      const { error: patientUpdateError } = await supabase
        .from("allpatients")
        .update({ dob: normalizedDob })
        .eq("id", patientId)
        .is("dob", null);

      if (patientUpdateError) {
        console.warn("Could not backfill patient DOB:", patientUpdateError.message);
      }
    }

    return NextResponse.json({
      success: true,
      appointment: createdAppointment,
    });

  } catch (error: any) {
    console.error('Error in create appointment API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
