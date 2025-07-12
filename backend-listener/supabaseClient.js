import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env from the current working directory (listener folder)
dotenv.config();

// Debug environment variables
console.log('🔍 Supabase URL loaded:', !!process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No');
console.log('🔍 Supabase Service Role Key loaded:', !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // <-- Use service role key here
);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Add these to your .env file:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
} else {
  // Test connection
  supabase.from('Triplets').select('count', { count: 'exact', head: true })
    .then(({ error, count }) => {
      if (error) {
        console.error('❌ Supabase connection test failed:', error.message);
      } else {
        console.log('✅ Supabase connection test successful');
      }
    });
}

export default supabase;