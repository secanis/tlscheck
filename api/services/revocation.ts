import tls from "tls";
import ocsp from "ocsp";
import forge from "node-forge";
import rfc5280 from "asn1.js-rfc5280";

export type RevocationStatus =
  | "good"
  | "revoked"
  | "unknown"
  | "unsupported"
  | "error";

export type RevocationResult = {
  status: RevocationStatus;
  source: "ocsp" | "crl" | "none";
  reason?: string;
  checkedAt: string;
};

const toPem = (raw: Buffer) => {
  const b64 = raw.toString("base64");
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----\n`;
};

const sanitizeUrl = (url: string) => {
  let cleaned = url.replace(/[^A-Za-z0-9./:%?=&#_-]+$/g, "");
  if (/\.crl\d+$/i.test(cleaned)) {
    cleaned = cleaned.replace(/\.crl\d+$/i, ".crl");
  }
  return cleaned;
};

const parseUrlsFromCert = (raw: Buffer) => {
  try {
    const asn1 = forge.asn1.fromDer(forge.util.createBuffer(raw));
    const cert = forge.pki.certificateFromAsn1(asn1);
    const ocspUrls: string[] = [];
    const crlUrls: string[] = [];
    const issuerUrls: string[] = [];

    (cert.extensions || []).forEach((ext: any) => {
      if (ext.id === "1.3.6.1.5.5.7.1.1" || ext.name === "authorityInfoAccess") {
        const access = ext.accessDescriptions || [];
        access.forEach((desc: any) => {
          const method = desc.accessMethod || desc.accessMethodOid || desc.accessMethodId;
          const location = desc.accessLocation?.value || desc.accessLocation?.uri || desc.location;
          if (!location) return;
          if (method === "1.3.6.1.5.5.7.48.1" || desc.accessMethodName === "ocsp") {
            ocspUrls.push(location);
          }
          if (method === "1.3.6.1.5.5.7.48.2" || desc.accessMethodName === "caIssuers") {
            issuerUrls.push(location);
          }
        });
      }

      if (
        ext.id === "2.5.29.31" ||
        ext.name === "cRLDistributionPoints" ||
        ext.name === "crlDistributionPoints"
      ) {
        const points = ext.distributionPoints || [];
        points.forEach((point: any) => {
          const names = point.fullName || point.fullname || [];
          if (Array.isArray(names)) {
            names.forEach((name: any) => {
              const value = name.value || name.uri || name.url;
              if (value) crlUrls.push(value);
            });
          }
        });
      }
    });

    if (ocspUrls.length || crlUrls.length || issuerUrls.length) {
      return {
        ocspUrl: ocspUrls[0] || "",
        crlUrl: crlUrls[0] || "",
        issuerUrl: issuerUrls[0] || ""
      };
    }
  } catch {
    // fall through to heuristic extraction
  }

  const ascii = raw.toString("latin1");
  const matches = (ascii.match(/https?:\/\/[\w\-./:%?=&#]+/g) || []).map(
    sanitizeUrl
  );
  const ocsp = matches.find((url) => /ocsp/i.test(url)) || "";
  const crl = matches.find((url) => /\.crl/i.test(url)) || "";
  const issuer =
    matches.find((url) => /\.crt/i.test(url) || /\/ca/i.test(url)) || "";

  return { ocspUrl: ocsp, crlUrl: crl, issuerUrl: issuer };
};

const fetchCrl = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  return fetch(url, {
    signal: controller.signal,
    headers: {
      "user-agent": "tlscheck/1.0"
    }
  }).finally(() => clearTimeout(timeout));
};

const checkCrl = async (
  cert: tls.DetailedPeerCertificate | tls.PeerCertificate,
  crlUrl: string
): Promise<RevocationResult> => {
  if (!crlUrl) {
    return { status: "unsupported", source: "none", checkedAt: new Date().toISOString() };
  }

  try {
    let response = await fetchCrl(crlUrl);
    if (!response.ok && /\.crl\d+$/i.test(crlUrl)) {
      const fallbackUrl = crlUrl.replace(/\.crl\d+$/i, ".crl");
      response = await fetchCrl(fallbackUrl);
      if (!response.ok) {
        return {
          status: "error",
          source: "crl",
          reason: `CRL fetch failed (${response.status}) ${fallbackUrl}`,
          checkedAt: new Date().toISOString()
        };
      }
    }
    if (!response.ok) {
      return {
        status: "error",
        source: "crl",
        reason: `CRL fetch failed (${response.status}) ${crlUrl}`,
        checkedAt: new Date().toISOString()
      };
    }
    const data = await response.arrayBuffer();
    const buffer = Buffer.from(data);
    let revoked: Array<{ userCertificate?: string }> = [];
    try {
      const crl = rfc5280.CertificateList.decode(buffer, "der");
      revoked = crl.tbsCertList.revokedCertificates || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : "CRL parse error";
      return {
        status: "error",
        source: "crl",
        reason: `CRL parse failed ${crlUrl} (${message})`,
        checkedAt: new Date().toISOString()
      };
    }
    const serial = (cert as tls.DetailedPeerCertificate).serialNumber;
    if (!serial) {
      return {
        status: "unknown",
        source: "crl",
        reason: "Missing serial number",
        checkedAt: new Date().toISOString()
      };
    }
    const normalizeSerial = (value: string) => value.replace(/[^a-fA-F0-9]/g, "").replace(/^0+/, "").toUpperCase();
    const normalizedSerial = normalizeSerial(serial);
    const isRevoked = revoked.some((entry) => {
      const raw = entry.userCertificate as unknown;
      if (!raw) return false;
      if (typeof raw === "string") {
        return normalizeSerial(raw) === normalizedSerial;
      }
      if (Buffer.isBuffer(raw)) {
        return normalizeSerial(raw.toString("hex")) === normalizedSerial;
      }
      if (typeof (raw as { toString?: (radix?: number) => string }).toString === "function") {
        return normalizeSerial((raw as { toString: (radix?: number) => string }).toString(16)) === normalizedSerial;
      }
      return false;
    });
    return {
      status: isRevoked ? "revoked" : "good",
      source: "crl",
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "error",
      source: "crl",
      reason: error instanceof Error ? error.message : "CRL error",
      checkedAt: new Date().toISOString()
    };
  }
};

const toPemFromUnknown = (raw: Buffer) => {
  const text = raw.toString("utf8");
  if (text.includes("BEGIN CERTIFICATE")) {
    return text;
  }
  return toPem(raw);
};

const fetchIssuerRaw = async (issuerUrl: string) => {
  const url = issuerUrl;
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
};

const checkOcsp = async (
  cert: tls.DetailedPeerCertificate | tls.PeerCertificate,
  issuerRaw: Buffer,
  ocspUrl: string
): Promise<RevocationResult> => {
  if (!ocspUrl) {
    return { status: "unsupported", source: "none", checkedAt: new Date().toISOString() };
  }

  try {
    const certPem = toPemFromUnknown(cert.raw as Buffer);
    const issuerPem = toPemFromUnknown(issuerRaw);
    const req = ocsp.request.generate(certPem, issuerPem);
    const options = ocsp.getOptions(ocspUrl, req.data);

    const rawResponse = await new Promise<Buffer>((resolve, reject) => {
      ocsp.request.send(options, req.data, (err: Error | null, res: Buffer) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    const parsed = ocsp.utils.parseResponse(rawResponse, req);
    const status = parsed?.type || "unknown";
    if (status === "good") {
      return { status: "good", source: "ocsp", checkedAt: new Date().toISOString() };
    }
    if (status === "revoked") {
      return { status: "revoked", source: "ocsp", checkedAt: new Date().toISOString() };
    }
    return {
      status: "unknown",
      source: "ocsp",
      reason: "OCSP status unknown",
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "error",
      source: "ocsp",
      reason: error instanceof Error ? error.message : "OCSP error",
      checkedAt: new Date().toISOString()
    };
  }
};

export const checkRevocation = async (
  cert: tls.DetailedPeerCertificate | tls.PeerCertificate,
  issuer?: tls.DetailedPeerCertificate | tls.PeerCertificate
): Promise<RevocationResult> => {
  if (!cert || !cert.raw) {
    return { status: "unknown", source: "none", reason: "Missing certificate", checkedAt: new Date().toISOString() };
  }

  const urls = parseUrlsFromCert(cert.raw as Buffer);
  const issuerRaw = issuer?.raw || (await fetchIssuerRaw(urls.issuerUrl));
  if (issuerRaw) {
    const ocspResult = await checkOcsp(cert, issuerRaw, urls.ocspUrl);
    if (ocspResult.status === "good" || ocspResult.status === "revoked") {
      return ocspResult;
    }
    if (ocspResult.status === "error" || ocspResult.status === "unknown") {
      const crlFallback = await checkCrl(cert, urls.crlUrl);
      if (crlFallback.status !== "unsupported") {
        return crlFallback;
      }
      return ocspResult;
    }
  }

  const fallback = await checkCrl(cert, urls.crlUrl);
  if (fallback.status === "unsupported") {
    return {
      status: "unsupported",
      source: "none",
      reason: "No OCSP or CRL URLs found",
      checkedAt: new Date().toISOString()
    };
  }
  return fallback;
};
