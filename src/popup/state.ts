import type { SecurityInfo } from "../types/ssl";
import {
  fetchApiCertificate,
  getEffectiveApiUrl,
  loadApiUrl,
  mapApiResult,
  verifyApiHealth
} from "./api.js";
import { renderInfo } from "./ui.js";

type RuntimeMessage = { ok?: boolean; info?: SecurityInfo; error?: string };

export const loadCertificateInfo = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    renderInfo({ securityState: "unavailable", url: "", summary: "No active tab" });
    return;
  }


  if (!tab.url || !tab.url.startsWith("http")) {
    renderInfo({
      securityState: "unavailable",
      url: tab.url || "",
      summary: "Unsupported page"
    });
    return;
  }

  const storedApiUrl = await loadApiUrl();
  const apiUrl = getEffectiveApiUrl(storedApiUrl, tab.url);
  const revocationCheck = true;
  const hostname = new URL(tab.url).hostname;

  const response = (await chrome.runtime.sendMessage({
    type: "ssl:getInfo",
    tabId: tab.id,
    revocationCheck
  })) as RuntimeMessage;

  if (response?.ok && response.info?.securityState !== "unavailable") {
    renderInfo(response.info as SecurityInfo);
    return;
  }

  try {
    await verifyApiHealth(apiUrl);
    const apiData = await fetchApiCertificate(apiUrl, hostname, revocationCheck);
    renderInfo(mapApiResult(apiData, tab.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch SSL state";
    renderInfo({
      securityState: "unavailable",
      url: tab.url,
      summary: message
    });
  }
};
