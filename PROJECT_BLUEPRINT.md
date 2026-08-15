# Andreas Andreou Website — Project Blueprint

> Living technical reference for the website, public content platform and admin dashboard.
>
> Last updated: 2026-08-15
>
> Status: Phase 3 foundation in progress; Supabase database/storage and invitation acceptance are complete, while the first dashboard implementation is being built.

## 1. Project objective

Build a maintainable personal website for Andreas Andreou with:

- a public website;
- an articles section;
- a private admin dashboard;
- article creation, editing, drafts and publishing;
- image/file uploads;
- automatic deployment from GitHub;
- a clear separation between source code, hosting, backend and content data.

The target workflow is:

```text
Edit code in GitHub
        ↓
Netlify builds and deploys the application
        ↓
Supabase stores content, users and files
        ↓
andreasandreou.gr serves the public website
```

## 2. Current state (verified 2026-08-15)

### Live infrastructure

The current public domain is served from a Papaki-associated server:

- `andreasandreou.gr` A record: `213.158.90.220`
- reverse DNS: `linux250.papaki.gr`
- HTTP server: Nginx
- TLS certificate: Let's Encrypt
- DNS nameservers: `dns1.papaki.gr`, `dns2.papaki.gr`
- `www.andreasandreou.gr` is a CNAME to `andreasandreou.gr`

The current live artifact is a static website containing files similar to:

```text
index.html
bio.html
work.html
public-contribution.html
styles.css
assets/
```

### Existing GitHub repositories

The account `andreoulegal` currently has three public repositories:

