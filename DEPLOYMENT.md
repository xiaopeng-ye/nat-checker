# Deployment — Cloudflare Pages (fully static)

The app builds to a **fully static** site: every localized page is
prerendered to HTML at build time. No server runtime is needed — NAT detection
runs entirely in the visitor's browser against public STUN servers.

## GitHub Actions → Cloudflare Pages (recommended)

`.github/workflows/cloudflare-pages.yml` builds the site on GitHub and uploads
`apps/web/dist/client` with `wrangler pages deploy` (Direct Upload — Cloudflare
does **not** build anything). It runs on every `v*.*.*` tag (and on manual
`workflow_dispatch`) and always deploys to the production branch:

```bash
pnpm version patch   # bumps package.json files and creates the vX.Y.Z tag
git push --follow-tags
```

### One-time setup

Only the two GitHub secrets are required. The workflow itself creates the
Pages project if missing, attaches the custom domain and points the DNS record
at `<project>.pages.dev` (`scripts/cloudflare-attach-domain.sh`), so the site
is live on `https://nat-checker.kkcloud.org` after the first tag.

GitHub repository **secrets** (Settings → Secrets and variables → Actions):

| Secret                  | Where to get it                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | dash.cloudflare.com/profile/api-tokens → Create Token → *Custom token* with **Account · Cloudflare Pages · Edit** and **Zone · DNS · Edit** (Zone Resources: `kkcloud.org`). The DNS permission is what lets CI bind the domain. |
| `CLOUDFLARE_ACCOUNT_ID` | Workers & Pages overview page, right sidebar (*Account ID*), or the URL `dash.cloudflare.com/<account-id>/...`.                                                                                                  |

Optional repository **variables** (same page, *Variables* tab):

| Variable                   | Default                           | Purpose                                     |
| -------------------------- | --------------------------------- | ------------------------------------------- |
| `VITE_SITE_URL`            | `https://nat-checker.kkcloud.org` | Canonical URL baked into the static output. |
| `CLOUDFLARE_PAGES_PROJECT` | `nat-checker`                     | Pages project name.                         |
| `CUSTOM_DOMAIN`            | `nat-checker.kkcloud.org`         | Hostname bound to the Pages project.        |
| `CLOUDFLARE_ZONE_NAME`     | `kkcloud.org`                     | Zone that owns the hostname.                |

> If `nat-checker.kkcloud.org` currently has other DNS records (e.g. an `A`
> record to a VPS), the script replaces them with the proxied CNAME.

`apps/web/public/_headers` is copied into the output and applied by Pages
(immutable caching for `/assets/*`, basic security headers).

## Build settings (Cloudflare Pages, Git-connected alternative)

| Setting                | Value                                          |
| ---------------------- | ---------------------------------------------- |
| Build command          | `pnpm install --frozen-lockfile && pnpm build` |
| Build output directory | `apps/web/dist/client`                         |

> Node 20+ is required. pnpm 10 is activated via `packageManager` / Corepack.

## Environment variables

| Variable        | Example                   | Purpose                                                                                                           |
| --------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL` | `https://nat-checker.kkcloud.org` | Canonical URLs, hreflang alternates, JSON-LD, sitemap host and robots.txt. Falls back to `https://nat-checker.kkcloud.org`. |
| `NODE_VERSION`  | `20`                      | Pin the Pages build image.                                                                                        |

## What the build produces

```
apps/web/dist/client/
├── index.html               # "/" redirector (browser-language detection, JS + <noscript> fallback)
├── 404.html                 # served with 404 status for unknown paths
├── en/index.html            # prerendered home, English
├── zh/index.html …          # prerendered home, all locales
├── en/nat-types/index.html  # prerendered /nat-types, all locales
├── sitemap.xml              # with hreflang xhtml:link alternates
├── robots.txt               # generated at build with the VITE_SITE_URL sitemap reference
└── assets/                  # hashed JS/CSS bundles
```

## Visitor requirements

Detection needs the visitor's browser to reach public STUN servers over outbound
UDP (Google, Cloudflare, Nextcloud and sipgate; see
`packages/nat-detection/src/stun-servers.ts`). Networks that block outbound
UDP produce a "servers unreachable" error; networks where only one server answers
produce an "Undetermined" result.
