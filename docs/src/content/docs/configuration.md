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
| `METRICS_ENABLED` | `false` | Enable metrics endpoint |
| `METRICS_API_KEY` | - | API key required to access metrics endpoint |

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

The API exposes a metrics endpoint at `GET /api/metrics` when enabled.

### Enabling Metrics

```bash
export METRICS_ENABLED=true
export METRICS_API_KEY=your-secret-key
```

### Accessing Metrics

```bash
curl -H "X-API-Key: your-secret-key" http://localhost:3000/metrics
```

### Response Example

```json
{
  "totalRequests": 150,
  "successfulRequests": 145,
  "failedRequests": 5,
  "cacheHits": 80,
  "cacheMisses": 70,
  "cacheHitRate": 53.33,
  "revocationChecks": 70,
  "revocationGood": 65,
  "revocationRevoked": 3,
  "revocationErrors": 1,
  "revocationUnsupported": 1,
  "revocationGoodRate": 92.86,
  "revocationRevokedRate": 4.29,
  "averageResponseTimeMs": 245,
  "uptimeSeconds": 3600,
  "startedAt": "2026-03-04T12:00:00.000Z",
  "requestsByStatus": {
    "200": 145,
    "502": 5
  },
  "requestsByError": {
    "certificate_fetch_error": 5
  }
}
```

### Metrics Description

| Metric | Description |
|--------|-------------|
| `totalRequests` | Total number of requests |
| `successfulRequests` | Requests that returned 200 OK |
| `failedRequests` | Requests that returned errors |
| `cacheHits` | Requests served from cache |
| `cacheMisses` | Requests that required new certificate fetch |
| `cacheHitRate` | Percentage of requests served from cache |
| `revocationChecks` | Total revocation checks performed |
| `revocationGood` | Certificates with "good" revocation status |
| `revocationRevoked` | Certificates marked as revoked |
| `revocationErrors` | Revocation check errors |
| `revocationUnsupported` | Certificates without revocation info |
| `averageResponseTimeMs` | Average response time in milliseconds |
| `uptimeSeconds` | Time since API started |
| `requestsByStatus` | Requests grouped by HTTP status code |
| `requestsByError` | Failed requests grouped by error type |
