import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { postToFacebookPage, postToInstagram } from "@/lib/socialPost";
import { postToWhatsAppChannel } from "@/lib/whatsappChannel";
import { captureAndUploadProductScreenshot } from "@/lib/screenshotProduct";
import { formatAed, discountPercent, truncateTitle } from "@/lib/formatCurrency";

const SITE_URL = "https://dirham-genie.vercel.app";
const REPOST_COOLDOWN_DAYS = 3;

function buildCaption(product, categoryName) {
  const price = formatAed(product.price) || "See price on Amazon";
  const discount = discountPercent(product.price, product.list_price);
  const priceLine = discount
    ? `${price} (was ${formatAed(product.list_price)}) — ${discount}% OFF 🔥`
    : price;

  return (
    `🧞‍♂️ Today's ${categoryName} Spotlight ✨\n\n` +
    `${truncateTitle(product.title)}\n` +
    `💰 ${priceLine}\n` +
    `🔗 ${product.affiliate_url}\n\n` +
    `📍 More ${categoryName} deals: ${SITE_URL}/\n\n` +
    `#DirhamGenie #UAEDeals #AmazonUAE #DubaiDeals`
  );
}

async function pickCategoryAndProduct() {
  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (!categories || categories.length === 0) return null;

  // Rotate through categories by day of week, so different categories get
  // the spotlight on different days instead of always the same one.
  const dayIndex = new Date().getDay();
  const category = categories[dayIndex % categories.length];

  const cooldownCutoff = new Date(
    Date.now() - REPOST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .not("price", "is", null)
    .not("list_price", "is", null)
    .or(`last_social_posted_at.is.null,last_social_posted_at.lt.${cooldownCutoff}`)
    .order("last_social_posted_at", { ascending: true, nullsFirst: true })
    .limit(20);

  if (!products || products.length === 0) return { category, product: null };

  // Among eligible candidates, pick the one with the deepest discount.
  const withDiscount = products
    .map((p) => ({
      ...p,
      _discount: p.list_price > p.price ? (p.list_price - p.price) / p.list_price : 0,
    }))
    .sort((a, b) => b._discount - a._discount);

  return { category, product: withDiscount[0] };
}

export async function autoPostCategorySpotlight() {
  if (process.env.SOCIAL_AUTO_POST_CATEGORY === "false") {
    return { skipped: true, reason: "Category spotlight auto-posting is turned off (SOCIAL_AUTO_POST_CATEGORY=false)." };
  }

  const picked = await pickCategoryAndProduct();
  if (!picked || !picked.product) {
    return {
      skipped: true,
      reason: picked
        ? `No eligible product found in "${picked.category.name}" today.`
        : "No categories found.",
    };
  }

  const { category, product } = picked;
  const caption = buildCaption(product, category.name);
  const screenshotUrl = await captureAndUploadProductScreenshot(product.affiliate_url);
  const imageUrl = screenshotUrl || product.image_url;

  const [fb, ig, wa] = await Promise.allSettled([
    postToFacebookPage(imageUrl, caption),
    postToInstagram(imageUrl, caption),
    postToWhatsAppChannel(imageUrl, caption),
  ]);

  const results = {
    facebook: fb.status === "fulfilled" ? fb.value : { ok: false, error: fb.reason?.message || "Unknown error" },
    instagram: ig.status === "fulfilled" ? ig.value : { ok: false, error: ig.reason?.message || "Unknown error" },
    whatsapp: wa.status === "fulfilled" ? wa.value : { ok: false, error: wa.reason?.message || "Unknown error" },
  };

  await supabaseAdmin
    .from("products")
    .update({ last_social_posted_at: new Date().toISOString() })
    .eq("id", product.id);

  return { category: category.name, productId: product.id, title: product.title, results };
}
