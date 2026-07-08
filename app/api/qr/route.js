import QRCode from "qrcode";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET(request) {
  if (!(await isAdminLoggedIn())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  const buffer = await QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: { dark: "#0B0B10", light: "#F5F1E8" },
  });

  return new Response(buffer, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400",
    },
  });
}
