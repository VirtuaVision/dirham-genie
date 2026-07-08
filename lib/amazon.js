import "server-only";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Amazon Product Advertising API (PA-API 5.0) client.
//
// This talks directly to Amazon's signed HTTPS API (AWS Signature Version 4).
// You need an APPROVED Amazon Associates account with PA-API access enabled
// (this only unlocks after your first 3 qualifying sales) plus an Access Key
// and Secret Key from https://affiliate-program.amazon.ae -> Tools -> Product
// Advertising API.
//
// All calls here run on the server only (API routes) — the secret key must
// never reach the browser.
// ---------------------------------------------------------------------------

const SERVICE = "ProductAdvertisingAPI";
const HOST = process.env.AMAZON_HOST || "webservices.amazon.ae";
const REGION = process.env.AMAZON_REGION || "eu-west-1";
const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const SECRET_KEY = process.env.AMAZON_SECRET_KEY;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const MARKETPLACE = process.env.AMAZON_MARKETPLACE || "www.amazon.ae";

function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function hash(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function getSignatureKey(secretKey, dateStamp, region, service) {
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

async function callPaApi(target, payload) {
  if (!ACCESS_KEY || !SECRET_KEY || !PARTNER_TAG) {
    throw new Error(
      "Amazon API credentials are not configured. Add AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY and AMAZON_PARTNER_TAG to your environment variables."
    );
  }

  // The two operations we use map to fixed paths:
  const opPath = target.endsWith("GetItems")
    ? "/paapi5/getitems"
    : target.endsWith("SearchItems")
    ? "/paapi5/searchitems"
    : (() => {
        throw new Error("Unsupported PA-API operation: " + target);
      })();

  const method = "POST";
  const service = SERVICE;
  const region = REGION;
  const endpoint = `https://${HOST}${opPath}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);

  const body = JSON.stringify(payload);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;

  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    method,
    opPath,
    "", // query string
    canonicalHeaders,
    signedHeaders,
    hash(body),
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join("\n");

  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, region, service);
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(endpoint, {
    method,
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host: HOST,
      "x-amz-date": amzDate,
      "x-amz-target": target,
      Authorization: authorizationHeader,
    },
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    const message =
      json?.Errors?.[0]?.Message || `Amazon API request failed (${response.status})`;
    throw new Error(message);
  }
  return json;
}

function buildAffiliateLink(asin) {
  return `https://${MARKETPLACE}/dp/${asin}?tag=${PARTNER_TAG}&linkCode=ogi&th=1&psc=1`;
}

const RESOURCES = [
  "Images.Primary.Large",
  "ItemInfo.Title",
  "ItemInfo.Features",
  "Offers.Listings.Price",
  "Offers.Listings.SavingBasis",
  "CustomerReviews.Count",
  "CustomerReviews.StarRating",
  "BrowseNodeInfo.BrowseNodes",
];

function mapItem(item) {
  const asin = item.ASIN;
  const price = item.Offers?.Listings?.[0]?.Price?.Amount ?? null;
  const currency = item.Offers?.Listings?.[0]?.Price?.Currency ?? "AED";
  const listPrice = item.Offers?.Listings?.[0]?.SavingBasis?.Amount ?? null;

  return {
    asin,
    title: item.ItemInfo?.Title?.DisplayValue ?? "Untitled product",
    image_url: item.Images?.Primary?.Large?.URL ?? null,
    price,
    list_price: listPrice,
    currency,
    rating: item.CustomerReviews?.StarRating?.Value ?? null,
    review_count: item.CustomerReviews?.Count ?? null,
    affiliate_url: buildAffiliateLink(asin),
    description: (item.ItemInfo?.Features?.DisplayValues || []).join(" \u2022 "),
    source: "amazon_api",
  };
}

/** Fetch one product's live details by its ASIN (the code in the Amazon URL, e.g. B0DXXXXXX) */
export async function fetchProductByAsin(asin) {
  const items = await fetchProductsByAsins([asin]);
  const item = items[0];
  if (!item) throw new Error("No product found for that ASIN.");
  return item;
}

/**
 * Fetch up to 10 products in a single Amazon API call (Amazon's hard limit
 * per request). Pass more than 10 and this will throw — chunk them yourself
 * (see chunkArray below) if you have a longer list to refresh.
 */
export async function fetchProductsByAsins(asins) {
  if (!asins || asins.length === 0) return [];
  if (asins.length > 10) {
    throw new Error("Amazon's API only allows up to 10 ASINs per request. Split into batches of 10.");
  }
  const payload = {
    ItemIds: asins,
    Resources: RESOURCES,
    PartnerTag: PARTNER_TAG,
    PartnerType: "Associates",
    Marketplace: MARKETPLACE,
  };
  const json = await callPaApi(
    "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
    payload
  );
  const items = json?.ItemsResult?.Items || [];
  return items.map(mapItem);
}

/** Splits an array into chunks of a given size, e.g. for batching ASINs 10 at a time */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/** Search Amazon by keyword, returns up to 10 matching products */
export async function searchProductsByKeyword(keyword) {
  const payload = {
    Keywords: keyword,
    Resources: RESOURCES,
    PartnerTag: PARTNER_TAG,
    PartnerType: "Associates",
    Marketplace: MARKETPLACE,
    ItemCount: 10,
  };
  const json = await callPaApi(
    "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
    payload
  );
  const items = json?.SearchResult?.Items || [];
  return items.map(mapItem);
}

/**
 * Ranks a list of products by "quality" rather than Amazon's raw search
 * order, so live search fallback results surface genuinely good picks:
 * higher star rating + more reviews (a well-reviewed 4.3 beats a single
 * 5-star review) + a bigger discount all push a product up. Products with
 * no price or no rating are pushed to the bottom rather than dropped, so
 * the list is never empty.
 */
export function rankBestProducts(products, limit = 6) {
  function score(p) {
    if (!p.price) return -1; // no usable price — least useful result
    const rating = p.rating || 0;
    const reviews = p.review_count || 0;
    const reviewWeight = Math.log10(reviews + 1); // diminishing returns after a few hundred reviews
    const discount =
      p.list_price && p.list_price > p.price
        ? (p.list_price - p.price) / p.list_price
        : 0;
    return rating * (1 + reviewWeight) + discount * 3;
  }

  return [...products]
    .map((p) => ({ ...p, _score: score(p) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

export { buildAffiliateLink };
