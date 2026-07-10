import "server-only";

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

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  if (!CREDENTIAL_ID || !CREDENTIAL_SECRET) {
    throw new Error(
      "Amazon Creators API credentials are not configured. Add AMAZON_CREDENTIAL_ID, AMAZON_CREDENTIAL_SECRET, and AMAZON_CREDENTIAL_VERSION to your environment variables."
    );
  }

  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const tokenUrl = TOKEN_ENDPOINTS[CREDENTIAL_VERSION];
  if (!tokenUrl) {
    throw new Error(`Unknown AMAZON_CREDENTIAL_VERSION "${CREDENTIAL_VERSION}". Expected one of: ${Object.keys(TOKEN_ENDPOINTS).join(", ")}`);
  }

  let response;
  if (isLegacyCognito) {
    const basicAuth = Buffer.from(`${CREDENTIAL_ID}:${CREDENTIAL_SECRET}`).toString("base64");
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${basicAuth}`,
      },
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

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Amazon token request failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  cachedToken = json.access_token;
  cachedTokenExpiresAt = Date.now() + (json.expires_in ? (json.expires_in - 60) * 1000 : 55 * 60 * 1000);
  return cachedToken;
}

async function callCatalogApi(path, body) {
  if (!PARTNER_TAG) {
    throw new Error("AMAZON_PARTNER_TAG is not configured.");
  }
  const token = await getAccessToken();

  const authHeader = isLegacyCognito
    ? `Bearer ${token}, Version ${CREDENTIAL_VERSION}`
    : `Bearer ${token}`;

  const response = await fetch(`${CATALOG_HOST}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader,
      "x-marketplace": MARKETPLACE,
    },
    body: JSON.stringify({ ...body, marketplace: MARKETPLACE, partnerTag: PARTNER_TAG, partnerType: "Associates" }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.errors?.[0]?.message || json?.message || `Amazon API request failed (${response.status})`;
    throw new Error(message);
  }
  return json;
}

function buildAffiliateLink(asin) {
  return `https://${MARKETPLACE}/dp/${asin}?tag=${PARTNER_TAG}&linkCode=ogi&th=1&psc=1`;
}

function extractPrice(priceObj) {
  if (!priceObj) return null;
  if (typeof priceObj.amount === "number") return priceObj.amount;
  if (typeof priceObj.money?.amount === "number") return priceObj.money.amount;
  if (typeof priceObj.displayAmount === "string") {
    const num = parseFloat(priceObj.displayAmount.replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

const RESOURCES = [
  "images.primary.large",
  "itemInfo.title",
  "itemInfo.features",
  "itemInfo.byLineInfo",
  "offersV2.listings.price",
  "offersV2.listings.savingBasis",
  "customerReviews.starRating",
  "customerReviews.count",
];

function mapItem(item) {
  const asin = item.asin;
  const listing = item.offersV2?.listings?.[0];
  const price = extractPrice(listing?.price);
  const listPrice = extractPrice(listing?.savingBasis);

  return {
    asin,
    title: item.itemInfo?.title?.displayValue ?? "Untitled product",
    brand: item.itemInfo?.byLineInfo?.brand?.displayValue ?? null,
    image_url: item.images?.primary?.large?.url ?? null,
    price,
    list_price: listPrice,
    currency: listing?.price?.currency ?? "AED",
    rating: item.customerReviews?.starRating?.value ?? null,
    review_count: item.customerReviews?.count ?? null,
    affiliate_url: buildAffiliateLink(asin),
    description: (item.itemInfo?.features?.displayValues || []).join(" \u2022 "),
    source: "amazon_api",
  };
}

export async function fetchProductByAsin(asin) {
  const items = await fetchProductsByAsins([asin]);
  const item = items[0];
  if (!item) throw new Error("No product found for that ASIN.");
  return item;
}

export async function fetchProductsByAsins(asins) {
  if (!asins || asins.length === 0) return [];
  if (asins.length > 10) {
    throw new Error("Amazon's API only allows up to 10 ASINs per request. Split into batches of 10.");
  }
  const json = await callCatalogApi("/catalog/v1/getItems", {
    itemIds: asins,
    itemIdType: "ASIN",
    resources: RESOURCES,
  });
  const items = json?.itemsResult?.items || json?.ItemsResult?.Items || [];
  return items.map(mapItem);
}

export async function searchProductsByKeyword(keyword) {
  const json = await callCatalogApi("/catalog/v1/searchItems", {
    keywords: keyword,
    itemCount: 10,
    resources: RESOURCES,
  });
  const items = json?.searchResult?.items || json?.SearchResult?.Items || [];
  return items.map(mapItem);
}

export function rankBestProducts(products, limit = 6) {
  function score(p) {
    if (!p.price) return -1;
    const rating = p.rating || 0;
    const reviews = p.review_count || 0;
    const reviewWeight = Math.log10(reviews + 1);
    const discount = p.list_price && p.list_price > p.price ? (p.list_price - p.price) / p.list_price : 0;
    return rating * (1 + reviewWeight) + discount * 3;
  }
  return [...products]
    .map((p) => ({ ...p, _score: score(p) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export { buildAffiliateLink };
