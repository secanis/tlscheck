---
title: Configuration
description: Environment variables and configuration options
---

## Environment Variables

The API service can be configured using the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `::` | Host to bind to (supports IPv6) |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `REQUEST_TIMEOUT_MS` | `8000` | Timeout for certificate fetch requests |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX` | `30` | Maximum requests per rate limit window |
| `MAX_BODY_BYTES` | `4096` | Maximum request body size |
| `REVOCATION_MODE` | `ocsp` | Revocation check mode: `ocsp`, `crl`, or `off` |
| `CACHE_TTL_MS` | `1800000` | Cache TTL in milliseconds (default: 30 minutes) |
| `APP_VERSION` | `dev` | Application version string |
| `METRICS_ENABLED` | `false` | Enable Prometheus metrics endpoint at /metrics |

## Running from Source

### Development Mode

```bash
npm run start:api:ts
```

### Production Build

```bash
npm run build:api
npm run start:api
```

## Configuration Example

```bash
# Set custom port and enable verbose logging
export PORT=8080
export LOG_LEVEL=debug

# Configure caching (10 minutes)
export CACHE_TTL_MS=600000

# Disable revocation checks
export REVOCATION_MODE=off

# Run the API
npm run start:api
```

## API Configuration Endpoint

The API exposes a public configuration endpoint at `GET /api/config` that returns:

```json
{
  "cacheTtlMs": 1800000,
  "revocationMode": "ocsp"
}
```

This endpoint is used by the extension to fetch cache settings and revocation mode.

## Metrics Endpoint

See [Metrics Configuration](https://tlscheck.net/metrics/)