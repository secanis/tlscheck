import type { SecurityInfo } from "../types/ssl";

type ApiCertificateResponse = {
  valid: boolean;
  authorizationError?: string;
  protocol?: string;
  cipher?: { name?: string; version?: string };
  cipherName?: string;
  cipherVersion?: string;
  cipherStandardName?: string;
  subject?: Record<string, string>;
  issuer?: Record<string, string>;
  subjectName?: string;
  issuerName?: string;
  valid_from?: string;
  valid_to?: string;
  subjectaltname?: string;
  revocation?: {
    status: "good" | "revoked" | "unknown" | "unsupported" | "error";
    source: "ocsp" | "crl" | "none";
    reason?: string;
    checkedAt: string;
  } | null;
};

const defaultApiUrl = "http://localhost:3000";

export const loadApiUrl = async () => {
  const stored = await chrome.storage.local.get(["apiUrl"]);
  return (stored.apiUrl as string) || defaultApiUrl;
};

const fetchApiCertificate = async (apiUrl: string, hostname: string, revocationCheck?: boolean) => {
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

export const fetchSecurityInfoFromApi = async (apiUrl: string, url: string, revocationCheck?: boolean): Promise<SecurityInfo> => {
  if (!url.startsWith("http")) {
    return {
      url,
      securityState: "unavailable",
      summary: "Unsupported page"
    };
  }

  const hostname = new URL(url).hostname;
  const data = await fetchApiCertificate(apiUrl, hostname, revocationCheck);
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
    : valid
    ? "TLS certificate is valid"
    : data.authorizationError || "TLS certificate is invalid";

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
