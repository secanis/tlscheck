import { loadCertificateInfo } from "./state.js";
import { loadApiUrl, saveApiUrl } from "./api.js";
import { renderInfo } from "./ui.js";

const wireApiSettings = async () => {
  const apiInput = document.getElementById("apiUrl") as HTMLInputElement | null;
  const saveButton = document.getElementById("saveApi") as HTMLButtonElement | null;

  if (!apiInput || !saveButton) return;

  const storedApiUrl = await loadApiUrl();
  apiInput.value = storedApiUrl || "";

  saveButton.addEventListener("click", async () => {
    try {
      const normalized = await saveApiUrl(apiInput.value);
      apiInput.value = normalized;
      renderInfo({
        securityState: "unavailable",
        url: "",
        summary: "API endpoint saved"
      });
      await loadCertificateInfo();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid API URL";
      renderInfo({
        securityState: "unavailable",
        url: "",
        summary: message
      });
    }
  });
};

const wireStatusInfo = () => {
  const toggle = document.getElementById("statusToggle");
  const panel = document.getElementById("statusInfo");

  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", (!isOpen).toString());
    panel.hidden = isOpen;
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  wireStatusInfo();
  await wireApiSettings();
  loadCertificateInfo().catch(() => {
    renderInfo({
      securityState: "unavailable",
      url: "",
      summary: "Unexpected error"
    });
  });
});
