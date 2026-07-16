-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run

create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table site_settings enable row level security;

drop policy if exists "Public can read site settings" on site_settings;
create policy "Public can read site settings"
  on site_settings for select
  using (true);
