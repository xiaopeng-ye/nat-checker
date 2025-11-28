# NAT Checker - Docker Deployment Guide

## Overview

NAT Checker is a client-side NAT type detection tool using WebRTC STUN protocol. This Docker image includes:

- **Next.js web interface** (HTTP port 3000)
- **Integrated STUN servers** (UDP ports 3478-3480) for RFC 5780 NAT detection
- **Multi-architecture support** (linux/amd64, linux/arm64)

## Quick Start

### Pull and Run

```bash
# Pull the latest image
docker pull yourusername/nat-checker:latest

# Run with all required ports
docker run -d \
  --name nat-checker \
  -p 3000:3000 \
  -p 3478:3478/udp \
  -p 3479:3479/udp \
  -p 3480:3480/udp \
  yourusername/nat-checker:latest
```

### Access the Application

- **Web Interface**: http://localhost:3000
- **STUN Servers**: Available on localhost:3478-3480 (UDP)

## Features

### Basic Detection (WebRTC)
- ✅ Symmetric NAT detection
- ✅ Cone NAT detection (generic)
- ✅ No server required
- ⚠️ Cannot distinguish Cone NAT subtypes

### Advanced Detection (RFC 5780 Server-Side)
- ✅ **Full Cone NAT** - Most permissive
- ✅ **Restricted Cone NAT** - IP-level filtering
- ✅ **Port-Restricted Cone NAT** - IP+Port filtering
- ✅ **Symmetric NAT** - Per-destination mapping
- ✅ Server-side STUN implementation
- ✅ Precise classification

## Architecture

```
┌───────────────────────────────────────────┐
│         Docker Container                  │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │   Custom Server (server-custom.js)   │ │
│  │                                      │ │
│  │   ┌──────────┐   ┌──────────────┐   │ │
│  │   │ Next.js  │   │ STUN Servers │   │ │
│  │   │ :3000    │   │ :3478-3480   │   │ │
│  │   │ (HTTP)   │   │   (UDP)      │   │ │
│  │   └──────────┘   └──────────────┘   │ │
│  │                                      │ │
│  │   Single Node.js Process             │ │
│  └──────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

**Using Next.js Custom Server**
- Single process architecture
- No `output: "standalone"` mode
- Direct integration with STUN servers
- Reference: [Next.js Custom Server Docs](https://nextjs.org/docs/app/guides/custom-server)

> **Note**: Custom servers remove some Next.js optimizations like Automatic Static Optimization. Only use when the integrated router cannot meet your requirements.

## Development Mode

For local development, see the main README.md file. Here's a quick summary:

### Prerequisites
- Node.js 20+
- pnpm
- UDP ports 3478-3480 available

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Development Mode

**Run custom server (includes Next.js + STUN)**
```bash
pnpm dev
```
This starts the custom server which integrates:
- Next.js dev server on http://localhost:3000
- STUN servers on UDP ports 3478-3480

### 3. Production Build & Test
```bash
# Build the application and compile STUN server
pnpm build

# Run production custom server
pnpm start
```

## Docker Deployment

### Port Configuration

| Port | Protocol | Purpose | Description |
|------|---------|---------|-------------|
| 3000 | HTTP | Web Interface | Next.js application |
| 3478 | UDP | STUN Server 1 | Primary STUN server |
| 3479 | UDP | STUN Server 2 | Secondary STUN server |
| 3480 | UDP | STUN Server 3 | Tertiary STUN server |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | HTTP port for Next.js |
| `HOSTNAME` | `0.0.0.0` | Bind address |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disable Next.js telemetry |

### Docker Compose

#### Basic Configuration

```yaml
services:
  nat-checker:
    image: yourusername/nat-checker:latest
    container_name: nat-checker
    restart: unless-stopped
    ports:
      - "3000:3000"       # HTTP
      - "3478:3478/udp"   # STUN Server 1
      - "3479:3479/udp"   # STUN Server 2
      - "3480:3480/udp"   # STUN Server 3
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

#### Production Configuration

```yaml
version: '3.8'

services:
  nat-checker:
    image: yourusername/nat-checker:latest
    container_name: nat-checker
    restart: unless-stopped
    ports:
      - "3000:3000"       # HTTP
      - "3478:3478/udp"   # STUN Server 1
      - "3479:3479/udp"   # STUN Server 2
      - "3480:3480/udp"   # STUN Server 3
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - NEXT_TELEMETRY_DISABLED=1
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    networks:
      - nat-checker-network

networks:
  nat-checker-network:
    driver: bridge
```

## Usage

