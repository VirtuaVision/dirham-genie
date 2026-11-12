import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Stored in the site_settings table as "true"/"false" text. Anything that has
// never been switched off counts as ON, so behaviour doesn't change until
// you turn a platform off in the admin.
export const AUTO_SHARE_KEYS = {
  facebook: "auto_share_facebook",
  instagram: "auto_share_instagram",
  whatsapp: "auto_share_whatsapp",
};

export async function getAutoShareSettings() {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("key, value")
    .in("key", Object.values(AUTO_SHARE_KEYS));
  const map = {};
  (data || []).forEach((row) => (map[row.key] = row.value));
  const on = (key) => String(map[key]) !== "false";
  return {
    facebook: on(AUTO_SHARE_KEYS.facebook),
    instagram: on(AUTO_SHARE_KEYS.instagram),
    whatsapp: on(AUTO_SHARE_KEYS.whatsapp),
  };
}
