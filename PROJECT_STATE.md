# TLSCheck - Current Project State

## Completed Features

### Core Functionality
- Chrome Extension with popup showing SSL/TLS certificate details
- Fastify API backend for certificate checking
- Revocation checking via OCSP and CRL
- Cache system (API in-memory + Extension chrome.storage.local)
- 30-minute default cache TTL (configurable via CACHE_TTL_MS)

### Extension Features
- Badge indicators: ✓ (secure), ! (warning), X (insecure), H (not HTTPS), i (info), ? (unknown), - (unavailable)
- Color-coded fields: protocol, cipher, validity dates, revocation
- Light/dark theme support
- Revocation checkbox (defaults OFF)
- chrome.storage.local for persistent caching

### API Features
- Endpoints: /health, /version, /api/check, /api/config
- Zod validation for config and request bodies
- Rate limiting
- Swagger/OpenAPI docs at /docs
- Graceful shutdown handling
- Configurable via environment variables

### Docker
- Multi-stage build (builder + production)
- Production dependencies only (--omit=dev)
- Non-root user (app:appgroup, UID/GID 1001)
- Read-only filesystem support
- HEALTHCHECK included
- STOPSIGNAL SIGTERM

### Testing
- 11 integration tests using node:test
- Tests against badssl.com domains (wrong.host, expired, revoked, self-signed, etc.)

### Documentation Website (docs/)
- Astro + Starlight documentation
- Landing page at /
- Full docs at /docs/
- GitHub Actions workflow for deployment
- starlight-openapi integration - API reference dynamically generated from OpenAPI spec at `/docs/json`
- Static api-reference.md removed (now auto-generated)

### Licensing
- AGPL-3.0 license

## Environment Variables
- PORT (default: 3000)
- HOST (default: ::)
- LOG_LEVEL (default: info)
- REQUEST_TIMEOUT_MS (default: 8000)
- RATE_LIMIT_WINDOW_MS (default: 60000)
- RATE_LIMIT_MAX (default: 30)
- MAX_BODY_BYTES (default: 4096)
- REVOCATION_MODE (default: ocsp)
- CACHE_TTL_MS (default: 1800000 - 30 minutes)
- APP_VERSION (default: dev)

## Recent Fixes
- Revocation checkbox now properly passes flag to API
- Revoked certificates show as invalid (valid=false, authorizationError="CERT_REVOKED")
- Graceful shutdown added to API
- IPv6 support (HOST defaults to ::)
- Docker user/group properly configured

## Files Created/Modified
- src/background/cache.ts - Chrome storage caching
- src/background/service-worker.ts - Updated with caching
- api/services/cache.ts - API in-memory cache
- api/routes/config.ts - New /api/config endpoint
- api/config.ts - Added CACHE_TTL_MS
- docs/ - Complete Starlight documentation website
- .github/workflows/deploy.yml - GitHub Pages deployment

## Known Issues (if any)
- Extension popup uses API URL from chrome.storage.local
- Default API URL is http://localhost:3000
- Tests require API to be running
