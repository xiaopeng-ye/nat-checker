# NAT Type Checker

A browser-based NAT (Network Address Translation) type detection tool built on
WebRTC and public STUN servers. It helps users understand their network
configuration and its impact on peer-to-peer connectivity — games, video calls,
file sharing and remote access.

Detection runs entirely in the visitor's browser. Nothing is sent to a project
server, and the site is deployed as static files.

## Features

- **Client-Side Detection**: WebRTC ICE gathering against several public STUN servers, no backend required
- **Mapping-Behavior Analysis**: Distinguishes endpoint-independent (cone) from endpoint-dependent (symmetric) NAT mapping, following RFC 4787 terminology
- **Honest Confidence Levels**: Reports `high` / `low` confidence with a machine-readable reason instead of guessing when too few servers answer
- **Multi-Interface Aware**: Wi-Fi + VPN or dual-stack hosts are not mistaken for a symmetric NAT
- **CGNAT Detection**: Flags carrier-grade NAT (RFC 6598 `100.64.0.0/10`) addresses
- **Multilingual Support**: English, Chinese, German, Spanish and French with URL-prefixed locales
- **Educational Content**: Explains every NAT type and its impact on common applications
- **Dark Mode Support**: Theme switcher with CSS variable-based theming
- **SEO Optimized**: Prerendered HTML, structured data, hreflang alternates, sitemap and robots.txt

## Tech Stack

- **Framework**: TanStack Start + TanStack Router (file-based routing, static prerendering)
- **Language**: TypeScript (strict mode)
- **UI**: React 19, shadcn/ui (Base UI primitives, Hugeicons), Tailwind CSS 4
- **i18n**: Paraglide JS (compile-time-typed messages)
- **Network**: WebRTC ICE / STUN (native browser APIs)
- **Testing**: vitest
- **Build Tool**: Vite
- **Monorepo**: Turborepo + pnpm workspaces
- **Runtime**: Node.js 20+ (build time only)

## Getting Started

### Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

### Production Build

```bash
pnpm build
```

The output in `apps/web/dist/client` is a complete static site: every localized
page is prerendered to HTML, plus `sitemap.xml` and `robots.txt`. Set
`VITE_SITE_URL` at build time so canonical URLs, hreflang alternates and the
sitemap point at your domain (see [DEPLOYMENT.md](./DEPLOYMENT.md) for
Cloudflare Pages settings).

### Docker

Build and run with Docker Compose (serves the static site with nginx on
[http://localhost:5173](http://localhost:5173)):

```bash
docker compose up -d --build
```

Or use Docker directly:

```bash
docker build --build-arg VITE_SITE_URL=https://nat-checker.kkcloud.org -t nat-checker .
docker run -p 5173:5173 nat-checker
```

## Project Structure

```
apps/web/                       # TanStack Start app
  ├── messages/                 # Paraglide message catalogs, one file per locale
  ├── public/                   # "/" locale redirector, 404 page, icons
  ├── src/
  │   ├── components/           # nat-checker UI, magicui effects, language/theme switchers
  │   ├── hooks/                # useNATDetection (React wrapper around the engine)
  │   ├── lib/                  # site config, i18n helpers, SEO, impact ratings
  │   ├── routes/               # __root, index (home), nat-types
  │   ├── router.tsx            # URL rewrite: canonical paths ⇄ localized URLs
  │   └── paraglide/            # generated (gitignored)
  └── vite.config.ts            # paraglide + prerender + sitemap + robots generation
packages/nat-detection/         # @workspace/nat-detection — detection engine (pure TS)
  └── src/
      ├── detector.ts           # detectNAT(): two-phase STUN mapping test
      ├── classifier.ts         # classifyNAT(): observations → NAT type
      ├── stun-servers.ts       # default public STUN servers
      ├── types.ts              # NATType, DetectionResult, …
      └── *.test.ts             # vitest suite
packages/ui/                    # @workspace/ui — shadcn/ui components + design tokens
```

## How It Works

### Two independent properties

Classic NAT names mix two independent properties:

- **Mapping behavior** — does the same local socket get the same external
  `IP:port` for every destination? This separates **Cone NAT** from
  **Symmetric NAT** and is what this tool measures.
- **Filtering behavior** — who may send packets back? This splits Cone NAT into
  **Full**, **Restricted** and **Port-Restricted** Cone, and cannot be observed
  from a browser: it requires receiving unsolicited UDP from a host the socket
  never contacted, which WebRTC never surfaces to JavaScript.

WebRTC only exposes server-reflexive (srflx) ICE candidates — the external
`IP:port` a STUN server saw — so the tool reports the mapping verdict and never
claims a cone subtype.

### Detection Flow

1. **Probe** — one `RTCPeerConnection` per STUN server, in parallel. Records
   which servers answer and how many distinct mappings a single server produces
   (= the number of active local sockets, e.g. Wi-Fi + VPN).
2. **Mapping test** — one `RTCPeerConnection` configured with every reachable
   server, so each local socket queries all of them.
   - distinct mappings ≤ socket count → endpoint-independent (**Cone NAT**)
   - distinct mappings > socket count → endpoint-dependent (**Symmetric NAT**)
3. **Classification** — combines the mapping verdict with the host candidate
   (public vs private vs mDNS-obfuscated address) and the confidence level.

```
Browser → STUN probes → combined mapping test → classification → result
```

### NAT Types

The result is one of the first five; the three cone subtypes are described on
the `/nat-types` page for reference only.

| Type                           | Reported | Description                                                                                                                                                                                                              |
| ------------------------------ | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No NAT (Direct Connection)** |   yes    | Your device has a public IP address and is directly connected to the internet without any NAT translation. Best possible connectivity, but the device is exposed to direct internet access.                              |
| **Cone NAT**                   |   yes    | Endpoint-independent mapping: the same local socket keeps the same external `IP:port` for every destination. Good for P2P. Full, Restricted and Port-Restricted Cone are its filtering subtypes.                         |
| **Symmetric NAT**              |   yes    | The most restrictive NAT type. Creates a unique mapping for each destination `IP:port`. External hosts cannot predict the public port, making P2P very difficult without relay servers.                                  |
| **Multiple NAT Layers**        |   yes    | Two NAT devices, typically a home router behind the ISP's carrier-grade NAT (CGNAT, RFC 6598). Each layer translates independently and only the inner one can be configured; port forwarding, UPnP and DMZ stop working. |
| **Undetermined**               |   yes    | Fewer than two STUN servers answered, so the mapping behavior could not be compared across destinations. Try again, or switch networks if outbound UDP is restricted.                                                    |
| **Full Cone NAT**              |    no    | The most permissive cone subtype. Once an internal address is mapped, any external host can send packets to that mapping. Easiest P2P connectivity.                                                                      |
| **Restricted Cone NAT**        |    no    | Once an internal address sends data to an external IP, that IP (from any port) can send data back. More restrictive than Full Cone but still good for P2P.                                                               |
| **Port-Restricted Cone NAT**   |    no    | The most common type on home routers. Return traffic is only accepted from the exact `IP:port` the internal host contacted first. Hole punching still works via a signaling server.                                      |

## Commands

- `pnpm dev` - Start the development server
- `pnpm build` - Build the static site
- `pnpm typecheck` - Compile Paraglide messages and run `tsc` (all packages)
- `pnpm lint` - Run ESLint (all packages)
- `pnpm test` - Run the vitest suite (`packages/nat-detection`)
- `pnpm format` - Run Prettier

## License

MIT