1. [`andreoulegal/andreasandreou`](https://github.com/andreoulegal/andreasandreou)
   - legacy GitHub Pages repository;
   - contains only `CNAME` and an old placeholder `index.html`;
   - not the source of the current live website.

2. [`andreoulegal/astro-platform-starter`](https://github.com/andreoulegal/astro-platform-starter)
   - Astro/React/Tailwind/Netlify starter project;
   - no current deployment records;
   - not the current production website.

3. [`andreoulegal/astro-platform-starter-a3cbd`](https://github.com/andreoulegal/astro-platform-starter-a3cbd)
   - duplicate of the previous Astro starter;
   - same `main` commit and content;
   - not the current production website.

### Current conclusion

The current GitHub repositories and current Papaki-hosted website were disconnected. The new repository is now connected to an isolated Netlify project for deployment verification. The live custom domain still remains on Papaki; no DNS cutover has been made.

### New production repository

- Repository: [`andreoulegal/andreasandreou-site`](https://github.com/andreoulegal/andreasandreou-site)
- Default branch: `main`
- Working branch: `phase1/astro-migration`
- Frontend migration commit: `5bf3189`
- Visibility: public
- Current branch contents: Astro frontend, project instructions, blueprint, README and a captured snapshot under `legacy-live/`
- Netlify project: `andreasandreou-site` (`344d8e7d-2025-4aef-a587-a142e4310dc5`)
- Netlify URL: `https://andreasandreou-site.netlify.app`
- Netlify repository connection: GitHub `andreoulegal/andreasandreou-site`
- Netlify deploy branch: `phase1/astro-migration`
- Netlify build command: `pnpm run build`
- Netlify publish directory: `dist`
- Latest isolated Netlify deployment: published successfully from commit `5bf3189`
- The custom domain, Papaki hosting and DNS remain unchanged.

### Supabase foundation

- Project: `andreasandreou-site`
- Project ref: `nlrqgufqwcbosdlrazwr`
- Region: Central EU (Frankfurt), `eu-central-1`
- Project URL: `https://nlrqgufqwcbosdlrazwr.supabase.co`
- Database: `public.articles` with draft/published/archived states
- Security: Row Level Security enabled with public published-article reads and author-owned writes
- Storage: public `article-media` bucket, 5 MB image limit, authenticated uploads scoped to the user's folder
- Local migration: `supabase/migrations/20260815170014_articles_foundation.sql`
- Auth site URL: `https://andreasandreou-site.netlify.app`
- Initial admin invitation sent to `andreoulegal@gmail.com`; accepted successfully on 2026-08-15.
- Netlify production context has the public Supabase URL and publishable key configured; private keys are not stored in GitHub.

## 3. Target architecture

```text
                         ┌──────────────────────┐
                         │ GitHub                │
                         │ source + history     │
                         └──────────┬───────────┘
                                    │ push / pull request
                                    ▼
                         ┌──────────────────────┐
                         │ Netlify              │
                         │ build + hosting      │
                         │ previews + deploy    │
                         └──────────┬───────────┘
                                    │ HTTPS
                                    ▼
                         ┌──────────────────────┐
                         │ andreasandreou.gr    │
                         │ public website       │
                         └──────────────────────┘

        ┌──────────────────────┐       ┌──────────────────────┐
        │ Admin dashboard      │──────▶│ Supabase             │
        │ /admin               │ API   │ Auth + DB + Storage  │
        └──────────────────────┘       └──────────────────────┘
```

### Responsibilities

| Service | Responsibility |
|---|---|
| GitHub | Source code, history, pull requests and deployment trigger |
| Astro | Public website framework and server-rendered article pages |
| React | Interactive dashboard components |
| Netlify | Build, previews, production deployment, hosting and HTTPS |
| Supabase | Authentication, PostgreSQL database, file storage and selected backend functions |
| Papaki | Domain registration and email services, if retained |

Papaki hosting does not need to remain the website host in the target architecture. The domain can remain registered at Papaki while DNS records point the website to Netlify. Existing email-related records must be preserved during any DNS change.

## 4. Application architecture

### Public website

Use Astro for:

- homepage;
- biography and work pages;
- public contribution pages;
- article index;
- individual article pages;
- metadata and SEO;
- responsive and accessible layouts.

Article pages should be server-rendered or otherwise generated in an SEO-friendly way. The public site must show only articles whose status is `published` and whose publication date has arrived.

### Admin dashboard

Initial dashboard route:

- Netlify preview: `https://andreasandreou-site.netlify.app/admin`
- The first implementation supports email magic-link login, listing the signed-in author's articles and creating draft/published records.
- The first implementation is intentionally a foundation: rich-text editing, media upload UI, editing existing articles and server-side SSR session middleware remain follow-up work.

```text
/admin
```

Initial features:

- login/logout;
- article list;
- create article;
- edit article;
- save draft;
- publish/unpublish;
- upload cover image;
- preview article;
- delete/archive article;
- basic search and filtering.

The dashboard is protected by authentication. A hidden URL is not considered security.

### Backend

Supabase is the primary backend platform. Use:

- Supabase Auth for login and session management;
- PostgreSQL for article data;
- Supabase Storage for images and files;
- Row Level Security (RLS) for access rules;
- Supabase Edge Functions only for privileged or server-side workflows that cannot be safely handled by the client/API.

Avoid introducing a second backend platform unless a concrete requirement appears.

## 5. Content model

Initial `articles` table proposal:

```text
id                 UUID primary key
title              text not null
slug               text unique not null
excerpt            text
body               structured rich-text content
cover_image_path   text
category           text
tags               text[] or related table
status             draft | published | archived
published_at       timestamp nullable
created_at         timestamp
updated_at         timestamp
```

The dashboard should use a rich-text editor. The author should not need to write HTML or Markdown manually. The stored format must be renderable safely on the public site.

Publishing rule:

```text
status = published
AND published_at is null OR published_at <= current time
```

The exact database query and security policy must enforce this rule rather than relying only on frontend filtering.

## 6. Repository structure

Proposed production repository:

```text
project/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   │   └── supabase/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── articles/
│   │   └── admin/
│   ├── styles/
│   └── middleware.ts
├── public/
├── supabase/
│   ├── migrations/
│   └── functions/
├── tests/
├── .env.example
├── astro.config.mjs
├── package.json
├── README.md
└── PROJECT_BLUEPRINT.md
```

The legacy repositories should be preserved until the new production deployment is verified. Do not delete or overwrite them as part of the initial migration.

## 7. Environments and deployment

### Environments

```text
Local development
        ↓
Pull request preview on Netlify
        ↓
Production deployment from main
```

### Branch policy

- `main`: production source;
- feature branches: development work;
- pull requests: review and preview deployment;
- no direct production edits on the server.

### Deployment policy

1. Make a change in a feature branch.
2. Run local checks and build.
3. Open a pull request.
4. Inspect the preview deployment.
5. Merge to `main` only after review.
6. Netlify deploys `main` to production.

### Secrets

Secrets must be stored in Netlify/Supabase/GitHub secret configuration as appropriate. Never commit:

- database passwords;
- Supabase service-role keys;
- private tokens;
- Papaki/SFTP credentials;
- email provider credentials.

## 8. Domain and DNS migration

The preferred migration approach is:

1. Keep domain ownership at Papaki.
2. Keep and document all existing email DNS records.
3. Create the Netlify site and verify it using a temporary URL.
4. Add the custom domain in Netlify.
5. Change only the website DNS records required by Netlify.
6. Verify apex and `www` domains.
7. Verify HTTPS.
8. Verify email delivery before and after DNS changes.

Do not change DNS until the replacement site has been tested on a temporary URL and a backup of current DNS records has been saved.

## 9. Security requirements

Minimum requirements before production:

- admin authentication;
- server-side route protection for `/admin`;
- Supabase RLS enabled and tested;
- no public write access to articles;
- sanitized rich-text rendering;
- file upload type and size validation;
- secure HTTP-only session handling where applicable;
- rate limiting or abuse controls for sensitive endpoints;
- separate public and privileged Supabase keys;
- documented recovery process for a compromised admin account.

## 10. Backup and recovery

Maintain backups for:

- GitHub repository;
- Supabase database;
- Supabase Storage files;
- DNS records;
- production environment configuration.

Before the first migration:

- archive the current live website;
- record current DNS records;
- preserve the legacy repositories;
- capture a production screenshot and URL checklist.

## 11. Implementation phases

### Phase 0 — Discovery and backup

- [x] Download/archive current live files under `legacy-live/`.
- [x] Record the publicly observable DNS and domain configuration.
- [x] Preserve legacy GitHub repositories.
- [ ] Confirm Papaki account/hosting ownership.

### Phase 1 — Production repository and frontend

- [x] Create the new production repository.
- [x] Migrate the current public design into Astro pages.
- [x] Extract shared header/footer/layout components.
- [x] Reproduce current pages and routes: `/`, `/bio`, `/work`, `/public-contribution`.
- [x] Run `astro check`, production build and local route checks.

Current implementation branch: `phase1/astro-migration`.

Current verification:

- `astro check`: 0 errors, 0 warnings, 0 hints;
- `astro build`: successful with the Netlify adapter;
- local checks: all four public routes plus `/styles.css` and favicon returned `200`.

The Netlify adapter does not support Astro's local `preview` command. Local verification uses the Astro development server; Netlify preview deployment remains the production-runtime verification step.

### Phase 2 — Netlify deployment

- [x] Connect repository to Netlify.
- [x] Configure build command and output/runtime settings.
- [x] Verify the deployed site on the temporary Netlify URL.
- [ ] Change the custom domain or production DNS.

### Phase 3 — Supabase foundation

- [x] Create Supabase project.
- [x] Add the first migration.
- [x] Create `articles` schema.
- [x] Configure the initial Auth site URL and send the first admin invitation.
- [x] Confirm invitation acceptance; add local-development redirect URL before local auth testing.
- [x] Finish and test the first `/admin` dashboard flow on the Netlify preview.
- [x] Configure Storage bucket for article media.
- [x] Write and verify RLS policies.

### Phase 4 — Dashboard

- [ ] Add `/admin` route.
- [ ] Add authentication flow.
- [ ] Add article list and editor.
- [ ] Add drafts and publishing.
- [ ] Add image uploads.
- [ ] Add preview functionality.

### Phase 5 — Public articles

- [ ] Add `/articles` index.
- [ ] Add `/articles/[slug]` pages.
- [ ] Add SEO metadata.
- [ ] Add Open Graph metadata.
- [ ] Add sitemap and robots.txt.
- [ ] Confirm published/draft visibility rules.

### Phase 6 — Domain cutover

- [ ] Verify full site on temporary URL.
- [ ] Preserve email DNS records.
- [ ] Point website DNS to Netlify.
- [ ] Verify apex and `www`.
- [ ] Verify HTTPS and redirects.
- [ ] Monitor for errors.

### Phase 7 — Stabilization

- [ ] Add backups.
- [ ] Add analytics if required.
- [ ] Add error monitoring.
- [ ] Test rollback.
- [ ] Document routine publishing workflow.
- [ ] Mark old hosting/repositories as legacy only after verification.

## 12. Definition of done

The project is considered complete only when:

- a code change can be made in GitHub and deployed automatically;
- the public site works on `andreasandreou.gr`;
- the dashboard requires authentication;
- an admin can create and save a draft article;
- an admin can publish an article;
- a published article appears at a stable public URL;
- drafts are not publicly visible;
- images upload and render correctly;
- email continues to work;
- backups and rollback have been tested;
- the deployment and publishing workflows are documented.

## 13. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-08-15 | Use one new production repository | Existing repositories are legacy or duplicate starter projects |
| 2026-08-15 | Use Astro for the public site | Good fit for content-heavy, SEO-friendly sites |
| 2026-08-15 | Use React components for dashboard interactions | Suitable for forms and admin UI |
| 2026-08-15 | Use Netlify for build, deployment and hosting | Removes custom SFTP deployment and provides previews |
| 2026-08-15 | Use Supabase for Auth, database and storage | Avoids building and maintaining a custom server/database |
| 2026-08-15 | Keep Papaki for domain/email Minitially | Reduces migration risk and preserves existing email services |
| 2026-08-15 | Store articles in database, not Markdown files | Enables dashboard publishing without code edits |

## 14. Change-control rule

Before making a material architecture change, update this file with:

1. the proposed change;
2. the reason;
3. the affected services;
4. migration and rollback implications;
5. the new decision date.

The blueprint is the project reference point. If implementation and this document disagree, stop and update the document before continuing.
