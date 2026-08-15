create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 240),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text check (excerpt is null or char_length(excerpt) <= 500),
  body jsonb not null default '{}'::jsonb,
  cover_image_path text,
  category text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_published_at_idx
  on public.articles (published_at desc)
  where status = 'published';

create index if not exists articles_author_updated_idx
  on public.articles (author_id, updated_at desc);

drop trigger if exists set_articles_updated_at on public.articles;
create trigger set_articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
  on public.articles
  for select
  to anon, authenticated
  using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists "Authors can read their articles" on public.articles;
create policy "Authors can read their articles"
  on public.articles
  for select
  to authenticated
  using ((select auth.uid()) = author_id);

drop policy if exists "Authors can create articles" on public.articles;
create policy "Authors can create articles"
  on public.articles
  for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can update articles" on public.articles;
create policy "Authors can update articles"
  on public.articles
  for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can delete articles" on public.articles;
create policy "Authors can delete articles"
  on public.articles
  for delete
  to authenticated
  using ((select auth.uid()) = author_id);

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-media',
  'article-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload article media" on storage.objects;
create policy "Authenticated users can upload article media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'article-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Authenticated users can update article media" on storage.objects;
create policy "Authenticated users can update article media"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'article-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'article-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Authenticated users can delete article media" on storage.objects;
create policy "Authenticated users can delete article media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'article-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
