import { isAdminLoggedIn } from "@/lib/auth";

const ALLOWED_HOSTS = [
  "m.media-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "images-na.ssl-images-amazon.com",
];

export async function GET(request) {
  if (!(await isAdminLoggedIn())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  const isAllowed =
    ALLOWED_HOSTS.includes(parsed.hostname) || parsed.hostname.endsWith(".supabase.co");
  if (!isAllowed) {
    return new Response("Host not allowed", { status: 400 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok) {
    return new Response("Failed to fetch image", { status: 502 });
  }
  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  const buffer = await upstream.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600",
    },
  });
}
