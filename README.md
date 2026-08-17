# Andreas Andreou Website

Production website and future content platform for [andreasandreou.gr](https://andreasandreou.gr/).

## Current status

This repository is the production source of truth. GitHub `main` deploys automatically
through Netlify to `andreasandreou.gr`. The `legacy-live/` directory is retained only
as a historical visual reference.

Read [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md) before making changes.

## Stack

- Astro for the public website
- React components for the admin dashboard
- Netlify for build, previews and hosting
- Supabase for authentication, database and storage
- Papaki retained initially for domain registration and email

## Verification

```bash
pnpm run check
pnpm run build
pnpm run test:smoke
```

The smoke test checks the public pages, sitemap, robots file, protected admin redirect
and the authentication session/sign-out endpoints. It does not attempt an interactive
Google login.
