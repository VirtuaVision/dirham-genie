// Save as: lib/siteSettings.js

import { supabase } from "@/lib/supabaseClient";

export async function getSiteSetting(key, fallback = null) {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value || fallback;
}
