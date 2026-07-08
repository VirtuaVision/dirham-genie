# Dirham Genie

An Amazon.ae affiliate deals website for the UAE market, built for **VirtuaVision**.

This guide assumes **zero coding experience**. Follow it top to bottom, in order.

---

## What you have

### Public website
- Homepage with hero, "Rub the Lamp" interactive deal reveal, categories, Genie's Picks, Freshly Unlocked
- Latest Deals, Biggest Discounts, Lightning Deals (with live countdown timers) pages
- Coupons page
- Product detail pages: price, discount badge, rating, coupon code, price history chart, related products, Wishlist button, Compare button, social share buttons, JSON-LD structured data for SEO
- Category pages, Search
- Wishlist and Compare Products pages (saved on-device, no login needed)
- Blog / News section
- Newsletter signup (footer)
- English / Arabic language switcher with right-to-left layout support
- Legal pages: About, Affiliate Disclaimer, Privacy Policy, Cookie Policy, Terms of Use, DMCA/Content Policy, Contact
- SEO: sitemap.xml, robots.txt, per-page metadata
- Optional Google Analytics integration
- Fully responsive, fast-loading (Next.js + image optimization)

### Admin Panel (`/admin`, password-protected)
- Dashboard with stats: products, clicks, subscribers, active coupons
- Add products: **Auto-fetch from Amazon.ae** (paste a link) or **Add Manually**
- Edit / hide / feature / delete products
- Mark products as Lightning Deals with an expiry countdown
- Add coupon codes to individual products or as standalone Coupons
- Manage homepage Banners
- Manage Blog Posts
- **Team Access**: your main login is always full Admin; you can add extra Editor or Admin accounts for staff
- **Sync Logs**: see every automatic price-refresh run, or trigger one manually
- Scheduled automatic Amazon price sync (daily, via Vercel Cron) that also auto-expires Lightning Deals and coupons past their deadline, and records price history

### Database
Stores for every product: ASIN, title, brand, category, images, current price,
original price (for discount %), coupon code/details, affiliate URL,
description, rating, review count, lightning-deal status + expiry,
last-synced time, and active/hidden status. Plus: categories, banners,
coupons, blog posts, price history, sync logs, newsletter subscribers, and
admin team accounts.

---

## Step 1 — Create your free database (Supabase)

1. Go to https://supabase.com and sign up (free).
2. Click **New Project**. Name it `dirham-genie`, set a database password (save it somewhere safe), pick a region close to the UAE.
3. Once it's created, open **SQL Editor** → **New query**.
4. Open `supabase/schema.sql` from this project, copy all of it, paste it into the SQL editor, and click **Run**.
   - This creates every table listed above and some starter categories.
   - This file is safe to re-run later if it's ever updated — it won't duplicate or destroy your data.
5. Go to **Settings → API**. Keep this tab open — you'll need:
   - **Project URL**
   - **anon public** key
   - **service_role secret** key (click "Reveal") — keep this private

---

## Step 2 — Push this code to GitHub

1. Create a free account at https://github.com if needed.
2. Create a **New repository** named `dirham-genie`, set to Private.
3. Use GitHub's "uploading an existing file" option to drag-and-drop this whole project folder — no command line needed.

---

## Step 3 — Deploy to Vercel (free hosting)

1. Go to https://vercel.com, sign up with your GitHub account.
2. **Add New → Project** → choose `dirham-genie` → **Import**.
3. Before deploying, open **Environment Variables** and add each of these:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role secret key |
   | `ADMIN_EMAIL` | the email for your permanent Admin login |
   | `ADMIN_PASSWORD` | a strong password you choose |
   | `SESSION_SECRET` | any long random string |
   | `CRON_SECRET` | another long random string (protects the scheduled sync job) |
   | `AMAZON_ACCESS_KEY` | from Amazon Associates (see Step 4) — optional at first |
   | `AMAZON_SECRET_KEY` | from Amazon Associates (see Step 4) — optional at first |
   | `AMAZON_PARTNER_TAG` | your Associate tracking ID, e.g. `dirhamgenie-21` |
   | `AMAZON_HOST` | `webservices.amazon.ae` |
   | `AMAZON_REGION` | `eu-west-1` |
   | `AMAZON_MARKETPLACE` | `www.amazon.ae` |
   | `NEXT_PUBLIC_GA_ID` | your Google Analytics Measurement ID (optional) |

4. Click **Deploy**. You'll get a live link like `dirham-genie.vercel.app`.
5. Visit `yoursite.vercel.app/admin/login` and log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

The scheduled daily Amazon sync (`vercel.json`) runs automatically once deployed — no setup needed beyond the environment variables above.

---

## Step 4 — Get your Amazon Associates & PA-API keys

