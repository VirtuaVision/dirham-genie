import "server-only";
import { createClient } from "@supabase/supabase-js";

// NEVER import this file from a component that runs in the browser.
// It uses the secret service-role key, which bypasses Row Level Security,
// so it must only ever run on the server (API routes / server actions).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);
