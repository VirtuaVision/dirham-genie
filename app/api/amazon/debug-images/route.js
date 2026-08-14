import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import "server-only";

// TEMPORARY DEBUG ROUTE — shows exactly what Amazon's Creators API returns
// for the images fields on one ASIN, so we can see why additional_images
// keeps coming back empty. Safe to delete once the images issue is fixed.

const CATALOG_HOST = "https://creatorsapi.amazon";
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const MARKETPLACE = process.env.AMAZON_MARKETPLACE || "www.amazon.ae";
const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;
const CREDENTIAL_VERSION = process.env.AMAZON_CREDENTIAL_VERSION || "3.2";

const TOKEN_ENDPOINTS = {
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
  "2.1": "https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token",
  "2.2": "https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token",
  "2.3": "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token",
};
const isLegacyCognito = CREDENTIAL_VERSION.startsWith("2.");

async function getAccessToken() {
  const tokenUrl = TOKEN_ENDPOINTS[CREDENTIAL_VERSION];
  let response;
  if (isLegacyCognito) {
    const basicAuth = Buffer.from(`${CREDENTIAL_ID}:${CREDENTIAL_SECRET}`).toString("base64");
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${basicAuth}` },
      body: "grant_type=client_credentials&scope=creatorsapi/default",
    });
  } else {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CREDENTIAL_ID,
        client_secret: CREDENTIAL_SECRET,
        scope: "creatorsapi::default",
      }),
    });
  }
  const json = await response.json();
  if (!response.ok) throw new Error(`Token request failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

export async function GET(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const asin = request.nextUrl.searchParams.get("asin");
  if (!asin) {
    return NextResponse.json({ error: "Add ?asin=B0XXXXXXXX to the URL." }, { status: 400 });
  }

  try {
    const token = await getAccessToken();
    const authHeader = isLegacyCognito ? `Bearer ${token}, Version ${CREDENTIAL_VERSION}` : `Bearer ${token}`;

    const response = await fetch(`${CATALOG_HOST}/catalog/v1/getItems`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        authorization: authHeader,
        "x-marketplace": MARKETPLACE,
      },
      body: JSON.stringify({
        itemIds: [asin],
        itemIdType: "ASIN",
        resources: ["images.primary.large", "images.variants.large"],
        marketplace: MARKETPLACE,
        partnerTag: PARTNER_TAG,
        partnerType: "Associates",
      }),
    });

    const json = await response.json();
    const items = json?.itemsResult?.items || json?.ItemsResult?.Items || [];
    const rawImages = items[0]?.images ?? items[0]?.Images ?? null;

    return NextResponse.json({
      httpStatus: response.status,
      rawImagesField: rawImages,
      fullFirstItem: items[0] || null,
      fullRawResponse: json,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
