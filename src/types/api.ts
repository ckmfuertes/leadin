import type { ExtractedJobMetadata, ExtractedJobData, JobAnalysisSummary, AnalysisResponse } from './tracker';
import type { Currency, RatePeriod, WorkSetup, UserPreferences, LeadInSettings } from './index';

export interface OutboundLeadPayload {
  timestamp: string;
  metadata: {
    sourceUrl: string;
    pageTitle: string;
    domain: string;
  };
  jobPosting: {
    rawText: string;
    characterCount: number;
    wordCount: number;
  };
  candidate: {
    resumeText: string;
    preferences: UserPreferences;
  };
}

export type {
  ExtractedJobMetadata,
  ExtractedJobData,
  JobAnalysisSummary,
  AnalysisResponse,
  Currency,
  RatePeriod,
  WorkSetup,
  UserPreferences,
  LeadInSettings,
};

