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

The API exposes a Prometheus-compatible metrics endpoint at `GET /metrics` when enabled.

### Enabling Metrics

```bash
export METRICS_ENABLED=true
```

### Accessing Metrics

```bash
curl http://localhost:3000/metrics
```

### Prometheus Format

The endpoint returns metrics in Prometheus text format. Both default Node.js/fastify metrics and custom application metrics are exposed.

### Custom Application Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `tls_check_total` | Counter | `status`, `valid` | Total TLS/SSL certificate checks performed |
| `tls_check_duration_seconds_total` | Counter | - | Total time spent performing TLS checks |
| `revocation_check_total` | Counter | `status`, `source` | Total revocation checks performed |
| `http_response_status_total` | Counter | `status_code`, `route` | HTTP responses by status code and route |

#### Labels

- **tls_check_total**: `status` (success/error), `valid` (true/false)
- **revocation_check_total**: `status` (good/revoked/unknown/error), `source` (ocsp/crl)
- **http_response_status_total**: `status_code` (200/400/429/502), `route` (/api/check)

### Default Metrics

fastify-metrics also exposes standard Node.js and Fastify metrics:

| Metric | Description |
|--------|-------------|
| `process_cpu_seconds_total` | CPU time spent |
| `process_resident_memory_bytes` | Memory usage |
| `nodejs_eventloop_lag_seconds` | Event loop lag |
| `nodejs_gc_duration_seconds` | Garbage collection time |
| `http_request_duration_seconds` | Request duration histogram |
| `http_request_summary_seconds` | Request duration summary |

### Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'tlscheck-api'
    static_configs:
      - targets: ['api:3000']
```

### Grafana Dashboards

Import the Node.js / Prometheus dashboard for additional visualizations.
