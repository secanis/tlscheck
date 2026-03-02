---
title: Welcome
description: TLSCheck - TLS/SSL Certificate Checker with revocation checking
template: splash
hero:
  tagline: TLS/SSL Certificate Checker with OCSP/CRL revocation checking
  image:
    file: ../../assets/logo.svg
  actions:
    - text: Get Started
      link: /getting-started/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/secanis/tlscheck
      icon: external
---

## Features

<CardGrid stagger>
  <Card title="Chrome Extension" icon="puzzle">
    Check TLS certificate status directly in your browser. Supports revocation checking via OCSP and CRL.
  </Card>
  <Card title="Self-Hostable API" icon="rocket">
    Run your own API instance. Built with Fastify, lightweight and fast.
  </Card>
  <Card title="Revocation Checking" icon="shield">
    Check if certificates have been revoked using OCSP or CRL. Always on for maximum security.
  </Card>
  <Card title="Open Source" icon="open-book">
    Free to use and modify. Licensed under AGPL-3.0.
  </Card>
</CardGrid>

## Quick Start

```bash
# Build and run the extension
npm install
node scripts/build.js chrome

# Or run the API
npm run start:api
```

The extension will check every HTTPS page and display certificate status with clear visual indicators.
