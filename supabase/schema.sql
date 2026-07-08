-- Dirham Genie database schema
-- Run this once inside Supabase: Project -> SQL Editor -> New query -> paste -> Run

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  image_url text,
  price numeric,
  currency text default 'AED',
  list_price numeric,             -- original price, for showing discount
  asin text,                      -- Amazon product ID, if fetched automatically
  affiliate_url text not null,    -- the final link with your tracking tag
  category_id uuid references categories(id) on delete set null,
  source text default 'manual',   -- 'manual' or 'amazon_api'
  is_featured boolean default false,
  is_active boolean default true,
  rating numeric,
  review_count integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table products add column if not exists brand text;
alter table products add column if not exists coupon_code text;
alter table products add column if not exists coupon_details text;
alter table products add column if not exists is_lightning_deal boolean default false;
alter table products add column if not exists deal_expires_at timestamptz;
alter table products add column if not exists last_synced_at timestamptz;

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_active on products(is_active);
create index if not exists idx_products_featured on products(is_featured);
create index if not exists idx_products_lightning on products(is_lightning_deal);

-- tracks outbound clicks so you can see which products/links get clicked
create table if not exists clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now()
);

-- price history: one row every time a product's price changes (via sync or manual edit)
create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  price numeric,
  recorded_at timestamptz default now()
);
create index if not exists idx_price_history_product on price_history(product_id);

-- homepage banners
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  link_url text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- standalone coupons (not tied to a single product)
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  code text,
  description text,
  affiliate_url text,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- admin team accounts with roles (Admin can manage everything + team; Editor can manage products/content only)
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz default now()
);

-- records every automatic Amazon sync run, for the Sync Logs admin page
create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz default now(),
  products_checked integer default 0,
  products_updated integer default 0,
  errors integer default 0,
  details text
);

-- newsletter signups
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz default now()
);

-- simple blog / news posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  is_published boolean default true,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- email alerts: subscribe to a category (or "all") and get notified on new products
create table if not exists deal_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  category_id uuid references categories(id) on delete cascade,
  created_at timestamptz default now(),
  unique(email, category_id)
);
create index if not exists idx_deal_alerts_category on deal_alerts(category_id);

-- storage bucket for generated social media post images (needs to be a
-- public URL for Facebook/Instagram's API to be able to fetch and post it)
insert into storage.buckets (id, name, public)
values ('social-posts', 'social-posts', true)
on conflict (id) do nothing;

-- Basic starter categories
insert into categories (name, slug) values
  ('Electronics', 'electronics'),
  ('Home & Kitchen', 'home-kitchen'),
  ('Beauty & Personal Care', 'beauty-personal-care'),
  ('Fashion', 'fashion'),
  ('Toys & Games', 'toys-games'),
  ('Sports & Outdoors', 'sports-outdoors')
on conflict (slug) do nothing;

-- Row Level Security: allow public read of active products/categories/etc,
-- but only the server (service role key) can write.
alter table products enable row level security;
alter table categories enable row level security;
alter table clicks enable row level security;
alter table price_history enable row level security;
alter table banners enable row level security;
alter table coupons enable row level security;
alter table admin_users enable row level security;
alter table sync_logs enable row level security;
alter table newsletter_subscribers enable row level security;
alter table posts enable row level security;
alter table deal_alerts enable row level security;

create policy "Public can read active products"
  on products for select
  using (is_active = true);

create policy "Public can read categories"
  on categories for select
  using (true);

create policy "Public can insert clicks"
  on clicks for insert
  with check (true);

create policy "Public can read active banners"
  on banners for select
  using (is_active = true);

create policy "Public can read active coupons"
  on coupons for select
  using (is_active = true);

create policy "Public can read published posts"
  on posts for select
  using (is_published = true);

create policy "Public can subscribe to newsletter"
  on newsletter_subscribers for insert
  with check (true);

create policy "Public can subscribe to deal alerts"
  on deal_alerts for insert
  with check (true);

-- No public policy on admin_users, sync_logs, or price_history:
-- only the server (using the service_role key) can read/write those.
