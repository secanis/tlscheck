import type { ApiCertificateResponse, SecurityInfo } from "../types/ssl";

const defaultApiUrl = "https://free.tlscheck.net";

const normalizeApiUrl = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return "";
  }
};

export const loadApiUrl = async () => {
  const stored = await chrome.storage.local.get(["apiUrl"]);
  return (stored.apiUrl as string) || defaultApiUrl;
};

export const saveApiUrl = async (value: string) => {
  const normalized = normalizeApiUrl(value);
  if (!normalized) {
    throw new Error("Invalid API URL");
  }
  await ensureHostPermission(normalized);
  await chrome.storage.local.set({ apiUrl: normalized });
  return normalized;
};

const ensureHostPermission = async (apiUrl: string) => {
  const origin = new URL(apiUrl).origin;
  const pattern = `${origin}/*`;
  const hasPermission = await chrome.permissions.contains({ origins: [pattern] });
  if (hasPermission) return;

  const granted = await chrome.permissions.request({ origins: [pattern] });
  if (!granted) {
    throw new Error("Permission denied for API host");
  }
};

export const fetchApiCertificate = async (
  apiUrl: string,
  hostname: string,
  revocationCheck: boolean
) => {
  const payload = { domain: hostname, revocationCheck };
  const response = await fetch(`${apiUrl}/api/check`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ domain: hostname, revocationCheck })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "API request failed");
  }

  return (await response.json()) as ApiCertificateResponse;
};

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

export const verifyApiHealth = async (apiUrl: string) => {
  const response = await fetchWithTimeout(`${apiUrl}/health`, 3000);
  if (!response.ok) {
    throw new Error("API health check failed");
  }
  return true;
};

export const getEffectiveApiUrl = (storedUrl: string, pageUrl: string) => {
  if (storedUrl) return storedUrl;
  return defaultApiUrl;
};

export const mapApiResult = (data: ApiCertificateResponse, url: string): SecurityInfo => {
  const valid = Boolean(data.valid);
  const summary = valid
    ? "TLS certificate is valid"
    : data.authorizationError || "TLS certificate is invalid";
  const subject = data.subject || {};
  const issuer = data.issuer || {};
  const subjectAltName = data.subjectaltname || "";
  const subjectAltMatch = subjectAltName.match(/DNS:([^,]+)/);
  const subjectName =
    data.subjectName ||
    subject.CN ||
    subject.commonName ||
    (subjectAltMatch ? subjectAltMatch[1] : "") ||
    subject.O ||
    subject.organizationName ||
    "";
  const issuerName =
    data.issuerName ||
    issuer.CN ||
    issuer.commonName ||
    issuer.O ||
    issuer.organizationName ||
    "";

  const isRevoked = data.revocation?.status === "revoked";
  const effectiveValid = valid && !isRevoked;
  const effectiveSummary = isRevoked
    ? "Certificate has been revoked"
    : summary;

  return {
    url,
    securityState: effectiveValid ? "secure" : "insecure",
    summary: effectiveSummary,
    subjectName,
    issuer: issuerName,
    validFrom: data.valid_from || "",
    validTo: data.valid_to || "",
    protocol: data.protocol || "",
    cipher: data.cipherName || data.cipherStandardName || data.cipher?.name || "",
    keyExchange: data.cipherVersion || data.cipher?.version || "",
    certificateNetworkError: data.authorizationError || "",
    revocationStatus: data.revocation?.status,
    revocationSource: data.revocation?.source,
    revocationReason: data.revocation?.reason,
    revocation: data.revocation
  };
};
