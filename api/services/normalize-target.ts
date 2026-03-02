import { URL } from "url";

export type TargetInfo = {
  host: string;
  port: number;
  servername: string;
};

const isValidHostname = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > 253) return false;
  if (trimmed.includes("/")) return false;
  if (trimmed.startsWith("[")) return false;
  const labels = trimmed.split(".");
  if (labels.some((label) => label.length === 0 || label.length > 63)) return false;
  if (labels.some((label) => !/^[a-z0-9-]+$/.test(label))) return false;
  if (labels.some((label) => label.startsWith("-") || label.endsWith("-"))) return false;
  return true;
};

export const normalizeTarget = (input?: string | null): TargetInfo | null => {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 443),
      servername: parsed.hostname
    };
  } catch (error) {
    if (isValidHostname(trimmed)) {
      return { host: trimmed, port: 443, servername: trimmed };
    }
    return null;
  }
};
