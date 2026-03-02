import type { SecurityInfo, SecurityState } from "../types/ssl";
import { fetchSecurityInfoFromApi } from "./api.js";
import { getCached, setCached, getCacheConfig, getApiConfig, setCacheConfig } from "./cache.js";

const defaultApiUrl = "http://localhost:3000";

const getStoredApiUrl = async (): Promise<string> => {
  const stored = await chrome.storage.local.get(["apiUrl"]);
  return (stored.apiUrl as string) || defaultApiUrl;
};

const getEffectiveApiUrl = async (tabUrl: string): Promise<string> => {
  const storedUrl = await getStoredApiUrl();
  if (storedUrl) return storedUrl;
  try {
    const url = new URL(tabUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return defaultApiUrl;
  }
};

let apiConfig = { cacheTtlMs: 1800000, revocationMode: "ocsp" };

const initConfig = async () => {
  apiConfig = await getCacheConfig();
  const apiUrl = await getStoredApiUrl();
  const fetchedConfig = await getApiConfig(apiUrl);
  if (fetchedConfig) {
    apiConfig = fetchedConfig;
    await setCacheConfig(fetchedConfig);
  }
};

initConfig();

type BadgeStyle = {
  text: string;
  color: string;
};

const badgeStyles: Record<SecurityState, BadgeStyle> = {
  secure: { text: "✓", color: "#1b8f3a" },
  insecure: { text: "X", color: "#b3261e" },
  unavailable: { text: "-", color: "#5f6368" }
};

const updateBadgeForTab = (info: SecurityInfo) => {
  if (!info?.tabId) return;
  const style = badgeStyles[info.securityState] || badgeStyles.unavailable;
  chrome.action.setBadgeText({ tabId: info.tabId, text: style.text });
  chrome.action.setBadgeBackgroundColor({
    tabId: info.tabId,
    color: style.color
  });
  chrome.action.setTitle({
    tabId: info.tabId,
    title: info.summary || "SSL state"
  });
};

const refreshTabSecurity = async (tabId: number, revocationCheck?: boolean): Promise<SecurityInfo> => {
  const tab = await chrome.tabs.get(tabId);
  if (!tab || tab.url?.startsWith("chrome://") || tab.url?.startsWith("edge://")) {
    const info: SecurityInfo = {
      tabId,
      url: tab?.url || "",
      securityState: "unavailable",
      summary: "Security state not available"
    };
    const hostname = new URL(tab?.url || "").hostname;
    await setCached(hostname, info);
    updateBadgeForTab(info);
    return info;
  }

  try {
    const url = tab.url;
    if (!url) throw new Error("No URL");
    const hostname = new URL(url).hostname;
    const cached = await getCached(hostname, apiConfig.cacheTtlMs);
    if (cached) {
      cached.tabId = tabId;
      updateBadgeForTab(cached);
      return cached;
    }

    const apiUrl = await getEffectiveApiUrl(url);
    const info = await fetchSecurityInfoFromApi(apiUrl, url, revocationCheck);
    info.tabId = tabId;
    await setCached(hostname, info);
    updateBadgeForTab(info);
    return info;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch SSL state";
    const info: SecurityInfo = {
      tabId,
      url: tab.url || "",
      securityState: "unavailable",
      summary: message
    };
    const hostname = new URL(tab.url || "").hostname;
    await setCached(hostname, info);
    updateBadgeForTab(info);
    return info;
  }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  refreshTabSecurity(tabId).catch(() => {});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    refreshTabSecurity(tabId).catch(() => {});
  }
});

type MessageRequest =
  | { type: "ssl:getInfo"; tabId: number; revocationCheck?: boolean }
  | { type: "ssl:getCached"; tabId: number };

chrome.runtime.onMessage.addListener((message: MessageRequest, sender, sendResponse) => {
  if (message?.type === "ssl:getInfo") {
    const { tabId, revocationCheck } = message;
    refreshTabSecurity(tabId, revocationCheck)
      .then((info) => sendResponse({ ok: true, info }))
      .catch((error) => {
        const messageText = error instanceof Error ? error.message : "Unknown error";
        sendResponse({ ok: false, error: messageText });
      });
    return true;
  }

  if (message?.type === "ssl:getCached") {
    chrome.tabs.get(message.tabId).then(async (tab) => {
      if (!tab?.url) {
        sendResponse({ ok: false, info: undefined });
        return;
      }
      const hostname = new URL(tab.url).hostname;
      const info = await getCached(hostname, apiConfig.cacheTtlMs);
      sendResponse({ ok: Boolean(info), info: info || undefined });
    });
    return true;
  }
});
