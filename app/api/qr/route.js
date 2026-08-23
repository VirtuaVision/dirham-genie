import QRCode from "qrcode";

// Public on purpose: QR codes need to render on the public product page for
// any visitor, not just logged-in admins. It only ever generates a QR image
// for a URL — no data exposure, nothing sensitive.
export async function GET(request) {
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