1. Apply at https://affiliate-program.amazon.ae if you haven't already.
2. Your **Partner/Associate Tag** is shown in Associates Central — goes into `AMAZON_PARTNER_TAG`.
3. PA-API access unlocks only after **3 qualifying sales within 180 days**. Until then, use **Add Manually** in the admin panel — build your link by taking any Amazon.ae product URL and adding `?tag=YOUR-TAG` to the end.
4. Once eligible: Associates Central → **Tools → Product Advertising API** → get your **Access Key** and **Secret Key** → add them in Vercel → redeploy.

---

## Step 5 — Connect your own domain (optional)

1. Buy `dirhamgenie.com` (or similar) from Namecheap, GoDaddy, etc.
2. In Vercel: your project → **Settings → Domains** → add your domain.
3. Add the DNS records Vercel shows you at your registrar.
4. Also update the hardcoded domain in `src/app/sitemap.js` and `src/app/robots.js` if you use a different domain name.

---

## Newest additions

### Bulk import from a CSV/list
Admin → Bulk Import → paste or upload a list of ASINs or Amazon.ae product
links (one per line) → optionally assign them all to one category → Start
Import. It fetches every product from Amazon in batches of 10, skips any
that are already on your site, and reports how many were imported vs
skipped vs invalid. Requires your Amazon PA-API keys to be set up.

### Filters & sorting
Category pages, Latest Deals, and Search results now have a filter bar:
sort by newest / price / biggest discount / rating, plus min/max price and
minimum star rating. Filters are saved in the page URL so they're
shareable and bookmarkable.

### Deal Alerts (email notifications)
Visitors can subscribe (by category, or "all categories") from the
homepage or any category page. When you add a new product to that
category — manually, via auto-fetch, or via bulk import — subscribers get
an automatic email. This needs one more free service:

1. Sign up free at https://resend.com (no credit card needed for the free tier — 3,000 emails/month).
2. Create an API key, add it to Vercel as `RESEND_API_KEY`.
3. Set `RESEND_FROM_EMAIL` to something like `Dirham Genie <deals@yourdomain.com>` (Resend will walk you through verifying your domain, or you can use their shared testing address to start).

Until you set this up, subscriptions are still collected in the database —
emails just won't send yet, and nothing else breaks.

### Live Amazon search fallback
If a search on your own site comes up with fewer than 6 results, Dirham
Genie automatically searches Amazon.ae live and shows a "More from
Amazon.ae" section underneath — so buyers can find literally anything
Amazon carries, not just what you've added. Results aren't picked in
Amazon's raw order: they're ranked by a quality score (star rating, number
of reviews, and discount size) so the best products surface first, and
every link already carries your affiliate tag. These live results aren't
saved to your database — if one keeps coming up in searches, add it
permanently via Add Product or Bulk Import.

