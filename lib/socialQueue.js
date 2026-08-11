import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { postToFacebookPage, postToInstagram } from "@/lib/socialPost";
import { postToWhatsAppChannel } from "@/lib/whatsappChannel";

export async function createQueuedPost({ imageUrl, caption, platforms, scheduledFor }) {
  const { data, error } = await supabaseAdmin
    .from("scheduled_posts")
    .insert({
      image_url: imageUrl,
      caption,
      platforms,
      scheduled_for: scheduledFor,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listQueuedPosts() {
  const { data, error } = await supabaseAdmin
    .from("scheduled_posts")
    .select("*")
    .order("scheduled_for", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function cancelQueuedPost(id) {
  const { data, error } = await supabaseAdmin
    .from("scheduled_posts")
    .delete()
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function postQueuedItem(item) {
  const results = {};

  if (item.platforms.includes("facebook")) {
    try {
      results.facebook = await postToFacebookPage(item.image_url, item.caption);
    } catch (err) {
      results.facebook = { ok: false, error: err.message };
    }
  }
  if (item.platforms.includes("instagram")) {
    try {
      results.instagram = await postToInstagram(item.image_url, item.caption);
    } catch (err) {
      results.instagram = { ok: false, error: err.message };
    }
  }
  if (item.platforms.includes("whatsapp")) {
    try {
      results.whatsapp = await postToWhatsAppChannel(item.image_url, item.caption);
    } catch (err) {
      results.whatsapp = { ok: false, error: err.message };
    }
  }

  const anyFailed = Object.values(results).some((r) => r && !r.ok && !r.skipped);

  await supabaseAdmin
    .from("scheduled_posts")
    .update({
      status: anyFailed ? "failed" : "posted",
      posted_at: new Date().toISOString(),
      results,
    })
    .eq("id", item.id);

  return results;
}

export async function processDueQueuedPosts(limit = 10) {
  const { data: due, error } = await supabaseAdmin
    .from("scheduled_posts")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  const processed = [];
  for (const item of due || []) {
    const results = await postQueuedItem(item);
    processed.push({ id: item.id, results });
  }
  return processed;
}