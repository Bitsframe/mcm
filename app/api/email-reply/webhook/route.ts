import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req, res) {
  try {
    // Parse the incoming JSON data from the email reply
    const reply = await req.json();

    // Log the incoming email reply for debugging
    console.log('Received email reply:', reply);

    // Extract necessary fields from the reply
    const { from, subject, body, messageId } = reply;

    // Check for required fields
    if (!from || !body || !messageId) {
      return res.status(400).json({ error: 'Missing required fields in reply' });
    }

    // Insert the email reply into the Supabase database
    const { data, error } = await supabase
      .from('email_replies')
      .insert([
        {
          from,
          subject,
          body,
          message_id: messageId,
          received_at: new Date().toISOString(),
        }
      ]);

    // Handle error from Supabase insert
    if (error) {
      console.error('Error storing email reply:', error);
      return res.status(500).json({ error: 'Failed to store email reply' });
    }

    // Respond with success
    return res.status(200).json({ message: 'Email reply stored successfully' });
  } catch (error) {
    console.error('Error processing email reply:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
