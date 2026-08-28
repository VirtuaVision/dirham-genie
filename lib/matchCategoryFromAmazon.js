import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Tries to match Amazon's own category text (e.g. "Home & Kitchen > Storage")
 * to one of the site's existing categories, so products don't sit in
 * "Uncategorised" when Amazon already told us roughly what they are.
 * Purely a best-effort match — returns null if nothing looks close enough,
 * which just leaves the product Uncategorised as before (no worse than now).
 */
export async function matchCategoryFromAmazon(amazonCategoryText) {
  if (!amazonCategoryText) return null;

  const { data: categories, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug");
  if (error || !categories || categories.length === 0) return null;

  const haystack = amazonCategoryText.toLowerCase();

  // Prefer the longest matching category name, so "Home & Kitchen" wins
  // over a shorter coincidental match like "Home".
  let best = null;
  for (const cat of categories) {
    const needle = cat.name.toLowerCase();
    if (needle.length < 4) continue; // skip very short names, too easy to false-match
    if (haystack.includes(needle) && (!best || needle.length > best.name.length)) {
      best = cat;
    }
  }

  return best ? best.id : null;
}
