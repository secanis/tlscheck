import type { SecurityInfo, SecurityState } from "../types/ssl";

const badgeClasses: Record<SecurityState, string> = {
  secure: "badge",
  insecure: "badge badge--danger",
  unavailable: "badge badge--neutral"
};

const badgeLabels: Record<SecurityState, string> = {
  secure: "Secure",
  insecure: "Insecure",
  unavailable: "Unavailable"
};

const setText = (id: string, value?: string) => {
  const node = document.getElementById(id);
  if (node) node.textContent = value || "-";
};

const getProtocolClass = (protocol?: string) => {
  if (!protocol) return "";
  const normalized = protocol.toLowerCase();
  if (normalized.includes("tlsv1.3")) return "protocol--good";
  if (normalized.includes("tlsv1.2")) return "protocol--warn";
  if (normalized.includes("tlsv1.1") || normalized.includes("tlsv1.0")) {
    return "protocol--bad";
  }
  if (status === "unsupported") return "revocation--unknown";
  return "";
};

const getCipherClass = (cipher?: string) => {
  if (!cipher) return "";
  const normalized = cipher.toLowerCase();
  if (
    normalized.includes("rc4") ||
    normalized.includes("3des") ||
    normalized.includes("des") ||
    normalized.includes("md5") ||
    normalized.includes("sha1") ||
    normalized.includes("null") ||
    normalized.includes("export") ||
    normalized.includes("anon")
  ) {
    return "cipher--bad";
  }

  if (normalized.includes("cbc")) {
    return "cipher--warn";
  }

  if (
    normalized.includes("gcm") ||
    normalized.includes("chacha20") ||
    normalized.includes("poly1305")
  ) {
    return "cipher--good";
  }

  return "";
};

const getStatusClass = (state: SecurityInfo["securityState"]) => {
  if (state === "secure") return "status--good";
  if (state === "insecure") return "status--bad";
  return "";
};

const formatDate = (isoString?: string) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString();
};

const getValidityClass = (validTo?: string) => {
  if (!validTo) return "";
  const expiry = new Date(validTo);
  if (Number.isNaN(expiry.getTime())) return "";
  const daysLeft = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft <= 0) return "validity--bad";
  if (daysLeft < 7) return "validity--bad";
  if (daysLeft < 30) return "validity--warn";
  return "validity--good";
};

export const renderInfo = (info: SecurityInfo) => {
  const stateBadge = document.getElementById("stateBadge");
  if (stateBadge) {
    stateBadge.className = badgeClasses[info.securityState] || badgeClasses.unavailable;
    stateBadge.textContent = badgeLabels[info.securityState] || "Unavailable";
  }

  setText("status", info.summary || "SSL state updated");
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.classList.remove("status--good", "status--warn", "status--bad");
    const statusClass = getStatusClass(info.securityState);
    if (statusClass) {
      statusElement.classList.add(statusClass);
    }
  }
  setText("subject", info.subjectName);
  setText("issuer", info.issuer || "");
  setText("validFrom", formatDate(info.validFrom));
  setText("validTo", formatDate(info.validTo));
  const validToElement = document.getElementById("validTo");
  if (validToElement) {
    validToElement.classList.remove("validity--good", "validity--warn", "validity--bad");
    const validityClass = getValidityClass(info.validTo);
    if (validityClass) {
      validToElement.classList.add(validityClass);
    }
  }
  setText("protocol", info.protocol);
  const protocolElement = document.getElementById("protocol");
  if (protocolElement) {
    protocolElement.classList.remove("protocol--good", "protocol--warn", "protocol--bad");
    const protocolClass = getProtocolClass(info.protocol);
    if (protocolClass) {
      protocolElement.classList.add(protocolClass);
    }
  }
  setText("cipher", info.cipher);
  const cipherElement = document.getElementById("cipher");
  if (cipherElement) {
    cipherElement.classList.remove("cipher--good", "cipher--warn", "cipher--bad");
    const cipherClass = getCipherClass(info.cipher);
    if (cipherClass) {
      cipherElement.classList.add(cipherClass);
    }
  }
  setText("keyExchange", info.keyExchange);
  renderRevocation(info);
  renderWarnings(info);

  const sslLabsLink = document.getElementById("sslLabsLink") as HTMLAnchorElement | null;
  if (sslLabsLink) {
    const subject = info.subjectName || info.url;
    const host = subject ? subject.replace(/^https?:\/\//, "") : "";
    sslLabsLink.href = host
      ? `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(host)}&hideResults=on`
      : "#";
  }
};

const renderRevocation = (info: SecurityInfo) => {
  const revocationElement = document.getElementById("revocation");
  if (!revocationElement) return;

  revocationElement.classList.remove("revocation--good", "revocation--warn", "revocation--bad");

  if (!info.revocationStatus || info.revocationStatus === "unsupported") {
    revocationElement.textContent = "-";
    return;
  }

  const status = info.revocationStatus;
  const source = info.revocationSource ? ` (${info.revocationSource.toUpperCase()})` : "";
  const reason = info.revocationReason ? `: ${info.revocationReason}` : "";

  revocationElement.textContent = `${status}${source}${reason}`;

  if (status === "good") {
    revocationElement.classList.add("revocation--good");
  } else if (status === "revoked" || status === "error") {
    revocationElement.classList.add("revocation--bad");
  } else {
    revocationElement.classList.add("revocation--warn");
  }
};

const renderWarnings = (info: SecurityInfo) => {
  const warnings: string[] = [];
  if (info.certificateNetworkError?.trim()) {
    warnings.push(info.certificateNetworkError.trim());
  }
  if (info.revocationStatus === "revoked") {
    warnings.push("Certificate has been revoked");
  }
  if (info.certificateHasWeakSignature) warnings.push("Weak signature algorithm");
  if (info.certificateHasSha1Signature) warnings.push("SHA-1 signature detected");
  if (info.certificateHasWeakKey) warnings.push("Weak public key length");
  if (info.certificateHasSynthesizedSha1Signature) {
    warnings.push("Synthesized SHA-1 signature detected");
  }

  const warningsElement = document.getElementById("warnings");
  if (!warningsElement) return;
  warningsElement.innerHTML = "";
  warningsElement.hidden = warnings.length === 0;

  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      const line = document.createElement("div");
      line.textContent = warning;
      warningsElement.appendChild(line);
    });
  }
};
