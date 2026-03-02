export type SecurityState = "secure" | "insecure" | "unavailable";

export type SecurityInfo = {
  tabId?: number;
  url: string;
  securityState: SecurityState;
  summary?: string;
  protocol?: string;
  subjectName?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  keyExchange?: string;
  cipher?: string;
  revocationStatus?: "good" | "revoked" | "unknown" | "unsupported" | "error";
  revocationSource?: "ocsp" | "crl" | "none";
  revocationReason?: string;
  certificateNetworkError?: string;
  certificateHasWeakSignature?: boolean;
  certificateHasSha1Signature?: boolean;
  certificateHasWeakKey?: boolean;
  certificateHasSynthesizedSha1Signature?: boolean;
  revocation?: {
    status: "good" | "revoked" | "unknown" | "unsupported" | "error";
    source: "ocsp" | "crl" | "none";
    reason?: string;
    checkedAt: string;
  } | null;
};

export type ApiCertificateResponse = {
  host: string;
  port: number;
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
  subjectaltname?: string;
  valid_from?: string;
  valid_to?: string;
  fingerprint256?: string;
  serialNumber?: string;
  raw?: string;
  revocation?: {
    status: "good" | "revoked" | "unknown" | "unsupported" | "error";
    source: "ocsp" | "crl" | "none";
    reason?: string;
    checkedAt: string;
  } | null;
};
