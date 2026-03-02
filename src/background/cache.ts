import type { SecurityInfo } from "../types/ssl";

type CachedEntry = {
  data: SecurityInfo;
  timestamp: number;
  version: number;
};

const CACHE_PREFIX = "cert_cache_";
const CACHE_VERSION = 2;

export const getApiConfig = async (apiUrl: string): Promise<{ cacheTtlMs: number; revocationMode: string } | null> => {
  try {
    const response = await fetch(`${apiUrl}/api/config`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

export const getCached = async (hostname: string, cacheTtlMs: number): Promise<SecurityInfo | null> => {
  const key = CACHE_PREFIX + hostname;
  const stored = await chrome.storage.local.get(key);
  const entry = stored[key] as CachedEntry | undefined;

  if (!entry) return null;

  if (Date.now() - entry.timestamp > cacheTtlMs || (entry as any).version !== CACHE_VERSION) {
    await chrome.storage.local.remove(key);
    return null;
  }

  return entry.data;
};

export const setCached = async (hostname: string, data: SecurityInfo): Promise<void> => {
  const key = CACHE_PREFIX + hostname;
  const entry: CachedEntry = {
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION
  };
  await chrome.storage.local.set({ [key]: entry });
};

export const getCacheConfig = async (): Promise<{ cacheTtlMs: number; revocationMode: string }> => {
  const stored = await chrome.storage.local.get(["apiConfig"]);
  const config = stored.apiConfig as { cacheTtlMs: number; revocationMode: string } | undefined;

  if (config) return config;

  const defaultConfig = { cacheTtlMs: 1800000, revocationMode: "ocsp" };
  await chrome.storage.local.set({ apiConfig: defaultConfig });
  return defaultConfig;
};

export const setCacheConfig = async (config: { cacheTtlMs: number; revocationMode: string }): Promise<void> => {
  await chrome.storage.local.set({ apiConfig: config });
};
