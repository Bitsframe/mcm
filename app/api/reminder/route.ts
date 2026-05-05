import { NextResponse } from 'next/server';
import moment from 'moment';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import 'dotenv/config';

// ===== Secure Environment Variables =====
const SENDER_BROADCAST_EMAIL = process.env.SENDER_BROADCAST_EMAIL!;
/** Same Lambda/base URL as other email paths; use NEXT_PUBLIC_* only to avoid duplicating EMAIL_SENDER_URL. */
const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_EMAIL_SENDER_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY!;

// ===== Main Handler (server-to-server, no user auth) =====
export async function GET(req: Request) {
  // 🔐 Validate x-internal-key header
  const internalKey = req.headers.get('x-internal-key');
  
  

  if (internalKey !== INTERNAL_API_KEY) {
    console.warn('❌ Unauthorized access attempt. Key received:', internalKey);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Environment variables are available (not logged to avoid leaking secrets)

  // ✅ Create privileged Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
  // fetching upcoming appointments

    // Fetch all appointments that have not yet been flagged
    const { data: appointments, error: fetchError } = await supabase
      .from('Appoinments')
      .select(
        'id, first_name, last_name, email_address, date_and_time, two_days_before, two_weeks_before'
      )
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching appointments:', fetchError.message);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

  // total appointments fetched (not logged)

    const results: {
      appointmentId: number;
      type: string;
      status: string;
      error?: string;
    }[] = [];

  const today = moment().startOf('day');

    // Iterate through all appointments
    for (const appt of appointments || []) {
      try {
  // processing appointment

        const rawDate = appt.date_and_time;
        if (!rawDate || appt.two_weeks_before || appt.two_days_before) {
          // skipping appointment (already flagged or missing date)
          continue;
        }

        // Parse date from "date - time" string
        const slotString = rawDate.includes('|')
          ? rawDate.split('|', 2)[1].trim()
          : rawDate.trim();
        const [datePartRaw, timePartRawRaw] = slotString.split(' - ');
        const timePart = (timePartRawRaw || '').trim();

        const apptDate = moment(datePartRaw?.trim(), [
          'DD-MM-YYYY', 'DD/MM/YYYY', 'MM-DD-YYYY', 'MM/DD/YYYY',
        ], true);

        if (!apptDate.isValid()) {
          console.warn(`❌ Invalid appointment date: ${rawDate}`);
          continue;
        }

  const daysDiff = apptDate.startOf('day').diff(today, 'days');

        // 🕒 Determine reminder type based on days difference
        let reminderType: '2weeks' | '2days' | null = null;
        if (daysDiff <= 14 && daysDiff > 2 && !appt.two_weeks_before) reminderType = '2weeks';
        if (daysDiff <= 2 && !appt.two_days_before) reminderType = '2days';
        if (!reminderType) {
          // no reminder needed for this appointment
          continue;
        }

        // 📨 Build email content
        const emailHtml = `
          <p>Hi ${appt.first_name || ''} ${appt.last_name || ''},</p>
          <p>This is a reminder for your appointment on <strong>${apptDate.format(
            'MM/DD/YYYY'
          )}</strong> at <strong>${timePart || ''}</strong>.</p>
          <p>Please be on time.</p>
  `;
  // email content created

        if (!appt.email_address) {
          console.warn(`❌ Appointment ID ${appt.id} has no email address.`);
          results.push({
            appointmentId: appt.id,
            type: reminderType,
            status: 'skipped',
            error: 'No email address',
          });
          continue;
        }

        // 🌐 Send email
  const endpoint = `${EDGE_FUNCTION_URL}/send-batch-email`;

        const payload = {
          from: SENDER_BROADCAST_EMAIL,
          recipients: [appt.email_address],
          subject:
            reminderType === '2weeks'
              ? 'Appointment Reminder (2 Weeks Ahead)'
              : 'Appointment Reminder (2 Days Ahead)',
          html: emailHtml,
        };

  // sending reminder

        let response;
        try {
          response = await axios.post(endpoint, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          });
        } catch (err: any) {
          console.error('❌ Email send failed (network):', err?.message);
          results.push({
            appointmentId: appt.id,
            type: reminderType,
            status: 'failed',
            error: err?.message,
          });
          continue;
        }

        if (response.status !== 200) {
          console.error('❌ Email send failed (non-200):', response.data);
          results.push({
            appointmentId: appt.id,
            type: reminderType,
            status: 'failed',
            error: JSON.stringify(response.data),
          });
          continue;
        }

        // 🗃️ Update flags
        const updateData =
          reminderType === '2weeks'
            ? { two_weeks_before: true }
            : { two_days_before: true };

        const { error: updateError } = await supabase
          .from('Appoinments')
          .update(updateData)
          .eq('id', appt.id);

        if (updateError) {
          console.error('❌ Error updating flags for appointment ID:', appt.id, updateError.message);
          throw updateError;
        }
        results.push({ appointmentId: appt.id, type: reminderType, status: 'sent' });
      } catch (err: any) {
        console.error('⚠️ Error processing appointment', appt.id, err?.message);
        results.push({
          appointmentId: appt.id,
          type: 'error',
          status: 'failed',
          error: err?.message,
        });
      }
    }

  // return job summary (not logged)
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: results.length,
      sent: results.filter((r) => r.status === 'sent').length,
      details: results,
    });
  } catch (err: any) {
    console.error('[getReminders] Job failed:', err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
