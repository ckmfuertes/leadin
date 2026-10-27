export interface ExtractedJobMetadata {
  sourceUrl: string;
  pageTitle: string;
  domain: string;
}

export interface ExtractedJobData {
  metadata: ExtractedJobMetadata;
  rawText: string;
  characterCount: number;
  wordCount: number;
}

export interface JobAnalysisSummary {
  company: string;
  role: string;
  workSetup: string;
  extractedSalary?: string;
  stackMatch: string[];
  missingSkills?: string[];
}

export interface AnalysisResponse {
  success: boolean;
  fitScore: number;
  summary: JobAnalysisSummary;
  gapAnalysis: string;
  notionUrl?: string;
  error?: string;
}

