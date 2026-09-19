# AGENTS.md

Guidance for coding agents working in this repository.

## What this is

**nat-checker** — a client-side NAT mapping-behavior detector. It uses WebRTC ICE
gathering against public STUN servers; nothing is ever sent to a project server.

It is a **TanStack Start** app that builds to a **fully static site**: every
localized page is prerendered to HTML at build time.

pnpm + Turborepo monorepo:

| Path                     | Package                    | Role                                                          |
| ------------------------ | -------------------------- | ------------------------------------------------------------- |
| `apps/web`               | `web`                      | TanStack Start app: routes, UI wiring, i18n, prerender config |
| `packages/nat-detection` | `@workspace/nat-detection` | Framework-agnostic detection engine (pure TS, vitest)         |
| `packages/ui`            | `@workspace/ui`            | shadcn/ui components + Tailwind design tokens                 |

Stack: TypeScript (strict), Node 20+, pnpm 10.33.4 (Corepack), React 19, Vite 8,
TanStack Start/Router, Tailwind CSS 4, Paraglide JS (i18n), shadcn/ui
(`base-vega` style, Base UI primitives, Hugeicons), vitest 5.

## Commands

Run from the repository root:

```bash
pnpm install         # pnpm workspace install
pnpm dev             # apps/web dev server, http://localhost:5173 (Vite default)
pnpm build           # turbo build → apps/web/dist/client (prerendered static site)
pnpm typecheck       # paraglide compile + tsc --noEmit (all packages)
pnpm run lint        # eslint (all packages)
pnpm test            # vitest (packages/nat-detection)
pnpm format          # prettier, including Tailwind class sorting

docker compose up -d --build   # static nginx image on http://localhost:5173
```

Always run `pnpm typecheck && pnpm run lint` (and `pnpm test` when the engine
changed) before reporting work as done.

## How it works

- **Static prerender, no server at runtime.** `tanstackStart({ prerender: true })`
  in `apps/web/vite.config.ts` prerenders the pages listed in its `pages` array
  (`/en`, `/zh`, … plus `/en/nat-types`, …) into `apps/web/dist/client`. The
  deployable artifact is that directory; production is either Cloudflare Pages
  (see `DEPLOYMENT.md`) or the nginx container. `apps/web/src/server.ts`
  (paraglide middleware) is used for dev/prerender only.
- **i18n via Paraglide.** Base locale `en`, locales `en zh de es fr`. Browser URLs
  are **always locale-prefixed** (`/zh/nat-types`); the unprefixed `/` is a static
  browser-language redirector (`apps/web/public/index.html`), not a route. The
  router rewrite in `apps/web/src/router.tsx` de-localizes incoming URLs and
  localizes outgoing ones, so **route paths are written canonical and unprefixed**
  (`createFileRoute("/nat-types")`).
- **Messages** live per locale in `apps/web/messages/{locale}.json` (flat,
  prefixed keys such as `uiStrings_appTitle`, `natTypes_CONE_NAT_definition`).
  Use them as `m.uiStrings_appTitle()` from `@/paraglide/messages.js`; helpers
  for dynamic lookups are in `apps/web/src/lib/i18n.ts`. All five locale files
  must stay in sync.
- **Open Graph images** are generated at build time by
  `apps/web/scripts/generate-og.mjs` (satori + resvg) into
  `apps/web/public/og/<locale>[-<page>].png` (gitignored). `pnpm build` runs
  it automatically; `pnpm --filter web og` runs it alone. Add a page to its
  `PAGES` list when a new route needs its own card; `buildPageHead` derives the
  image URL from the path.
- **Detection domain rules:** detection is entirely client-side against public
  STUN servers (`packages/nat-detection/src/stun-servers.ts`). Browsers cannot
  observe filtering behavior, so only mapping behavior is reported — cone
  subtypes (Full / Restricted / Port-Restricted) must never be claimed.

## Environment variables

| Variable        | Where           | Purpose                                                                                                                                                                                                    |
| --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL` | Build-time only | Canonical URLs, hreflang alternates, JSON-LD, sitemap host, robots.txt. Baked into prerendered HTML — it must be set when building for a real domain (build arg for Docker, env var for Cloudflare Pages). |

`VITE_SITE_URL` falls back to the production domain `https://nat-checker.kkcloud.org`
in `apps/web/vite.config.ts`, `apps/web/src/lib/site-config.ts` and
`apps/web/scripts/generate-og.mjs` — keep the three in sync if the domain
changes.

## Conventions

### Styling (important)

Tailwind CSS 4 with shadcn design tokens from
`packages/ui/src/styles/globals.css`:

