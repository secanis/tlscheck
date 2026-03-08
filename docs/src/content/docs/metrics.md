---
title: Metrics Endpoint
description: Configuration and custom metrics for tlscheck api.
---

The API exposes a Prometheus-compatible metrics endpoint at `GET /metrics` when enabled.

See [Evironment Variables](https://tlscheck.net/configuration/)

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
