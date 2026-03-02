---
title: Getting Started
description: Installation and quick start guide for TLSCheck
---

## TLSCheck

TLSCheck is a Chromium/Chrome extension that surfaces TLS certificate state for the active tab, with a self-hostable API backend including OCSP/CRL revocation checks.

## Installation

### Chrome Extension

1. Build the extension:

```bash
npm install
node scripts/build.js chrome
```

2. Load the extension in Chrome:

- Open `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `dist/chrome`

### API Service

The API can be run via Docker or directly from source.

### Run with Podman

```bash
podman run --rm --read-only --tmpfs /tmp -p 3000:3000 tlscheck/api
```

### Run from Source

```bash
npm install
npm run build:api
npm run start:api
```

The API will be available at `http://localhost:3000`

## Project Layout

- **Source code**: `src/`
- **Chrome manifest**: `platforms/chrome/manifest.json`
- **Build output**: `dist/chrome`
- **API code**: `api/`

## Documentation

- [Configuration](/configuration/) - Configure environment variables
- [API Reference](/api-reference/) - API endpoints
- [UI Colors](/ui-colors/) - Understanding color coding
- [Container](/docker/) - Container/Podman setup
- [CI/CD](/tests/) - Build status and artifacts
- [License](https://github.com/secanis/tlscheck/blob/main/LICENSE) - AGPL license info