### Facebook & Instagram Auto-Poster
In Admin → Social Post Generator, after generating an image and caption,
there's now a **"📤 Post to Facebook & Instagram"** button — one click
publishes the same post to both platforms at once, no downloading/uploading
by hand. This needs a one-time setup with Meta (Facebook's parent company)
that takes about 20–30 minutes. It's the same process any business goes
through — nothing about it is specific to this website, and you only do it
once.

**A. Set up your Page and Instagram account (skip if you already have these)**
1. Create a Facebook Page for Dirham Genie at facebook.com/pages/create if you don't have one yet.
2. In the Instagram app: Settings → Account type → switch to a **Business** account, then link it to your Facebook Page (Settings → Linked Accounts → Facebook).

**B. Create a Meta Developer App**
1. Go to https://developers.facebook.com → **My Apps** → **Create App** → choose type **Business** → name it anything, e.g. "Dirham Genie Poster".
2. Inside the app, go to **Tools → Graph API Explorer**.

**C. Generate your access token**
1. In Graph API Explorer, select your app from the dropdown, then click **Generate Access Token** and log in, granting these permissions when prompted: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management`.
2. This gives you a short-lived token (~1 hour) — next we make it long-lived. Go to your app's **Settings → Basic** page and note your **App ID** and **App Secret**.
3. In your browser's address bar, visit (replace the placeholders):
   `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN`
4. The page will show `{"access_token": "..."}` — copy that long-lived token.

**D. Get your Page Access Token, Page ID, and Instagram Business Account ID**
1. Back in Graph API Explorer, with your long-lived token pasted in, request: `GET /me/accounts`
2. Find your Page in the results — copy its `id` (this is `FACEBOOK_PAGE_ID`) and its `access_token` (this is `FACEBOOK_PAGE_ACCESS_TOKEN` — a Page token generated this way doesn't expire as long as you stay an admin of the Page).
3. Request: `GET /{the-page-id}?fields=instagram_business_account` using the Page access token — the number in the response is your `INSTAGRAM_BUSINESS_ACCOUNT_ID`.

**E. Add the values to Vercel**
Add `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN`, and `INSTAGRAM_BUSINESS_ACCOUNT_ID` in Vercel's Environment Variables (same place as your other keys), then redeploy. Your app stays in "Development Mode" the whole time — that's fine and expected, since you're only posting to your own Page/Instagram account, not asking Meta to review it for public use.

If a token ever stops working (Meta occasionally requires re-authentication), just repeat steps C–D to generate a fresh one.

### Recently Viewed & Trending Now
The homepage now shows a "Recently Viewed" row (remembered per-device, no
account needed) and a "🔥 Trending Now" section based on real click data
from the last 7 days — both update automatically, no admin work needed.

### Visual polish
Real star ratings (★★★★☆) instead of plain numbers, skeleton loading
placeholders while pages fetch data instead of a blank screen, and
friendlier empty states with icons and suggested next steps instead of
plain "no results" text.

---

## Using the Admin Panel day-to-day

- **Add a product automatically:** Add Product → "Auto-fetch from Amazon.ae" → paste the URL → Fetch → review → Save. (Requires Step 4.)
- **Add a product manually:** Add Product → "Add Manually" → fill in the fields → Save.
- **Make it a Lightning Deal:** tick "⚡ Lightning Deal" and set an end time — a live countdown appears on the site and it auto-hides once expired.
- **Add a coupon to a product:** fill in "Coupon Code" / "Coupon Details" on that product.
- **Add a standalone coupon:** Admin → Coupons → fill in the form.
- **Manage homepage banners:** Admin → Banners.
- **Write a blog post:** Admin → Blog Posts.
- **Add team members:** Admin → Team Access → choose Editor (products/content only) or Admin (full access).
- **Generate a social media post:** Admin → Social Post Generator → tick up to 4 recent products → "Generate Post" → an on-brand square image (with prices, discount badges, and the Dirham Genie logo) appears, ready to download as PNG, plus a matching caption with all the affiliate links, hashtags, and the required disclosure. Click **"📤 Post to Facebook & Instagram"** to publish it directly to both (once set up — see "Facebook & Instagram Auto-Poster" above), or download the image and paste the caption manually anywhere else.
- **Check sync health:** Admin → Sync Logs — shows every automatic run, or click "Run Sync Now" to trigger one immediately.
- **Track performance:** Dashboard shows products, clicks, subscribers, and active coupons.

### How often does the automatic sync run, and can I make it faster?
By default, once a day (via `vercel.json`, Vercel's free-tier maximum for
their built-in scheduler). To get updates **10 times a day for free**, point
an external scheduler at the same sync address instead:

1. Go to https://cron-job.org and create a free account.
2. Create a new cron job:
   - **URL:** `https://yoursite.com/api/cron/sync-amazon`
   - **Schedule:** every 2–3 hours (roughly 10 times a day)
   - **Request method:** GET
   - **Custom header:** `Authorization: Bearer YOUR_CRON_SECRET` (the same value you set for `CRON_SECRET` in Vercel)
3. Save it. You can keep the built-in Vercel daily cron running too — there's no conflict, it just means one of your ten daily runs comes from Vercel and the rest from cron-job.org.

You can always click "Run Sync Now" in the admin panel any time for an
instant refresh, regardless of the schedule.

### How many products can it fetch/update at once?
Amazon's API allows a **maximum of 10 products per request** (a hard limit
set by Amazon, not something any code can raise). The sync job automatically
splits your product list into batches of 10 and loops through them, so this
just affects how many API calls a full sync takes (e.g. 50 products = 5
calls), not how many products you can have overall. Note that new Amazon
Associate accounts also start with a fairly low daily request allowance that
grows automatically as your account generates more qualifying sales — this is
set by Amazon and outside our control.

---

## Multi-language (English / Arabic)

The site includes a working EN/عربي switcher in the header that flips the whole
layout to right-to-left and translates the navigation, hero, and button text.
Product titles/descriptions themselves are shown in whichever language you
entered them in the admin panel — to make individual products bilingual,
you'd enter Arabic titles/descriptions for those products too (this can be
extended by a developer later using the dictionary in `src/lib/i18n.js`).

---

## Legal / compliance notes

- The required "As an Amazon Associate we earn from qualifying purchases" disclosure is on every page footer, the homepage, every product page, and its own `/disclaimer` page.
- Cookie Policy (`/cookie-policy`), Privacy Policy (`/privacy`), Terms (`/terms`), and DMCA/Content Policy (`/dmca`) pages are included.
- Review Amazon's current Operating Agreement periodically — Amazon updates its rules occasionally, and staying compliant is the account holder's responsibility.
- Update the placeholder email on `/contact` before launch.

---

## If something breaks

- **Blank homepage / "No products yet":** normal until you add your first product.
- **Can't log into `/admin`:** double-check `ADMIN_EMAIL` / `ADMIN_PASSWORD` match exactly what's in Vercel's Environment Variables.
- **Amazon auto-fetch/sync errors:** most likely PA-API isn't approved yet (needs 3 sales first) or keys weren't saved correctly. Use "Add Manually" meanwhile — everything else keeps working.
- **Editor can't see Team Access page properly:** that's expected — only Admin-role accounts can manage the team; Editors will see an "Unauthorized" message there, which is correct behaviour.
- Any code changes: edit files in GitHub (or ask me), Vercel redeploys automatically within about a minute of any update.
