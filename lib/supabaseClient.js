import { createClient } from "@supabase/supabase-js";

// Safe to use in the browser: only has read access to public data
// because of the Row Level Security policies defined in supabase/schema.sql
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
