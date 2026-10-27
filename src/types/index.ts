export type Currency = 'USD' | 'PHP';
export type RatePeriod = '/ hr' | '/ mo' | '/ yr';
export type WorkSetup = 'Remote' | 'Hybrid' | 'Onsite' | 'Any';

export interface UserPreferences {
  minRate: string;
  currency: Currency;
  ratePeriod: RatePeriod;
  workSetup: WorkSetup;
  customNotes: string;
} 

export interface LeadInSettings {
  webhookUrl: string;
  apiKey: string;
  jobBoardUrl?: string;
  resumeText: string;
  preferences: UserPreferences;
}

