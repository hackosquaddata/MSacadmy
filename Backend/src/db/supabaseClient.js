// db/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Regular client with anon key for normal operations
export function connectSupabase() {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("❌ Supabase credentials are missing. Check your .env file.");
      console.log("Required environment variables:");
      console.log("SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
      console.log("SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "✓" : "✗");
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });
    console.log("✅ Connected to Supabase successfully!");
    return supabase;
  } catch (error) {
    console.error("❌ Error connecting to Supabase:", error.message);
    process.exit(1); // stop server if DB connection fails
  }
}

// Admin client with service_role key for privileged operations
export function connectSupabaseAdmin() {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Supabase admin credentials are missing. Check your .env file.");
      console.log("Required environment variables:");
      console.log("SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
      console.log("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗");
      throw new Error("Missing Supabase admin credentials");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log("✅ Connected to Supabase Admin successfully!");
    return supabaseAdmin;
  } catch (error) {
    console.error("❌ Error connecting to Supabase Admin:", error.message);
    process.exit(1);
  }
}