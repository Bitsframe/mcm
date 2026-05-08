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

/**
 * The create-appointment edge function often inserts minimal columns. This
 * mirrors patient info onto Appoinments and sets patient_id for returning
 * patients so the list and allpatients join show name, gender, and email.
 */
async function syncCreatedAppointmentRow(
  appointmentId: number,
  body: Record<string, unknown>
) {
  const {
    first_name,
    last_name,
    email_address,
    phone,
    sex,
  } = body;

  const rawPid = body.patient_id ?? body.patientId;
  let patientId: number | null = null;
  if (rawPid !== undefined && rawPid !== null && rawPid !== "") {
    const n = Number(rawPid);
    if (Number.isFinite(n) && n > 0) patientId = n;
  }

  const patch: Record<string, unknown> = {
    first_name: emptyToNull(first_name),
    last_name: emptyToNull(last_name),
    email_address: emptyToNull(email_address),
    sex: emptyToNull(sex),
    phone: emptyToNull(phone),
    dob: normalizeDobInput(body.dob),
  };

  if (patientId != null) {
    patch.patient_id = patientId;
  }

  const admin = getServiceRoleSupabase();
  const { error } = await admin
    .from("Appoinments")
    .update(patch)
    .eq("id", appointmentId);

  if (error) {
    throw error;
  }
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
      onsite,
      text_opt,
      email_opt,
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

    // Edge functions in this project vary: some read `locationid`, others `location_id`.
    // Send both so the deployed function always receives a location for Appoinments.location_id.
    const edgePayload = {
      firstname: first_name,
      lastname: last_name,
      email: email_address,
      phone,
      gender: sex,
      dob: dob ?? null,
      locationid: parsedLocationId,
      location_id: parsedLocationId,
      onsite: onsite ?? true,
      text_opt: text_opt ?? false,
      email_opt: email_opt ?? false,
      address: address ?? null,
      service,
      date_and_time,
    };

    if (parsedLocationId === null) {
      return NextResponse.json(
        { error: "location_id is required" },
        { status: 400 }
      );
    }

    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase service role key' },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }

    // Default slug must match a deployed function on this project (not "create-appointment").
    // Override with CREATE_APPOINTMENT_EDGE_URL e.g. .../appointment-insert-with-dob-check
    const createAppointmentUrl =
      process.env.CREATE_APPOINTMENT_EDGE_URL?.trim() ||
      `${supabaseUrl}/functions/v1/create-appointment-mcm`;

    const response = await fetch(createAppointmentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify(edgePayload),
    });

    let result: Record<string, unknown>;
    try {
      result = (await response.json()) as Record<string, unknown>;
    } catch {
      console.error("Edge function returned non-JSON body");
      return NextResponse.json(
        { error: "Failed to create appointment (invalid response from server)" },
        { status: response.status || 502 }
      );
    }

    if (!response.ok) {
      console.error("Edge function error:", result);
      const msg =
        (typeof result.error === "string" && result.error) ||
        (typeof result.message === "string" && result.message) ||
        "Failed to create appointment";
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    const appointmentId = extractAppointmentId(result);
    if (appointmentId != null) {
      try {
        await syncCreatedAppointmentRow(appointmentId, body);
      } catch (e) {
        console.error("syncCreatedAppointmentRow failed:", e);
      }
    }

    // Edge functions often return { status, appointment_id, patient_id }; UI expects success + appointment.id
    if (result.status === "success" && result.appointment_id != null) {
      return NextResponse.json({
        success: true,
        appointment: {
          id: result.appointment_id,
          patient_id: result.patient_id,
        },
      });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in create appointment API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
