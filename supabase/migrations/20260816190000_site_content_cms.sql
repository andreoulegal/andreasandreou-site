create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  section text not null check (section in ('home', 'navigation', 'seo', 'settings')),
  value jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(trim(label)) between 1 and 80),
  href text not null check (char_length(trim(href)) between 1 and 500),
  display_order integer not null default 0,
  visible boolean not null default true,
  status text not null default 'published' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  value jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists site_content_public_idx
  on public.site_content (section, content_key)
  where status = 'published';

create index if not exists navigation_items_public_idx
  on public.navigation_items (display_order)
  where status = 'published' and visible = true;

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

drop trigger if exists set_navigation_items_updated_at on public.navigation_items;
create trigger set_navigation_items_updated_at
  before update on public.navigation_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

create or replace function public.is_site_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.site_admins
    where user_id = (select auth.uid())
  );
$$;

insert into public.site_admins (user_id)
select id
from auth.users
where lower(email) = lower('andreoulegal@gmail.com')
on conflict (user_id) do nothing;

alter table public.site_admins enable row level security;
alter table public.site_content enable row level security;
alter table public.navigation_items enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Site admins can read own membership" on public.site_admins;
create policy "Site admins can read own membership"
  on public.site_admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Public can read published site content" on public.site_content;
create policy "Public can read published site content"
  on public.site_content
  for select
  to anon, authenticated
  using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists "Site admins can read all site content" on public.site_content;
create policy "Site admins can read all site content"
  on public.site_content
  for select
  to authenticated
  using ((select public.is_site_admin()));

drop policy if exists "Site admins can insert site content" on public.site_content;
create policy "Site admins can insert site content"
  on public.site_content
  for insert
  to authenticated
  with check ((select public.is_site_admin()));

drop policy if exists "Site admins can update site content" on public.site_content;
create policy "Site admins can update site content"
  on public.site_content
  for update
  to authenticated
  using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

drop policy if exists "Site admins can delete site content" on public.site_content;
create policy "Site admins can delete site content"
  on public.site_content
  for delete
  to authenticated
  using ((select public.is_site_admin()));

drop policy if exists "Public can read published navigation" on public.navigation_items;
create policy "Public can read published navigation"
  on public.navigation_items
  for select
  to anon, authenticated
  using (status = 'published' and visible = true and (published_at is null or published_at <= now()));

drop policy if exists "Site admins can manage navigation" on public.navigation_items;
create policy "Site admins can manage navigation"
  on public.navigation_items
  for all
  to authenticated
  using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

drop policy if exists "Public can read published site settings" on public.site_settings;
create policy "Public can read published site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists "Site admins can manage site settings" on public.site_settings;
create policy "Site admins can manage site settings"
  on public.site_settings
  for all
  to authenticated
  using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

grant select on public.site_content, public.navigation_items, public.site_settings to anon, authenticated;
grant select on public.site_admins to authenticated;
grant insert, update, delete on public.site_content, public.navigation_items, public.site_settings to authenticated;

insert into public.site_content (content_key, section, value, status, published_at)
values
  ('home.hero.headline', 'home', to_jsonb('Helping businesses create value through regulation, technology and public institutions.'::text), 'published', now()),
  ('home.hero.explore_label', 'home', to_jsonb('Explore expertise'::text), 'published', now()),
  ('home.hero.explore_href', 'home', to_jsonb('#expertise'::text), 'published', now()),
  ('home.hero.conversation_label', 'home', to_jsonb('Start a conversation'::text), 'published', now()),
  ('home.hero.conversation_href', 'home', to_jsonb('#contact'::text), 'published', now()),
  ('home.expertise.eyebrow', 'home', to_jsonb('Expertise'::text), 'published', now()),
  ('home.expertise.title', 'home', to_jsonb('Turning regulation into strategic value'::text), 'published', now()),
  ('home.expertise.category_line', 'home', '["Business Regulation", "Legal", "Digital Transformation", "Public Institutions"]'::jsonb, 'published', now()),
  ('home.expertise.cards', 'home', '[{"number":"01","title":"Business Regulation","body":"Turning regulatory requirements into informed business decisions and strategic advantage."},{"number":"02","title":"Legal","body":"Practical legal guidance for complex, regulated and cross-border matters."},{"number":"03","title":"Digital Transformation","body":"Connecting technology with the institutional realities that determine whether change works."},{"number":"04","title":"Public Institutions","body":"Understanding how public bodies operate — and how businesses can work with them effectively."}]'::jsonb, 'published', now()),
  ('home.procura.eyebrow', 'home', to_jsonb('Procura'::text), 'published', now()),
  ('home.procura.title', 'home', to_jsonb('The platform for better public procurement'::text), 'published', now()),
  ('home.procura.body', 'home', to_jsonb('Procura is an early-stage attempt to improve how public institutions conduct market research before procurement.'::text), 'published', now()),
  ('home.procura.action_label', 'home', to_jsonb('Explore Procura'::text), 'published', now()),
  ('home.public_contribution.eyebrow', 'home', to_jsonb('Public Contribution'::text), 'published', now()),
  ('home.public_contribution.title', 'home', to_jsonb('Institutions that work better for the people they serve.'::text), 'published', now()),
  ('home.public_contribution.body', 'home', to_jsonb('From Galatsi to European networks, my public work focuses on practical improvements that make institutions more responsive, accessible and useful in people''s everyday lives.'::text), 'published', now()),
  ('home.services.eyebrow', 'home', to_jsonb('Ways to work together'::text), 'published', now()),
  ('home.services.items', 'home', '["Legal and regulatory problem-solving","Greek and Cypriot market entry","Public procurement and B2G strategy","Cross-border coordination","Institutional and stakeholder strategy"]'::jsonb, 'published', now()),
  ('home.notes.eyebrow', 'home', to_jsonb('Notes'::text), 'published', now()),
  ('home.notes.title', 'home', to_jsonb('Recent thinking and updates'::text), 'published', now()),
  ('home.notes.view_all_label', 'home', to_jsonb('View all notes'::text), 'published', now()),
  ('home.closing.eyebrow', 'home', to_jsonb('Start a conversation'::text), 'published', now()),
  ('home.closing.title', 'home', to_jsonb('Good judgment should lead to a practical next step.'::text), 'published', now()),
  ('home.closing.button_label', 'home', to_jsonb('Get in touch'::text), 'published', now()),
  ('seo.home.title', 'seo', to_jsonb('Andreas Andreou | Law, Regulation & Public Institutions'::text), 'published', now()),
  ('seo.home.description', 'seo', to_jsonb('Helping businesses create value through regulation, technology and public institutions.'::text), 'published', now())
on conflict (content_key) do nothing;

insert into public.navigation_items (label, href, display_order, visible, status, published_at)
values
  ('Bio', '/bio', 1, true, 'published', now()),
  ('Expertise', '/work', 2, true, 'published', now()),
  ('Public Contribution', '/public-contribution', 3, true, 'published', now()),
  ('Services', '/#services', 4, true, 'published', now()),
  ('Procura', 'https://www.procura.gr/', 5, true, 'published', now()),
  ('Notes', '/#notes', 6, true, 'published', now())
on conflict do nothing;
