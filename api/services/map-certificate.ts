import tls from "tls";
import { TargetInfo } from "./normalize-target";
import { RevocationResult } from "./revocation";

type CertificateResult = {
  cert: tls.DetailedPeerCertificate | tls.PeerCertificate;
  issuer?: tls.DetailedPeerCertificate | tls.PeerCertificate;
  cipher: tls.CipherNameAndProtocol | null;
  protocol: string | null;
  authorized: boolean;
  authError: string | null;
  revocation?: RevocationResult;
};

export const mapCertificate = (result: CertificateResult, target: TargetInfo) => {
  const cert = result.cert || {};
  const subject = (cert.subject || {}) as unknown as Record<string, string>;
  const issuer = (cert.issuer || {}) as unknown as Record<string, string>;
  const subjectAltName = cert.subjectaltname || "";
  const subjectAltNameMatch = subjectAltName.match(/DNS:([^,]+)/);
  const subjectName =
    subject.CN ||
    subject.commonName ||
    (subjectAltNameMatch ? subjectAltNameMatch[1] : "") ||
    subject.O ||
    subject.organizationName ||
    "";
  const issuerName = issuer.CN || issuer.commonName || issuer.O || issuer.organizationName || "";
  const isRevoked = result.revocation?.status === "revoked";
  return {
    host: target.host,
    port: target.port,
    valid: result.authorized && !isRevoked,
    authorizationError: isRevoked ? "CERT_REVOKED" : (result.authError || ""),
    protocol: result.protocol || "",
    cipher: result.cipher || {},
    cipherName: result.cipher?.name || "",
    cipherVersion: result.cipher?.version || "",
    cipherStandardName: (result.cipher as { standardName?: string } | null)?.standardName || "",
    subject,
    issuer,
    subjectName,
    issuerName,
    revocation: result.revocation || null,
    subjectaltname: subjectAltName,
    valid_from: cert.valid_from || "",
    valid_to: cert.valid_to || "",
    fingerprint256: cert.fingerprint256 || "",
    serialNumber: cert.serialNumber || "",
    raw: cert.raw ? cert.raw.toString("base64") : ""
  };
};
