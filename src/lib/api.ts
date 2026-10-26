import type { ExtractedJobData, AnalysisResponse } from '../types/tracker';
import type { LeadInSettings } from '../types';
import type { OutboundLeadPayload } from '../types/api';

/**
 * Dispatches the captured lead payload to the user-configured webhook endpoint.
 */
export async function dispatchLeadAnalysis(
  jobData: ExtractedJobData,
  settings: LeadInSettings
): Promise<AnalysisResponse> {
  const { webhookUrl, apiKey, resumeText, preferences } = settings;

  if (!webhookUrl || !webhookUrl.trim()) {
    throw new Error('Webhook URL is missing. Please configure it in the Settings tab.');
  }

  if (!resumeText || !resumeText.trim()) {
    throw new Error('Baseline resume is missing. Please upload or paste your resume in the Settings tab.');
  }

  // Construct standard payload matching PRD Section 5.2
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
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim()) {
    headers['x-make-apikey'] = apiKey.trim();
  }

  // Dispatch network POST with a 45-second timeout (giving the LLM plenty of time to respond)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Webhook returned HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    const responseText = await response.text();
    let json: any;

    try {
      json = JSON.parse(responseText);
    } catch {
      // Endpoint returned non-JSON (like Make.com's default "Accepted" text)
      if (responseText.trim() === 'Accepted' || response.status === 200) {
        throw new Error(
          'Webhook received the payload ("Accepted"), but returned plain text instead of JSON. In Make.com, add a "Webhook Response" module at the end of your scenario to return the fit score.'
        );
      }
      throw new Error(`Endpoint returned non-JSON response: ${responseText.slice(0, 120)}`);
    }

    // Verify minimum required fields from PRD Section 5.3
    if (typeof json !== 'object' || json === null) {
      throw new Error('Received an invalid response from the webhook endpoint.');
    }

    return {
      success: json.success ?? true,
      fitScore: typeof json.fitScore === 'number' ? json.fitScore : 75,
      summary: {
        company: json.summary?.company || 'Company',
        role: json.summary?.role || jobData.metadata.pageTitle,
        workSetup: json.summary?.workSetup || preferences.workSetup || 'Remote',
        extractedSalary: json.summary?.extractedSalary,
        stackMatch: Array.isArray(json.summary?.stackMatch) ? json.summary.stackMatch : [],
        missingSkills: Array.isArray(json.summary?.missingSkills) ? json.summary.missingSkills : [],
      },
      gapAnalysis: json.gapAnalysis || 'Analysis completed successfully.',
      notionUrl: json.notionUrl,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 45 seconds. Check your webhook endpoint.');
    }
    throw error;
  }
}