- ALWAYS use CSS variable tokens (`bg-background`, `text-foreground`,
  `border-border`, `bg-primary`, `text-muted-foreground`, `border-destructive`,
  `bg-card`, `bg-popover`, `text-accent`, `bg-secondary`).
- NEVER hardcode colors (`bg-white`, `text-black`, `bg-[#ffffff]`, `bg-red-500`).
- Use radius tokens: `rounded-sm|md|lg|xl`, not arbitrary values like `rounded-[8px]`.
- Dark mode works through the `.dark` class and the same CSS variables — never
  write `dark:` color overrides that bypass tokens.
- Charts use `--chart-1` … `--chart-5`; sidebars use the `--sidebar-*` tokens.

Rationale: theme consistency, runtime theme switching, and correct dark mode.

### Code style

- Prettier: no semicolons, double quotes, 2-space indent, 80 columns, ES5 trailing
  commas; Tailwind classes are sorted by `prettier-plugin-tailwindcss` (classes in
  `cn()` / `cva()` are included).
- TypeScript strict, `verbatimModuleSyntax` (use `import type`), `noUnusedLocals`,
  `noUncheckedIndexedAccess`.
- Import aliases: `@/*` → `apps/web/src/*`, `@workspace/ui/*` →
  `packages/ui/src/*`, `@workspace/nat-detection` → engine entry.
- Shared UI comes from `@workspace/ui/components/*`, `@workspace/ui/lib/utils`
  (`cn`), never from `apps/web/src/components` — that directory is for app-specific
  composition only.

## Recipes

### Add a page

1. Create `apps/web/src/routes/<name>.tsx` exporting
   `export const Route = createFileRoute("/<name>")({ head: () => buildPageHead({ path: `/${getLocale()}/<name>` }), component: … })`
   (see `apps/web/src/routes/nat-types.tsx`; `head` drives title/meta/JSON-LD via
   `apps/web/src/lib/seo.ts`).
2. Add the localized path to the `pages` array in `apps/web/vite.config.ts`,
   otherwise the route is not prerendered and will 404 on the static host.
3. Add its messages to all five locale files.

`apps/web/src/routeTree.gen.ts` is regenerated by the TanStack router plugin on
dev/build — never edit it by hand.

### Add or change a UI component

Run the shadcn CLI in `packages/ui` so components land where the aliases expect
them (`base-vega` style, Hugeicons, `neutral` base color):

```bash
cd packages/ui && pnpm dlx shadcn@latest add <component>
```

Import as `@workspace/ui/components/<component>`.

### Add a locale

Three places must agree: `apps/web/messages/<locale>.json`,
`apps/web/project.inlang/settings.json` (`locales`), and the `LOCALES` array in
`apps/web/vite.config.ts`.

### Add a workspace package

Add it to the pnpm workspace (`packages/*` / `apps/*` is already covered) **and**
extend the `Dockerfile`: `package.json` in the `deps` stage COPY list plus its
`node_modules` in the `builder` stage. `pnpm install --frozen-lockfile` does _not_
complain about a missing manifest, so the build runs
`scripts/check-workspace-install.mjs` and stops with a clear error instead.

## Container / deployment notes

- The Docker runtime stage is `nginx:alpine` serving `apps/web/dist/client`; there
  is no Node process in production. Port `5173` is set in `nginx.conf`, not in a
  script or env var.
- Hugeicons are imported **per icon** (`import GlobeIcon from
"@hugeicons/core-free-icons/GlobeIcon"`), never from the package barrel. The
  barrel (`dist/esm/index.js`) re-exports six files with the wrong case
  (`Grid2x2Icon.js` vs the real `Grid2X2Icon.js`); macOS tolerates it, Linux does
  not, so Docker, Cloudflare Pages and CI fail as soon as the barrel is imported.
  Some barrel names are aliases — check `dist/esm/index.js` for the real file
  (e.g. `VideoIcon` → `Video01Icon`, `LayersIcon` → `Layers01Icon`).
- `.dockerignore` patterns use `**/` prefixes on purpose: a bare `node_modules`
  only matches the repository root, so per-package `node_modules`, `dist` and
  `.turbo` caches of the host would otherwise be copied into the image.

## Never edit generated files

- `apps/web/src/routeTree.gen.ts` (TanStack router plugin)
- `apps/web/src/paraglide/**` (Paraglide output, gitignored, regenerated by
  `pnpm typecheck` and `pnpm build`)
- `apps/web/dist/**` (build output)

## Testing

Only `packages/nat-detection` has a test suite (vitest, node environment,
`src/**/*.test.ts` colocated with the source). There is no browser/e2e suite for
`apps/web`; verify UI changes by running `pnpm dev` and exercising the page.
