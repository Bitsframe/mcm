// pages/api/email-reply/webhook.js
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// Reuse a service-role Supabase client if already created (avoid recreating on hot reload)
declare global {
  // allow global to have this property across modules
  // eslint-disable-next-line no-var
  var __supabase_service_client__: SupabaseClient | undefined;
}

const supabase: SupabaseClient =
  global.__supabase_service_client__ ||
  (function createServiceClient() {
    const client = createClient(supabaseUrl || '', supabaseSecretKey || '');
    // store on global for reuse
    try {
      global.__supabase_service_client__ = client;
    } catch (e) {
      // ignore in environments where global is read-only
    }
    return client;
  })();

export async function POST(req: Request) {
  try {
    const { from, subject, body, messageId } = await req.json();

    // Validate the required fields are present
    if (!from || !subject || !body || !messageId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store the reply in Supabase
    const { data, error } = await supabase.from('email_replies').insert([
      {
        from,
        subject,
        body,
        message_id: messageId,
        received_at: new Date(),
      },
    ]);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Error saving reply to Supabase' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reply saved successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
