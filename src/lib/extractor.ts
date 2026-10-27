import type { ExtractedJobData } from "../types/tracker";
import { browser } from "wxt/browser";

// Injected into the active tab to extract highlighted text or job container content
function extractFromPageDom(): string {
  const selection = window.getSelection()?.toString().trim();
  if (selection) {
    return selection;
  }

  // Fallback selectors for common job boards when text is not highlighted
  const fallbackSelectors = [
    ".jobs-description",
    ".jobs-box__html-content",
    "#jobDescriptionText",
    "#job-details",
    ".job-description",
    "main",
    "article",
  ];

  for (const selector of fallbackSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = (el as HTMLElement).innerText?.trim();
      if (text && text.length > 100) {
        return text.slice(0, 12000);
      }
    }
  }

  return "";
}

// Queries the active browser tab and triggers content extraction
export async function extractActiveTabJobData(): Promise<ExtractedJobData | null> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab.url) {
      return null;
    }

    // Skip restricted internal browser pages
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      return {
        metadata: {
          sourceUrl: tab.url,
          pageTitle: tab.title || "Browser Tab",
          domain: "Internal Browser Page",
        },
        rawText: "",
        characterCount: 0,
        wordCount: 0,
      };
    }

    let domain = "Active Tab";
    try {
      domain = new URL(tab.url).hostname.replace(/^www\./, "");
    } catch {
      // Ignore invalid or unparseable URLs
    }

    // Execute extractor script in active tab context
    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFromPageDom,
    });

    const rawText = results?.[0]?.result || "";
    const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

    return {
      metadata: {
        sourceUrl: tab.url,
        pageTitle: tab.title || domain,
        domain,
      },
      rawText,
      characterCount: rawText.length,
      wordCount,
    };
  } catch (error) {
    console.error("Failed to extract active tab DOM:", error);
    return null;
  }
}