### Basic Detection (Default)
1. Open http://localhost:3000
2. Detection starts automatically
3. Result shows: Symmetric NAT or Cone NAT

### Advanced Detection
1. After basic detection completes
2. Click **"Advanced Detection"** button
3. Server performs RFC 5780 test sequence
4. Result shows precise NAT type:
   - Full Cone NAT
   - Restricted Cone NAT
   - Port-Restricted Cone NAT
   - Symmetric NAT

## Network Requirements

### Firewall Rules
Allow **inbound UDP** traffic on ports 3478-3480:

```bash
# Linux (ufw)
sudo ufw allow 3478:3480/udp

# Linux (iptables)
sudo iptables -A INPUT -p udp --dport 3478:3480 -j ACCEPT
```

### Docker Network
The STUN servers need to bind to the host's network interface:

```yaml
# docker-compose.yml
ports:
  - "3478:3478/udp"
  - "3479:3479/udp"
  - "3480:3480/udp"
```

### Port Forwarding (if behind NAT)
If your server is behind NAT, forward UDP ports to the container:
- Router: Forward UDP 3478-3480 → Server IP
- Server: Bind ports to 0.0.0.0

## Testing

### Test STUN Server
```bash
# Install stun-client (optional)
npm install -g stun

# Test primary STUN server
stun localhost 3478
```

### Test Advanced Detection API
```bash
curl http://localhost:3000/api/nat-detect/advanced
```

Expected response:
```json
{
  "service": "Advanced NAT Detection",
  "version": "1.0.0",
  "capabilities": ["RFC 5780 subset", "Precise Cone NAT classification"],
  "stunServers": [
    { "port": 3478, "name": "Primary" },
    { "port": 3479, "name": "Secondary" },
    { "port": 3480, "name": "Tertiary" }
  ]
}
```

## Troubleshooting

### Advanced Detection Not Available
**Symptom**: "Advanced Detection" button not shown

**Causes**:
1. STUN server not running
2. API endpoint unreachable
3. Client blocked by CORS

**Fix**:
```bash
# Check STUN server logs
pnpm docker:logs | grep STUN

# Verify API is accessible
curl http://localhost:3000/api/nat-detect/advanced

# Restart services
pnpm docker:down && pnpm docker:up
```

### UDP Ports Blocked
**Symptom**: STUN servers start but clients cannot connect

**Fix**:
```bash
# Check if ports are listening
netstat -ulnp | grep 347

# Check firewall
sudo ufw status
sudo iptables -L -n | grep 347
```

### Docker Container Won't Start
**Symptom**: Container exits immediately

**Fix**:
```bash
# View detailed logs
docker-compose logs nat-checker

# Check for port conflicts
lsof -i :3000
lsof -i :3478-3480
```

## API Reference

### GET /api/nat-detect/advanced
Get server information

**Response**:
```typescript
{
  service: string;
  version: string;
  capabilities: string[];
  stunServers: Array<{ port: number; name: string }>;
}
```

### POST /api/nat-detect/advanced
Perform advanced NAT detection

**Request**:
```typescript
{
  publicIP: string;    // From basic WebRTC detection
  publicPort: number;  // From basic WebRTC detection
  localIP: string;     // From basic WebRTC detection
}
```

**Response**:
```typescript
{
  success: boolean;
  natType?: NATType;
  confidence: "high" | "low";
  confidenceReason: string;
  tests: {
    test1: { passed: boolean; description: string };
    test2: { passed: boolean; description: string };
    test3: { passed: boolean; description: string };
    test4: { passed: boolean; description: string };
  };
  error?: string;
}
```

## Technology Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Node.js dgram** - UDP server implementation
- **Docker** - Containerization
- **shadcn/ui** - UI components
- **Tailwind CSS 4** - Styling

## RFC 5780 Implementation

Our implementation follows [RFC 5780](https://datatracker.ietf.org/doc/html/rfc5780) NAT Behavior Discovery:

### Test Sequence

1. **Test I: Basic Binding**
   - Get external IP:port mapping

2. **Test II: Full Cone Detection**
   - Send from different server IP:port
   - If received → Full Cone NAT

3. **Test III: Restricted Cone Detection**
   - Send from same IP, different port
   - If received → Restricted Cone NAT
   - If not → Port-Restricted Cone NAT

4. **Test IV: Symmetric Detection**
   - Compare ports across servers
   - If different → Symmetric NAT

### Limitations

- Cannot test CHANGE-IP (requires multiple IPs)
- Simplified packet injection
- Browser WebRTC API constraints

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [your-repo/issues]
- Documentation: [your-docs-url]
