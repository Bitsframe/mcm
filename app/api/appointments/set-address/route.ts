import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Sets `Appoinments.address` after create-appointment edge function returns.
 * Uses service role only after session + location access check.
 */
export async function POST(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { appointmentId?: number; address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const appointmentId = body.appointmentId;
  const address = typeof body.address === "string" ? body.address.trim() : "";

  if (appointmentId == null || Number.isNaN(Number(appointmentId)) || !address) {
    return NextResponse.json(
      { error: "appointmentId and non-empty address are required" },
      { status: 400 }
    );
  }

  const id = Number(appointmentId);

  const { data: appt, error: apptErr } = await supabase
    .from("Appoinments")
    .select("id, location_id")
    .eq("id", id)
    .single();

  if (apptErr || !appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const { data: locRows, error: locErr } = await supabase
    .from("user_locations")
    .select("location_id")
    .eq("profile_id", user.id);

  if (locErr) {
    return NextResponse.json({ error: locErr.message }, { status: 400 });
  }

  const allowed = locRows?.some((r) => r.location_id === appt.location_id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createClient(url, serviceKey);
  const { error: upErr } = await admin
    .from("Appoinments")
    .update({ address })
    .eq("id", id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
