# NAT Type Checker

A hybrid NAT (Network Address Translation) type detection tool using WebRTC and RFC 5780 STUN protocol. This tool helps users understand their network configuration and its impact on peer-to-peer connectivity.

## Features

- **Hybrid Detection**: Combines client-side WebRTC with server-side RFC 5780 tests for precise NAT classification
- **Advanced NAT Tests**: Implements RFC 5780 test sequence (Binding, Full Cone, Restricted Cone, Symmetric detection)
- **Custom STUN Server**: Includes UDP-based STUN server implementation for advanced detection
- **Multilingual Support**: Available in English, Chinese, German, Spanish, and French
- **Educational Content**: Provides detailed explanations of NAT types and their impact
- **Dark Mode Support**: Theme switcher with CSS variable-based theming
- **SEO Optimized**: Includes structured data, sitemap, and robots.txt

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript 5+ (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Network**: WebRTC (client-side), UDP STUN Server (server-side)
- **Detection Protocol**: RFC 5780 (NAT Behavior Discovery Using STUN)
- **Build Tool**: Turbopack
- **Package Manager**: pnpm 10+
- **Runtime**: Node.js 20+ LTS

## Getting Started

### Development

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

Build the application:

```bash
pnpm build
```

Note: This application requires a Node.js server for the NAT detection API and STUN server. For static hosting, advanced detection features will not be available.

### Docker

Build and run with Docker:

```bash
docker-compose up --build
```

Or use Docker directly:

```bash
docker build -t nat-checker .
docker run -p 8080:80 nat-checker
```

## Project Structure

```
app/                    # Next.js App Router pages and layouts
  ├── api/
  │   └── nat-detect/
  │       └── advanced/# Server-side NAT detection API (RFC 5780)
components/             # React components
  ├── nat-checker/     # NAT detection components
  ├── ui/              # shadcn/ui components
  └── theme-*.tsx      # Theme switching components
lib/                   # Core logic and utilities
  ├── nat-detection/   # WebRTC detection & classification
  └── i18n/            # Internationalization
server/                # Backend services
  └── stun-server.ts   # UDP STUN server implementation (RFC 5780)
specs/                 # Project specifications and documentation
```

## How It Works

### Detection Architecture

NAT Checker uses a hybrid approach combining client-side and server-side detection:

1. **Client-Side (WebRTC)**:
   - Establishes peer connection using STUN servers
   - Retrieves public IP address and port mapping
   - Provides basic connectivity information

2. **Server-Side (RFC 5780)**:
   - Runs custom UDP STUN servers on ports 3478, 3479, 3480
   - Performs advanced test sequence:
     - **Test I**: Basic binding (external IP:port mapping)
     - **Test II**: Full Cone detection (response from different IP:port)
     - **Test III**: Restricted Cone detection (response from different port)
     - **Test IV**: Symmetric NAT detection (port consistency check)
   - Classifies NAT type with high confidence

3. **Detection Flow**:
   ```
   Client → WebRTC Detection → API Call → Server Tests → Classification → Result
   ```

### NAT Types Detected

- **Full Cone NAT**: Unrestricted filtering, best for P2P
- **Restricted Cone NAT**: IP-level filtering
- **Port-Restricted Cone NAT**: IP+Port filtering (most common)
- **Symmetric NAT**: Different mapping per destination, challenging for P2P

## Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run Biome linter
- `pnpm test` - Run tests

## License

MIT
