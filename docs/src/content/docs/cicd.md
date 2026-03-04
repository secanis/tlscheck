---
title: CI/CD
description: Continuous Integration and Deployment
---

## Build Status

[![Build](https://github.com/secanis/tlscheck/actions/workflows/build.yml/badge.svg)](https://github.com/secanis/tlscheck/actions/workflows/build.yml)

The project uses GitHub Actions for continuous integration. Every push to `main` and pull requests trigger builds for:

- **API** - TypeScript compilation
- **Chrome Extension** - Browser extension build
- **Docs** - Documentation website

## Download Artifacts

After a successful build, you can download the artifacts from the Actions run:

1. Go to [Actions](https://github.com/secanis/tlscheck/actions)
2. Select the workflow run
3. Download the artifacts:
   - `api` - Compiled API
   - `chrome-extension` - Built Chrome extension
   - `docs` - Built documentation
