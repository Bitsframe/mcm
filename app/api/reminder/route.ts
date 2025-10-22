import { NextResponse } from 'next/server';
import moment from 'moment';
import { fetch_content_service, update_content_service } from '@/utils/supabase/data_services/data_services';

// Use the environment variables
const SENDER_BROADCAST_EMAIL = process.env.SENDER_BROADCAST_EMAIL!;
const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_EMAIL_SENDER_URL!;

export async function GET(req: Request) {
  try {
    // Validate the API key for authorization
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_API_KEY;
    const headerSecret = req.headers.get('Authorization')?.split(' ')[1];

    if (headerSecret !== secretKey) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch minimal fields from Appointments via shared data service
    const appointments: any[] = await fetch_content_service({
      table: 'Appointments',
      selectParam: ',id,first_name,last_name,email_address,date_and_time,two_days_before,two_weeks_before',
      sortOptions: { column: 'id', order: 'asc' },
    });

    const results: { appointmentId: number; type: string; status: string; error?: string }[] = [];

    // Iterate through each appointment and check if it requires a reminder
    for (const appt of appointments || []) {
      try {
        const dateAndTime: string | null = appt.date_and_time;
        if (!dateAndTime || appt.two_weeks_before || appt.two_days_before) continue; // Skip if reminder already sent or flags are true

        // Parse stored value like: "3|26-09-2025 - 11:00 AM"
        const slotString = dateAndTime.includes('|')
          ? dateAndTime.split('|', 2)[1].trim()
          : dateAndTime.trim();

        const [datePartRaw, timePartRawRaw] = slotString.split(' - ');
        if (!datePartRaw) continue;
        const timePartRaw = (timePartRawRaw || '').trim();

        const apptDate = moment(datePartRaw.trim(), [
          'DD-MM-YYYY',
          'DD/MM/YYYY',
          'MM-DD-YYYY',
          'MM/DD/YYYY',
        ], true);
        if (!apptDate.isValid()) continue;

        const today = moment().startOf("day");
        const daysDiff = apptDate.startOf("day").diff(today, "days");

        let reminderType: string | null = null;

        // Check if it's time to send the reminder (either 2 weeks or 2 days)
        if (daysDiff <= 14 && !appt.two_weeks_before) reminderType = "2weeks";
        if (daysDiff === 2 && !appt.two_days_before) reminderType = "2days";

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

        // Send the reminder email using the same endpoint and format as /api/sendappointmentemail
        if (!EDGE_FUNCTION_URL) {
          const msg = '[reminder] EDGE_FUNCTION_URL not configured';
          console.error(msg);
          results.push({ appointmentId: appt.id, type: reminderType, status: "failed", error: msg });
          continue;
        }

        const batchEndpoint = EDGE_FUNCTION_URL.endsWith('/')
          ? `${EDGE_FUNCTION_URL}send-batch-email`
          : `${EDGE_FUNCTION_URL}/send-batch-email`;

        const subject = reminderType === '2weeks'
          ? 'Appointment Reminder (2 weeks)'
          : 'Appointment Reminder (2 days)';

        const batchPayload = {
          from: SENDER_BROADCAST_EMAIL,
          recipients: [emailData.email],
          subject,
          html: `
  ${emailData.name ? `<p>Hello ${emailData.name},</p>` : ''}
  <p>This is a gentle reminder that your appointment is scheduled for <strong>${emailData.date} at ${emailData.time}</strong>.</p>
  <p>We look forward to seeing you!</p>
`,
        };

        const response = await fetch(batchEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchPayload),
        });

        const responseText = await response.text();
        if (!response.ok) {
          console.error('[reminder] Email send failed:', responseText);
          results.push({ appointmentId: appt.id, type: reminderType, status: "failed", error: responseText });
          continue;
        }

        // Mark the reminder as sent using the shared update_content_service
        try {
          const updateData = reminderType === "2weeks"
            ? { two_weeks_before: true }
            : { two_days_before: true };

          await update_content_service({ table: 'Appointments', post_data: { id: appt.id, ...updateData } });
        } catch (updateError: any) {
          console.error("[getReminders] Error updating reminder flags:", updateError?.message || updateError);
          results.push({ appointmentId: appt.id, type: reminderType, status: "failed", error: updateError?.message || String(updateError) });
          continue;
        }

        // Log success and record it
        results.push({ appointmentId: appt.id, type: reminderType, status: "sent" });
      } catch (err: any) {
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
    console.error("[getReminders] Reminder job failed:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
