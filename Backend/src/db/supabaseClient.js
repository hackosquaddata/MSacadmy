// db/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

export default function connectSupabase() {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials are missing. Check your .env file.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Connected to Supabase successfully!");
    return supabase;
  } catch (error) {
    console.error("❌ Error connecting to Supabase:", error.message);
    process.exit(1); // stop server if DB connection fails
  }
}