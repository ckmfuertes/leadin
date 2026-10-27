import { storage } from "wxt/utils/storage";
import type { LeadInSettings, UserPreferences } from "../types";
import type { ExtractedJobData, AnalysisResponse } from "../types/tracker";

export const DEFAULT_PREFERENCES: UserPreferences = {
  minRate: "15000",
  currency: "PHP",
  ratePeriod: "/ mo",
  workSetup: "Any",
  customNotes: "",
};

export const DEFAULT_SETTINGS: LeadInSettings = {
  webhookUrl: "",
  apiKey: "",
  jobBoardUrl: "",
  resumeText: "",
  preferences: DEFAULT_PREFERENCES,
};

export interface ActiveAnalysisState {
  status: "idle" | "loading" | "result" | "error";
  startedAt?: number;
  jobData?: ExtractedJobData | null;
  result?: AnalysisResponse | null;
  errorMessage?: string | null;
}

// Storage definitions backed by chrome.storage.local
export const webhookUrlStorage = storage.defineItem<string>("local:webhookUrl", {
  defaultValue: "",
});

export const apiKeyStorage = storage.defineItem<string>("local:apiKey", {
  defaultValue: "",
});

export const jobBoardUrlStorage = storage.defineItem<string>("local:jobBoardUrl", {
  defaultValue: "",
});

export const resumeTextStorage = storage.defineItem<string>("local:resumeText", {
  defaultValue: "",
});

export const preferencesStorage = storage.defineItem<UserPreferences>("local:preferences", {
  defaultValue: DEFAULT_PREFERENCES,
});

export const activeAnalysisStorage = storage.defineItem<ActiveAnalysisState>("local:activeAnalysis", {
  defaultValue: { status: "idle" },
});

// Reads all stored configuration values concurrently
export async function loadAllSettings(): Promise<LeadInSettings> {
  const [webhookUrl, apiKey, jobBoardUrl, resumeText, preferences] = await Promise.all([
    webhookUrlStorage.getValue(),
    apiKeyStorage.getValue(),
    jobBoardUrlStorage.getValue(),
    resumeTextStorage.getValue(),
    preferencesStorage.getValue(),
  ]);

  return {
    webhookUrl,
    apiKey,
    jobBoardUrl,
    resumeText,
    preferences: preferences || DEFAULT_PREFERENCES,
  };
}

// Writes all updated configuration values to local storage
export async function saveAllSettings(settings: LeadInSettings): Promise<void> {
  await Promise.all([
    webhookUrlStorage.setValue(settings.webhookUrl),
    apiKeyStorage.setValue(settings.apiKey),
    jobBoardUrlStorage.setValue(settings.jobBoardUrl || ""),
    resumeTextStorage.setValue(settings.resumeText),
    preferencesStorage.setValue(settings.preferences),
  ]);
}

// Active analysis state persistence helpers
export async function loadActiveAnalysis(): Promise<ActiveAnalysisState> {
  return (await activeAnalysisStorage.getValue()) || { status: "idle" };
}

export async function saveActiveAnalysis(state: ActiveAnalysisState): Promise<void> {
  await activeAnalysisStorage.setValue(state);
}

export async function clearActiveAnalysis(): Promise<void> {
  await activeAnalysisStorage.setValue({ status: "idle" });
}
