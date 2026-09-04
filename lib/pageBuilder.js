// Save as: lib/pageBuilder.js
//
// Reads the homepage layout (the "Page Builder" blocks configured in the
// admin panel) for the public homepage to render. Uses the public
// `supabase` client (read-only, RLS-protected) since this runs on every
// homepage load — not the admin service-role client.

import { supabase } from "@/lib/supabaseClient";

// Returns { blocks: [{ id, type, config }, ...] } for every visible block,
// in the order set in the admin Page Builder screen.
//
// If the table is empty, missing, or the query fails for any reason, this
// returns null so app/page.jsx falls back to its built-in defaultBlocks
// layout instead of rendering a broken/empty homepage.
export async function getPageBuilderConfig() {
  try {
    const { data, error } = await supabase
      .from("homepage_blocks")
      .select("id, type, config, is_visible, sort_order")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return {
      blocks: data.map((block) => ({
        id: block.id,
        type: block.type,
        config: block.config || {},
      })),
    };
  } catch {
    return null;
  }
}
