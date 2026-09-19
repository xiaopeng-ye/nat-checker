# Production image for NAT Checker.
#
# `apps/web` prerenders every localized page at build time (see
# apps/web/vite.config.ts → tanstackStart({ prerender: { enabled: true } })),
# so apps/web/dist/client is a complete static site and the runtime stage is
# plain nginx — no Node.js process runs in production.

# ---------------------------------------------------------------------------
# Stage 1: workspace dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm resolves the lockfile against the workspace layout, so every workspace
# package manifest has to be present before installing, and patchedDependencies
# patches are applied during install. Keeping this in its own layer keeps
# dependencies cached across source changes. A new package under apps/ or
# packages/ has to be added here *and* to the node_modules copies below; missing
# it does not fail the install, but stops the build at
# scripts/check-workspace-install.mjs.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/nat-detection/package.json packages/nat-detection/

RUN corepack enable && pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: static build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# pnpm keeps a per-package node_modules symlink tree; every workspace package
# installed in the deps stage has to be copied over (see
# scripts/check-workspace-install.mjs, which fails the build when one is missing).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/nat-detection/node_modules ./packages/nat-detection/node_modules

COPY . .

# Fails fast if a workspace manifest was missing from the deps stage: pnpm
# accepts a stale manifest list silently and the mistake would otherwise only
# surface later as a confusing module-resolution error.
RUN node scripts/check-workspace-install.mjs

# Build-time input, not a runtime one: this is baked into the prerendered HTML
# (canonical URLs, hreflang alternates, JSON-LD), sitemap.xml and robots.txt.
# Empty/unset falls back to https://nat-checker.kkcloud.org.
ARG VITE_SITE_URL
ENV VITE_SITE_URL=${VITE_SITE_URL}

ENV NODE_ENV=production
RUN corepack enable && pnpm build

# ---------------------------------------------------------------------------
# Stage 3: static runtime
# ---------------------------------------------------------------------------
# Nginx serves the prerendered site. `pnpm build` also emits an SSR entry
# (apps/web/dist/server) which a remote runtime could use instead; it is not
# needed for this image.
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist/client /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1
