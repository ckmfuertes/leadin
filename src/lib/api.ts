import type { ExtractedJobData, AnalysisResponse } from "../types/tracker";
import type { LeadInSettings } from "../types";
import type { OutboundLeadPayload } from "../types/api";

// Dispatches the extracted job data and candidate profile to the user endpoint
export async function dispatchLeadAnalysis(
  jobData: ExtractedJobData,
  settings: LeadInSettings,
): Promise<AnalysisResponse> {
  const { webhookUrl, apiKey, resumeText, preferences } = settings;

  if (!webhookUrl?.trim()) {
    throw new Error("Webhook URL is missing. Please configure it in the Settings tab.");
  }

  if (!resumeText?.trim()) {
    throw new Error(
      "Baseline resume is missing. Please upload or paste your resume in the Settings tab.",
    );
  }

  const payload: OutboundLeadPayload = {
    timestamp: new Date().toISOString(),
    metadata: {
      sourceUrl: jobData.metadata.sourceUrl,
      pageTitle: jobData.metadata.pageTitle,
      domain: jobData.metadata.domain,
    },
    jobPosting: {
      rawText: jobData.rawText,
      characterCount: jobData.characterCount,
      wordCount: jobData.wordCount,
    },
    candidate: {
      resumeText,
      preferences,
    },
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey?.trim()) {
    headers["x-make-apikey"] = apiKey.trim();
  }

  // Set timeout to accommodate LLM evaluation and pipeline latency
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(webhookUrl.trim(), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Webhook returned HTTP ${response.status}: ${errorText || response.statusText}`,
      );
    }

    const responseText = await response.text();
    let json: any;

    try {
      json = JSON.parse(responseText);
    } catch {
      // Handle non-JSON responses from webhook providers
      if (responseText.trim() === "Accepted" || response.status === 200) {
        throw new Error(
          'Webhook received payload ("Accepted"), but returned plain text. Add a "Webhook Response" module to return JSON.',
        );
      }
      throw new Error(`Endpoint returned non-JSON response: ${responseText.slice(0, 120)}`);
    }

    if (typeof json !== "object" || json === null) {
      throw new Error("Received an invalid response from the webhook endpoint.");
    }

    return {
      success: json.success ?? true,
      fitScore: typeof json.fitScore === "number" ? json.fitScore : 75,
      summary: {
        company: json.summary?.company || "Company",
        role: json.summary?.role || jobData.metadata.pageTitle,
        workSetup: json.summary?.workSetup || preferences.workSetup || "Remote",
        extractedSalary: json.summary?.extractedSalary,
        stackMatch: Array.isArray(json.summary?.stackMatch) ? json.summary.stackMatch : [],
        missingSkills: Array.isArray(json.summary?.missingSkills) ? json.summary.missingSkills : [],
      },
      gapAnalysis: json.gapAnalysis || "Analysis completed successfully.",
      notionUrl: json.notionUrl,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timed out after 45 seconds. Check your webhook endpoint.");
    }
    throw error;
  }
}
