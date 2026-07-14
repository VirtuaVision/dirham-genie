import "server-only";

// ---------------------------------------------------------------------------
// Amazon Creators API client (replaces the old PA-API 5.0, which Amazon
// retired on May 15, 2026). This uses OAuth2 client-credentials auth instead
// of the old AWS-style signed requests.
//
// You need: an approved Amazon Associates account with 10+ qualifying sales
// in the trailing 30 days, and credentials from Associates Central ->
// Tools -> Creators API -> Create Application -> Add New Credential.
//
// Env vars used:
//   AMAZON_CREDENTIAL_ID       - "Credential ID" from Associates Central
//   AMAZON_CREDENTIAL_SECRET   - "Credential Secret" (shown once, save it)
//   AMAZON_CREDENTIAL_VERSION  - shown next to your credential, e.g. "3.2"
//                                 (amazon.ae is in the EU credential group)
//   AMAZON_PARTNER_TAG         - your Associate tracking ID
//   AMAZON_MARKETPLACE         - www.amazon.ae
// ---------------------------------------------------------------------------

const CATALOG_HOST = "https://creatorsapi.amazon";
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const MARKETPLACE = process.env.AMAZON_MARKETPLACE || "www.amazon.ae";
const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;
const CREDENTIAL_VERSION = process.env.AMAZON_CREDENTIAL_VERSION || "3.2"; // 3.2 = EU group, covers amazon.ae

const TOKEN_ENDPOINTS = {
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
  "2.1": "https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token",
  "2.2": "https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token",
  "2.3": "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token",
};

const isLegacyCognito = CREDENTIAL_VERSION.startsWith("2.");

// Cached in module memory so we don't fetch a new token on every request
// within the same warm serverless instance.
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
  // refresh a little early to be safe
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

// Pulls a numeric price out of whatever shape offersV2 gives us — the exact
// field name varies by response version, so we try the likely candidates.
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

// dealDetails' exact shape isn't documented well for this API, so we try
// several plausible field names rather than betting on just one.
//
// IMPORTANT: dealDetails only exists for officially-badged Amazon "Deals".
// The vast majority of ordinary discounted products (a regular reduced
// price with no deal badge) carry their savings on the price object
// itself instead — that case must be checked first, or list_price comes
// back null for most real discounts.
function extractListPrice(price, listing) {
  const priceObj = listing?.price;
  const savings = priceObj?.savings;

  if (savings) {
    const savingsAmount = extractPrice(savings);
    if (savingsAmount && price) {
      return Math.round((price + savingsAmount) * 100) / 100;
    }
    const savingsPercent = savings.percentage ?? savings.percent ?? null;
    if (savingsPercent && price) {
      const computed = price / (1 - savingsPercent / 100);
      return Math.round(computed * 100) / 100;
    }
  }

  const deal = listing?.dealDetails;
  if (deal) {
    const percentOff =
      deal.percentageOff ?? deal.percentOff ?? deal.savingsPercentage ?? null;
    if (percentOff && price) {
      const computed = price / (1 - percentOff / 100);
      return Math.round(computed * 100) / 100;
    }

    const directList =
      extractPrice(deal.strikethroughPrice) ??
      extractPrice(deal.listPrice) ??
      extractPrice(deal.savingBasis) ??
      extractPrice(deal.basisPrice);
    if (directList) return directList;
  }

  // Last-resort fallback for any other shape that puts a plain list price
  // straight on the listing.
  return (
    extractPrice(listing?.listPrice) ??
    extractPrice(priceObj?.listPrice) ??
    extractPrice(priceObj?.strikethroughPrice) ??
    null
  );
}

// Star rating's exact field name is another one of this API's undocumented
// spots, so we check a few likely shapes.
function extractRating(reviews) {
  if (!reviews) return null;
  const r = reviews.starRating;
  if (typeof r === "number") return r;
  if (typeof r?.value === "number") return r.value;
  if (typeof r?.displayValue === "string") {
    const num = parseFloat(r.displayValue);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function extractAvailability(listing) {
  const a = listing?.availability;
  if (!a) return true; // assume in stock if we don't get a clear signal
  const type = (a.type || a.message || "").toString().toLowerCase();
  if (type.includes("out of stock") || type.includes("unavailable")) return false;
  return true;
}

function extractBrowseNode(item) {
  const node = item.browseNodeInfo?.browseNodes?.[0];
  const rank = item.browseNodeInfo?.websiteSalesRank;
  return {
    category: node?.displayName || node?.contextFreeName || null,
    salesRank: rank?.salesRank ?? null,
  };
}

const RESOURCES = [
  "images.primary.large",
  "images.variants.large",
  "itemInfo.title",
  "itemInfo.features",
  "itemInfo.byLineInfo",
  "offersV2.listings.price",
  "offersV2.listings.dealDetails",
  "offersV2.listings.availability",
  "customerReviews.starRating",
  "customerReviews.count",
  "browseNodeInfo.browseNodes",
  "browseNodeInfo.websiteSalesRank",
];

function mapItem(item) {
  const asin = item.asin;
  const listing = item.offersV2?.listings?.[0];
  const price = extractPrice(listing?.price);
  const listPrice = extractListPrice(price, listing);
  const { category, salesRank } = extractBrowseNode(item);
  const additionalImages = (item.images?.variants?.large || [])
    .map((v) => v.url)
    .filter(Boolean)
    .slice(0, 6);

  return {
    asin,
    title: item.itemInfo?.title?.displayValue ?? "Untitled product",
    brand: item.itemInfo?.byLineInfo?.brand?.displayValue ?? null,
    image_url: item.images?.primary?.large?.url ?? null,
    additional_images: additionalImages,
    price,
    list_price: listPrice,
    currency: listing?.price?.currency ?? "AED",
    rating: extractRating(item.customerReviews),
    review_count: item.customerReviews?.count ?? null,
    in_stock: extractAvailability(listing),
    amazon_category: category,
    amazon_sales_rank: salesRank,
    affiliate_url: buildAffiliateLink(asin),
    description: (item.itemInfo?.features?.displayValues || []).join(" \u2022 "),
    source: "amazon_api",
  };
}

/** Fetch one product's live details by its ASIN */
export async function fetchProductByAsin(asin) {
  const items = await fetchProductsByAsins([asin]);
  const item = items[0];
  if (!item) throw new Error("No product found for that ASIN.");
  return item;
}

/** Fetch up to 10 products in a single call (Amazon's per-request limit) */
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

/** Search Amazon by keyword, returns up to 10 matching products */
export async function searchProductsByKeyword(keyword) {
  const json = await callCatalogApi("/catalog/v1/searchItems", {
    keywords: keyword,
    itemCount: 10,
    resources: RESOURCES,
  });
  const items = json?.searchResult?.items || json?.SearchResult?.Items || [];
  return items.map(mapItem);
}

/**
 * Ranks live search results by quality (rating, reviews, discount) rather
 * than Amazon's raw order.
 */
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