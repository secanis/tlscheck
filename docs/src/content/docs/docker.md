---
title: Container
description: Running TLSCheck with Docker or Podman
---

## Quick Start

```bash
podman run --rm -p 3000:3000 tlscheck/api
```

## Recommended: Read-Only Container

For enhanced security, run the container with a read-only filesystem:

```bash
podman run --read-only --tmpfs /tmp --rm -p 3000:3000 tlscheck/api
```

This prevents any writes to the container filesystem, with `/tmp` mounted as a tmpfs.

## Building the Image

```bash
podman build -t tlscheck/api .
```

## Environment Variables

Pass environment variables using `-e`:

```bash
podman run --rm -e PORT=8080 -e LOG_LEVEL=debug -p 8080:3000 tlscheck/api
```

See [Configuration](/configuration/) for all available options.

## Volume Mounts

No volumes are required. The container is self-contained.

## Health Check

The image includes a built-in health check:

```bash
podman run --rm -p 3000:3000 tlscheck/api
# Check health
curl http://localhost:3000/health
```

## Security Features

The container runs as a non-root user by default:

- User: `app` (UID 1001)
- Group: `appgroup` (GID 1001)

## Docker Compose Example

```yaml
version: '3.8'

services:
  tlscheck:
    image: tlscheck/api
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - LOG_LEVEL=info
      - CACHE_TTL_MS=1800000
      - REVOCATION_MODE=ocsp
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:size=64m
    restart: unless-stopped
```

## Production Deployment

For production, consider:

1. **Use a reverse proxy** (nginx, Caddy, traefik)
2. **Enable HTTPS** for the API
3. **Set appropriate `CACHE_TTL_MS`** for your traffic
4. **Monitor logs** via `LOG_LEVEL=info` (default)
5. **Configure rate limiting** via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`
