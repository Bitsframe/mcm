import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import moment from "moment";
import { sendEmail } from "@/utils/emailService";
import { EmailBodyTempEnum } from "@/utils/emailService/templateDetails";
import { update_content_service } from '@/utils/supabase/data_services/data_services';

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
      console.error("[getReminders] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch appointments from the Supabase database
    const { data: appointments, error } = await supabase
      .from("Appointments")
      .select(`id, first_name, last_name, email_address, date_and_time, service, location_id, reminder_sent`)
      .order("id", { ascending: true });

    if (error) {
      console.error("[getReminders] Error fetching appointments:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const results: { appointmentId: number; type: string; status: string; error?: string }[] = [];

    // Iterate through each appointment and check if it requires a reminder
    for (const appt of appointments || []) {
      try {
        const dateAndTime: string | null = appt.date_and_time;
        if (!dateAndTime || appt.reminder_sent) continue; // Skip if reminder already sent or no date

        // Split and extract the date and time from the stored value
        const parts = dateAndTime.split("|");
        if (parts.length < 2) continue;

        const slotPart = parts[1].trim();
        const [datePartRaw, timePartRaw] = slotPart.split(" - ");
        if (!datePartRaw) continue;

        // Parse date using the format stored in the database
        const apptDate = moment(datePartRaw, "DD-MM-YYYY");
        if (!apptDate.isValid()) continue;

        const today = moment().startOf("day");
        const daysDiff = apptDate.startOf("day").diff(today, "days");

        let reminderType: string | null = null;

        // Check if it's time to send the reminder
        if (daysDiff === 14) reminderType = "2weeks";
        if (daysDiff === 2) reminderType = "2days";

        // Send the reminder if it's within the range
        if (!reminderType) continue;

        // Build the email payload for the reminder email
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
        };

        // Skip if there is no email address
        if (!emailData.email) {
          results.push({ appointmentId: appt.id, type: reminderType, status: "skipped", error: "no email" });
          continue;
        }

        // Send the reminder email
        await sendEmail({
          lang: "en",
          emailType: EmailBodyTempEnum.APPOINTMENT_CONFIRMATION, // You can adjust based on the template
          data: emailData,
        });

        // Mark the reminder as sent using the shared update_content_service
        try {
          await update_content_service({ table: 'Appointments', post_data: { id: appt.id, reminder_sent: true } });
        } catch (updateError: any) {
          console.error("[getReminders] Error updating reminder_sent status:", updateError?.message || updateError);
          results.push({ appointmentId: appt.id, type: reminderType, status: "failed", error: updateError?.message || String(updateError) });
          continue;
        }

        // Log success and record it
        results.push({ appointmentId: appt.id, type: reminderType, status: "sent" });
      } catch (err: any) {
        // Handle errors and log them
        console.error("[getReminders] Failed to process appointment id", appt.id, err?.message || err);
        results.push({ appointmentId: appt.id, type: "error", status: "failed", error: err?.message });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.status === "sent").length,
      details: results,
    });
  } catch (error: any) {
    // Catch general errors
    console.error("[getReminders] Reminder job failed:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
