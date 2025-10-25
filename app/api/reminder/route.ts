// import { NextResponse } from 'next/server';
// import moment from 'moment';
// import { createClient } from '@supabase/supabase-js';
// import axios from 'axios';

// // ✅ Secure, private environment variables (no NEXT_PUBLIC_)
// const SENDER_BROADCAST_EMAIL = process.env.SENDER_BROADCAST_EMAIL!;
// const EDGE_FUNCTION_URL = process.env.EMAIL_SENDER_URL!;
// const SUPABASE_URL = process.env.SUPABASE_URL!;
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// // ✅ Protected API endpoint
// export async function GET(req: Request) {
//   try {
//     // ----------------------------
//     // 1️⃣ Authenticate Supabase user via JWT
//     // ----------------------------
//     const authHeader = req.headers.get('authorization');
//     if (!authHeader?.startsWith('Bearer ')) {
//       return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
//     }

//     const token = authHeader.split(' ')[1];
//     const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//     const { data: { user }, error: userError } = await supabase.auth.getUser(token);
//     if (userError || !user) {
//       console.error('Unauthorized access:', userError?.message);
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     console.log(`✅ Authenticated user: ${user.email}`);

//     // ----------------------------
//     // 2️⃣ Create service-role client for DB operations
//     // ----------------------------
//     const serviceClient = createClient(
//       SUPABASE_URL,
//       process.env.SUPABASE_SERVICE_ROLE_KEY! // private, server-only
//     );

//     console.log("Fetching appointments...");

//     const { data: appointments, error: fetchError } = await serviceClient
//       .from('Appoinments')
//       .select('id, first_name, last_name, email_address, service, date_and_time, two_days_before, two_weeks_before')
//       .order('id', { ascending: true });

//     if (fetchError) {
//       console.error("Error fetching appointments:", fetchError.message);
//       return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
//     }

//     console.log(`Appointments fetched: ${appointments.length}`);

//     const results: { appointmentId: number; type: string; status: string; error?: string }[] = [];

//     // ----------------------------
//     // 3️⃣ Process reminders
//     // ----------------------------
//     for (const appt of appointments || []) {
//       try {
//         const dateAndTime: string | null = appt.date_and_time;
//         if (!dateAndTime || appt.two_weeks_before || appt.two_days_before) continue;

//         const slotString = dateAndTime.includes('|')
//           ? dateAndTime.split('|', 2)[1].trim()
//           : dateAndTime.trim();

//         const [datePartRaw, timePartRawRaw] = slotString.split(' - ');
//         if (!datePartRaw) continue;
//         const timePartRaw = (timePartRawRaw || '').trim();

//         const apptDate = moment(datePartRaw.trim(), [
//           'DD-MM-YYYY', 'DD/MM/YYYY', 'MM-DD-YYYY', 'MM/DD/YYYY',
//         ], true);

//         if (!apptDate.isValid()) continue;

//         const today = moment().startOf('day');
//         const daysDiff = apptDate.startOf('day').diff(today, 'days');

//         let reminderType: string | null = null;
//         if (daysDiff <= 14 && !appt.two_weeks_before) reminderType = "2weeks";
//         if (daysDiff <= 2 && !appt.two_days_before) reminderType = "2days";

//         if (!reminderType) continue;

//         // ----------------------------
//         // 4️⃣ Build and send email
//         // ----------------------------
//         const emailHtml = `<p>Hi ${appt.first_name || ''} ${appt.last_name || ''},</p>
//           <p>This is a reminder for your appointment on <strong>${apptDate.format("MM/DD/YYYY")}</strong> at <strong>${timePartRaw || ''}</strong>.</p>
//           <p>Please be on time.</p>`;

//         if (!appt.email_address) {
//           results.push({ appointmentId: appt.id, type: reminderType, status: "skipped", error: "no email" });
//           continue;
//         }

//         const endpoint = `${EDGE_FUNCTION_URL}/send-batch-email`;
//         const payload = {
//           from: SENDER_BROADCAST_EMAIL,
//           recipients: [appt.email_address],
//           subject: reminderType === '2weeks'
//             ? 'Appointment Reminder (2 weeks)'
//             : 'Appointment Reminder (2 days)',
//           html: emailHtml,
//         };

//         console.log(`[reminder] Sending reminder for ${appt.email_address} (${reminderType})`);

//         let response;
//         try {
//           response = await axios.post(endpoint, payload, {
//             headers: { 'Content-Type': 'application/json' },
//             timeout: 15000,
//           });
//         } catch (err: any) {
//           console.error('[reminder] Email send failed (network):', err?.message || err);
//           results.push({ appointmentId: appt.id, type: reminderType, status: "failed", error: err?.message });
//           continue;
//         }

//         if (response.status !== 200) {
//           console.error('[reminder] Email send failed:', response.data);
//           results.push({ appointmentId: appt.id, type: reminderType, status: "failed", error: response.data });
//           continue;
//         }

//         // ----------------------------
//         // 5️⃣ Update flags
//         // ----------------------------
//         const updateData = reminderType === "2weeks" ? { two_weeks_before: true } : { two_days_before: true };
//         const { error: updateError } = await serviceClient
//           .from('Appoinments')
//           .update(updateData)
//           .eq('id', appt.id);

//         if (updateError) throw updateError;

