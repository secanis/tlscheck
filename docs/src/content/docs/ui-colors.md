---
title: UI Coloring Rules
description: Color coding in the extension popup
---

## Status Colors

### Security State

| State | Color | Description |
|-------|-------|-------------|
| <span style="color:#1b8f3a">●</span> `secure` | Green | Valid certificate |
| <span style="color:#b3261e">●</span> `insecure` | Red | Invalid certificate |
| <span style="color:#5f6368">●</span> `unavailable` | Gray | API unavailable or HTTP page (no TLS to check) |

### Badge Indicators

| Badge | Color | Meaning |
|-------|-------|---------|
| <span style="color:#1b8f3a">✓</span> | Green | Secure |
| <span style="color:#b3261e">X</span> | Red | Insecure |
| <span style="color:#5f6368">-</span> | Gray | Unavailable (API error or non-HTTPS page) |

### Certificate Validity

| Status | Color | Description |
|--------|-------|-------------|
| <span style="color:#1b8f3a">●</span> Valid | Green | Certificate is valid |
| <span style="color:#b76a00">●</span> Warning | Orange | Certificate expires within 30 days |
| <span style="color:#b3261e">●</span> Expired | Red | Certificate has expired |

### Protocol Strength

| Protocol | Color | Description |
|----------|-------|-------------|
| <span style="color:#1b8f3a">●</span> TLS 1.3 | Green | Modern secure protocol |
| <span style="color:#b76a00">●</span> TLS 1.2 | Orange | Legacy but still secure |
| <span style="color:#b3261e">●</span> TLS 1.1 / 1.0 | Red | Deprecated, insecure |

### Cipher Suites

| Cipher Type | Color | Description |
|-------------|-------|-------------|
| <span style="color:#1b8f3a">●</span> GCM / ChaCha20 | Green | Strong cipher modes |
| <span style="color:#b76a00">●</span> CBC | Orange | Weak mode (deprecated) |
| <span style="color:#b3261e">●</span> RC4 / 3DES / MD5 / SHA1 | Red | Insecure algorithms |

### Revocation Status

| Status | Color | Description |
|--------|-------|-------------|
| <span style="color:#1b8f3a">●</span> Good | Green | Certificate not revoked |
| <span style="color:#b3261e">●</span> Revoked | Red | Certificate has been revoked |
| <span style="color:#b76a00">●</span> Unknown | Orange | Unable to determine revocation status |
