import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import moment from "moment";
import { sendEmail } from "@/utils/emailService";
import { EmailBodyTempEnum } from "@/utils/emailService/templateDetails";

// Secure this endpoint by setting REMINDERS_CRON_SECRET in your environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.REMINDERS_CRON_SECRET || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function GET(req: Request) {
  try {
    // Validate secret header
    const headerSecret = req.headers.get("x-cron-secret") || "";
    if (CRON_SECRET && headerSecret !== CRON_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch appointments. We'll filter in JS because date_and_time is stored as text.
    const { data: appointments, error } = await supabase
      .from("Appoinments")
      .select(`id, first_name, last_name, email_address, date_and_time, service, location_id`)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const results: { appointmentId: number; type: string; status: string; error?: string }[] = [];

    for (const appt of appointments || []) {
      try {
        const dateAndTime: string | null = appt.date_and_time;
        if (!dateAndTime) continue;

        // Expecting format like: "<slotKey>|DD-MM-YYYY - 10:00 AM" or similar
        const parts = dateAndTime.split("|");
        if (parts.length < 2) continue;

        const slotPart = parts[1].trim();
        const [datePartRaw, timePartRaw] = slotPart.split(" - ");
        if (!datePartRaw) continue;

        // Parse date using the same format used elsewhere in the app
        const apptDate = moment(datePartRaw, "DD-MM-YYYY");
        if (!apptDate.isValid()) continue;

        const today = moment().startOf("day");
        const daysDiff = apptDate.startOf("day").diff(today, "days");

        let reminderType: string | null = null;
        if (daysDiff === 14) reminderType = "2weeks";
        if (daysDiff === 2) reminderType = "2days";

        if (!reminderType) continue;

        // Build email payload (minimal fields). You can expand by querying location info if desired.
        const emailData = {
          email: appt.email_address || "",
          name: `${appt.first_name || ""} ${appt.last_name || ""}`.trim() || "",
          location: {
            title: "",
            address: "",
            phone: "",
          },
          service: appt.service || "",
          date: apptDate.format("MM/DD/YYYY"),
          time: timePartRaw || "",
        } as any;

        // If no recipient email skip
        if (!emailData.email) {
          results.push({ appointmentId: appt.id, type: reminderType, status: "skipped", error: "no email" });
          continue;
        }

        // Send reminder email (re-uses existing sendEmail utility)
        // Using APPOINTMENT_CONFIRMATION template; adjust as needed
        await sendEmail({ lang: "en", emailType: EmailBodyTempEnum.APPOINTMENT_CONFIRMATION, data: emailData });

        // Record that we sent it in results. (Consider persisting to a reminders table to avoid double sends.)
        results.push({ appointmentId: appt.id, type: reminderType, status: "sent" });
      } catch (err: any) {
        console.error("Failed to process appointment id", appt.id, err?.message || err);
        results.push({ appointmentId: appt.id, type: "error", status: "failed", error: err?.message });
      }
    }

    return NextResponse.json({ success: true, sent: results.filter(r => r.status === 'sent').length, details: results });
  } catch (error: any) {
    console.error("Reminder job failed:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