//         console.log(`✅ Reminder flag updated for appointment ID: ${appt.id}`);
//         results.push({ appointmentId: appt.id, type: reminderType, status: "sent" });
//       } catch (err: any) {
//         console.error("[getReminders] Failed to process appointment id", appt.id, err?.message || err);
//         results.push({ appointmentId: appt.id, type: "error", status: "failed", error: err?.message });
//       }
//     }

//     // ----------------------------
//     // 6️⃣ Return summary
//     // ----------------------------
//     return NextResponse.json({
//       success: true,
//       sent: results.filter(r => r.status === "sent").length,
//       details: results,
//     });

//   } catch (error: any) {
//     console.error("[getReminders] Reminder job failed:", error?.message || error);
//     return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
//   }
// }




import { NextResponse } from 'next/server';
import moment from 'moment';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// ===== Environment Variables =====
const SENDER_BROADCAST_EMAIL = process.env.SENDER_BROADCAST_EMAIL!;
const EDGE_FUNCTION_URL = process.env.EMAIL_SENDER_URL!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const INTERNAL_REMINDER_KEY = process.env.INTERNAL_REMINDER_KEY!;

// ===== Main Handler =====
export async function GET(req: Request) {
  // 1️⃣ Authorize caller (AWS Lambda)
  {
  const apiKey = req.headers.get('x-api-key');
console.log('🔍 Received x-api-key:', apiKey);
console.log('🔍 Expected INTERNAL_REMINDER_KEY:', INTERNAL_REMINDER_KEY);

if (apiKey !== INTERNAL_REMINDER_KEY) {
  console.error('❌ Unauthorized request – invalid or missing x-api-key');
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
  }

  // 2️⃣ Create Supabase client (service role)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('Fetching appointments...');

    const { data: appointments, error: fetchError } = await supabase
      .from('Appoinments')
      .select(
        'id, first_name, last_name, email_address, service, date_and_time, two_days_before, two_weeks_before'
      )
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching appointments:', fetchError.message);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Appointments fetched: ${appointments.length}`);

    const results: {
      appointmentId: number;
      type: string;
      status: string;
      error?: string;
    }[] = [];

    // 3️⃣ Process reminders
    for (const appt of appointments || []) {
      try {
        const dateAndTime: string | null = appt.date_and_time;
        if (!dateAndTime || appt.two_weeks_before || appt.two_days_before) continue;

        // Parse date and time
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

        const today = moment().startOf('day');
        const daysDiff = apptDate.startOf('day').diff(today, 'days');

        let reminderType: string | null = null;
        if (daysDiff <= 14 && !appt.two_weeks_before) reminderType = '2weeks';
        if (daysDiff <= 2 && !appt.two_days_before) reminderType = '2days';

        if (!reminderType) continue;

        // 4️⃣ Build email content
        const emailHtml = `
          <p>Hi ${appt.first_name || ''} ${appt.last_name || ''},</p>
          <p>This is a reminder for your appointment on <strong>${apptDate.format(
            'MM/DD/YYYY'
          )}</strong> at <strong>${timePartRaw || ''}</strong>.</p>
          <p>Please be on time.</p>
        `;

        if (!appt.email_address) {
          results.push({
            appointmentId: appt.id,
            type: reminderType,
            status: 'skipped',
            error: 'No email address',
          });
          continue;
        }

        // 5️⃣ Send email via external function
        const endpoint = `${EDGE_FUNCTION_URL}/send-batch-email`;
        const payload = {
          from: SENDER_BROADCAST_EMAIL,
          recipients: [appt.email_address],
          subject:
            reminderType === '2weeks'
              ? 'Appointment Reminder (2 weeks)'
              : 'Appointment Reminder (2 days)',
          html: emailHtml,
        };

        console.log(`[reminder] Sending reminder to ${appt.email_address} (${reminderType})`);

        let response;
        try {
          response = await axios.post(endpoint, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          });
        } catch (err: any) {
          console.error('[reminder] Email send failed (network):', err?.message || err);
          results.push({
            appointmentId: appt.id,
            type: reminderType,
            status: 'failed',
            error: err?.message,
          });
          continue;
        }

        if (response.status !== 200) {
          console.error('[reminder] Email send failed:', response.data);
          results.push({
            appointmentId: appt.id,
            type: reminderType,
            status: 'failed',
            error: JSON.stringify(response.data),
          });
          continue;
        }

        // 6️⃣ Update reminder flags in DB
        const updateData =
          reminderType === '2weeks'
            ? { two_weeks_before: true }
            : { two_days_before: true };

        const { error: updateError } = await supabase
          .from('Appoinments')
          .update(updateData)
          .eq('id', appt.id);

        if (updateError) throw updateError;

        console.log(`✅ Reminder flag updated for appointment ID: ${appt.id}`);
        results.push({ appointmentId: appt.id, type: reminderType, status: 'sent' });
      } catch (err: any) {
        console.error('[getReminders] Failed to process appointment', appt.id, err?.message);
        results.push({
          appointmentId: appt.id,
          type: 'error',
          status: 'failed',
          error: err?.message,
        });
      }
    }

    // 7️⃣ Return summary
    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.status === 'sent').length,
      details: results,
    });
  } catch (error: any) {
    console.error('[getReminders] Reminder job failed:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
