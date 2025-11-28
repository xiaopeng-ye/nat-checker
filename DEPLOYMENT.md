# NAT Checker - Deployment Guide

## 🚀 Quick Start

### Development
```bash
# Install dependencies
pnpm install

# Run custom server (Next.js + STUN integrated)
pnpm dev
```

Visit http://localhost:3000

> **Architecture**: Uses Next.js Custom Server to integrate HTTP and UDP services in a single process.

### Production (Docker)
```bash
# Build and start
pnpm docker:build
pnpm docker:up

# View logs
pnpm docker:logs

# Stop
pnpm docker:down
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start custom server (Next.js + STUN integrated) |
| `pnpm dev:nextonly` | Start Next.js dev server only (no STUN) |
| `pnpm dev:stun` | Start STUN servers only (testing) |
| `pnpm build` | Build Next.js + compile STUN server |
| `pnpm start` | Start custom server in production mode |
| `pnpm docker:build` | Build Docker image |
| `pnpm docker:up` | Start Docker container |
| `pnpm docker:down` | Stop Docker container |
| `pnpm docker:logs` | View container logs |

## 🔧 Configuration

### Ports
- **3000** - Next.js HTTP server
- **3478** - STUN primary server (UDP)
- **3479** - STUN secondary server (UDP)
- **3480** - STUN tertiary server (UDP)

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

## 🐳 Docker Deployment

### Single Command Deploy
```bash
docker-compose up -d
```

### Manual Docker Build
```bash
# Build
docker build -t nat-checker .

# Run
docker run -d \
  -p 3000:3000 \
  -p 3478:3478/udp \
  -p 3479:3479/udp \
  -p 3480:3480/udp \
  --name nat-checker \
  nat-checker
```

### Health Check
```bash
# Check if container is running
docker ps | grep nat-checker

# Test HTTP endpoint
curl http://localhost:3000

# Test API endpoint
curl http://localhost:3000/api/nat-detect/advanced
```

## 🌐 Network Setup

### Firewall Configuration

**Linux (ufw)**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3478:3480/udp
```

**Linux (iptables)**
```bash
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 3478:3480 -j ACCEPT
```

**Docker Host**
Ensure Docker has permission to bind to these ports.

### Port Forwarding (if behind router)
Forward the following ports from your router to the Docker host:
- TCP 3000 → Server IP:3000
- UDP 3478-3480 → Server IP:3478-3480

## 📊 Monitoring

### Container Logs
```bash
# Follow all logs
docker-compose logs -f

# STUN server logs only
docker-compose logs -f | grep STUN

# Next.js logs only
docker-compose logs -f | grep Next
```

### Health Status
```bash
# Check container health
docker inspect nat-checker | jq '.[0].State.Health'

# Test STUN servers (requires stun-client)
stun <your-server-ip> 3478
```

## 🔍 Troubleshooting

### Issue: Advanced Detection Not Working

**Symptoms**:
- "Advanced Detection" button not visible
- API returns 404 or 500

**Solutions**:
1. Check STUN server is running:
   ```bash
   docker-compose logs | grep "STUN"
   ```

2. Verify API endpoint:
   ```bash
   curl http://localhost:3000/api/nat-detect/advanced
   ```

3. Check firewall rules allow UDP 3478-3480

4. Restart services:
   ```bash
   pnpm docker:down && pnpm docker:up
   ```

### Issue: Container Won't Start

**Symptoms**:
- Container exits immediately
- `docker ps` shows no running container

**Solutions**:
1. Check logs for errors:
   ```bash
   docker-compose logs nat-checker
   ```

2. Verify port availability:
   ```bash
   lsof -i :3000
   lsof -i :3478-3480
   ```

3. Remove old containers:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Issue: UDP Ports Not Accessible

**Symptoms**:
- STUN server starts but clients can't connect
- No response from UDP ports

**Solutions**:
1. Check if ports are listening:
   ```bash
   netstat -ulnp | grep 347
   ```

2. Test UDP connectivity:
   ```bash
   nc -u localhost 3478
   ```

3. Check Docker network mode:
   ```bash
   docker inspect nat-checker | jq '.[0].NetworkSettings'
   ```

## 📦 Production Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Firewall rules applied
- [ ] Ports 3000, 3478-3480 accessible
- [ ] Docker compose configured
- [ ] Health check endpoint working
- [ ] Logs rotation configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

## 🔒 Security Considerations

1. **Firewall**: Only expose necessary ports
2. **Updates**: Keep dependencies up to date
3. **Logs**: Monitor for unusual activity
4. **Rate Limiting**: Consider adding rate limits to API
5. **SSL/TLS**: Use reverse proxy (nginx/caddy) for HTTPS

## 📚 Additional Resources

- [RFC 5780 - NAT Behavior Discovery](https://datatracker.ietf.org/doc/html/rfc5780)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [STUN Protocol](https://datatracker.ietf.org/doc/html/rfc5389)

## 🆘 Support

For detailed documentation, see:
- [README.docker.md](./README.docker.md) - Complete Docker guide
- [CLAUDE.md](./CLAUDE.md) - Development guidelines
