import type { ExtractedJobData } from '../types/tracker';
import { browser } from 'wxt/browser';

/**
 * Injected script that runs inside the active webpage's execution context
 */
function extractFromPageDom(): string {
  // 1. Primary: deliberate user text selection
  const userSelection = window.getSelection()?.toString().trim();
  if (userSelection && userSelection.length > 0) {
    return userSelection;
  }

  // 2. Fallback: Common job portal containers if user forgot to highlight
  const fallbackSelectors = [
    '.jobs-description', // LinkedIn
    '.jobs-box__html-content', // LinkedIn alternate
    '#jobDescriptionText', // Indeed
    '#job-details', // Wellfound / AngelList
    '.job-description', // Generic portals
    'main', // Standard semantic HTML5
    'article',
  ];

  for (const selector of fallbackSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = (el as HTMLElement).innerText?.trim();
      if (text && text.length > 100) {
        // Limit fallback container capture to 12,000 characters per PRD Section 6.1
        return text.slice(0, 12000);
      }
    }
  }

  return '';
}

/**
 * Queries the active tab and executes DOM extraction
 */
export async function extractActiveTabJobData(): Promise<ExtractedJobData | null> {
  try {
    // 1. Find the user's currently focused browser tab
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id || !tab.url) {
      return null;
    }

    // Guard against internal browser pages (chrome://, edge://, about:blank)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      return {
        metadata: {
          sourceUrl: tab.url,
          pageTitle: tab.title || 'Browser Tab',
          domain: 'Internal Browser Page',
        },
        rawText: '',
        characterCount: 0,
        wordCount: 0,
      };
    }

    let domain = 'Active Tab';
    try {
      domain = new URL(tab.url).hostname.replace(/^www\./, '');
    } catch {
      // Fallback domain
    }

    // 2. Execute DOM extraction script inside the active tab
    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFromPageDom,
    });

    const rawText = results?.[0]?.result || '';
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
    console.error('Failed to extract active tab DOM:', error);
    return null;
  }
}
