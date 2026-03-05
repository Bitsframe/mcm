import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabasePublishableKey) {
  console.error(
    'Missing Supabase environment variables. Please check your .env.local file.',
    { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabasePublishableKey 
    }
  );
}

const supabase = createClient(supabaseUrl || '', supabasePublishableKey || '');

// Test connection on initialization
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('Locations').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('Supabase connection successful, found data:', data);
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return false;
  }
};

// Run the test in browser environments only
if (typeof window !== 'undefined') {
  testConnection();
}

export default supabase;
