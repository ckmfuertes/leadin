import { browser } from "wxt/browser";
import { dispatchLeadAnalysis } from "../src/lib/api";
import { saveActiveAnalysis } from "../src/lib/storage";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (res: any) => void) => {
    if (message?.type === "START_ANALYSIS") {
      const { jobData, settings } = message;

      // Dispatch lead analysis in background so popup unmount does not abort network requests
      dispatchLeadAnalysis(jobData, settings)
        .then(async (response) => {
          await saveActiveAnalysis({
            status: "result",
            startedAt: Date.now(),
            jobData,
            result: response,
            errorMessage: null,
          });
          sendResponse({ success: true, result: response });
        })
        .catch(async (err: any) => {
          console.error("Background lead analysis failed:", err);
          await saveActiveAnalysis({
            status: "error",
            startedAt: Date.now(),
            jobData,
            result: null,
            errorMessage: err?.message || "Failed to analyze job posting.",
          });
          sendResponse({ success: false, error: err?.message });
        });

      return true; // Keep sendResponse open for asynchronous response
    }

    if (message?.type === "CLEAR_ANALYSIS") {
      saveActiveAnalysis({ status: "idle" }).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
  });
});

