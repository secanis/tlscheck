# TLSCheck

TLS/SSL Certificate Checker - Chromium/Chrome extension that surfaces TLS certificate state for the active tab, with a self-hostable API backend.

## Quick Start

```bash
# Install dependencies
npm install

# Build Chrome extension
node scripts/build.js chrome

# Run API
npm run start:api

# Or with Podman
podman run --rm --read-only --tmpfs /tmp -p 3000:3000 tlscheck/api
```

## Documentation

Full documentation is available at [https://tlscheck.net/docs](https://tlscheck.net/docs):

- [Getting Started](https://tlscheck.net/getting-started/)
- [Configuration](https://tlscheck.net/configuration/)
- [API Reference](https://tlscheck.net/api-reference/)
- [Container](https://tlscheck.net/container/)
- [CI/CD](https://tlscheck.net/cicd/)
- [License](https://github.com/secanis/tlscheck/blob/main/LICENSE)

## Project Layout

- `src/` - Extension source
- `api/` - API source
- `platforms/chrome/manifest.json` - Chrome manifest
- `dist/extension/chrome` - Built extension
- `docs/` - Documentation website

## License

AGPL-3.0 - See [LICENSE](https://github.com/secanis/tlscheck/blob/main/LICENSE) file for details.
