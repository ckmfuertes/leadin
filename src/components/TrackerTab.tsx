import React, { useState, useEffect } from "react";
import {
  Globe,
  RotateCw,
  Sparkles,
  Loader2,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Building2,
  DollarSign,
  MapPin,
  ArrowLeft,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import type { ExtractedJobData, AnalysisResponse } from "../types/tracker";
import type { LeadInSettings } from "../types";
import { extractActiveTabJobData } from "../lib/extractor";
import { dispatchLeadAnalysis } from "../lib/api";

interface TrackerTabProps {
  settings: LeadInSettings | null;
  onNavigateToSettings?: () => void;
}

export const TrackerTab: React.FC<TrackerTabProps> = ({ settings, onNavigateToSettings }) => {
  // Declare states
  const [viewState, setViewState] = useState<"preview" | "loading" | "result">("preview");
  const [jobData, setJobData] = useState<ExtractedJobData | null>(null);
  const [isExtracting, setIsExtracting] = useState(true);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pull job data from the active tab when the component mounts
  const handleExtractFromTab = async () => {
    setIsExtracting(true);
    setErrorMessage(null);
    try {
      const data = await extractActiveTabJobData();
      setJobData(data);
    } catch (err: any) {
      console.error("Extraction failed:", err);
      setErrorMessage("Failed to read tab: " + (err?.message || "Unknown error"));
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    handleExtractFromTab();
  }, []);

  // Handle the lead analysis process
  const handleStartAnalysis = async () => {
    if (!jobData || !jobData.rawText.trim()) return;

    if (!settings?.webhookUrl || !settings?.resumeText) {
      setErrorMessage("Webhook URL and Resume must be configured in Settings first.");
      return;
    }

    setViewState("loading");
    setErrorMessage(null);

    try {
      const response = await dispatchLeadAnalysis(jobData, settings);
      setResult(response);
      setViewState("result");
    } catch (err: any) {
      console.error("Dispatch failed:", err);
      setErrorMessage(err?.message || "Failed to dispatch lead to webhook.");
      setViewState("preview");
    }
  };

  // Reset the tracker to allow analyzing another job
  const handleReset = () => {
    setViewState("preview");
    setResult(null);
    setErrorMessage(null);
    handleExtractFromTab();
  };

  const isShort = (jobData?.characterCount ?? 0) < 100;
  const isLoading = viewState === "loading";
  const isSettingsMissing = !settings?.webhookUrl || !settings?.resumeText;

  return (
    <div className="space-y-3.5 text-slate-800">
      {/* Settings Missing Notice */}
      {isSettingsMissing && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Please configure your webhook & resume in the Settings tab.</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 flex items-start gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {viewState !== "result" && (
        <>
          {/* Page Info */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono leading-none">
                  {jobData?.metadata.domain || "Active Tab"}
                </p>
                <h3 className="text-xs font-semibold text-slate-900 truncate mt-1">
                  {isExtracting
                    ? "Detecting active page..."
                    : jobData?.metadata.pageTitle || "No active page detected"}
                </h3>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading || isExtracting}
              title="Re-grab current page highlight"
              onClick={handleExtractFromTab}
              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isExtracting ? "animate-spin text-teal-600" : ""}`}
              />
            </button>
          </div>

          {/* Extracted Job Description */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Extracted Job Description
              </span>

              {jobData && jobData.characterCount > 0 && (
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 font-mono">
                  {jobData.characterCount} chars · {jobData.wordCount} words
                </span>
              )}
            </div>

            {isShort && (jobData?.characterCount ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Highlight may be too brief for comprehensive gap analysis.</span>
              </div>
            )}

            <div className="relative">
              <textarea
                disabled={isLoading}
                rows={14}
                value={jobData?.rawText || ""}
                onChange={(e) => {
                  const newText = e.target.value;
                  const words = newText.trim() ? newText.trim().split(/\s+/).length : 0;
                  setJobData((prev) =>
                    prev
                      ? {
                          ...prev,
                          rawText: newText,
                          characterCount: newText.length,
                          wordCount: words,
                        }
                      : null,
                  );
                }}
                placeholder="No text highlighted. Highlight the job description on the webpage and click the re-grab button above, or type/paste directly here."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none transition leading-relaxed font-sans disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isLoading || !jobData?.rawText || isSettingsMissing}
              onClick={handleStartAnalysis}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition duration-150 text-white shadow-sm bg-teal-600 hover:bg-teal-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting & Scoring Lead...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze & Track</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {viewState === "result" && result && (
        /* Fit Score */
        <div className="space-y-3.5">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Evaluation Result
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {result.fitScore >= 80
                  ? "Strong Match"
                  : result.fitScore >= 60
                    ? "Moderate Fit"
                    : "Low Alignment"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Based on your resume and preferences</p>
            </div>

            <div className="flex items-baseline bg-teal-50 border border-teal-200/80 px-4 py-2.5 rounded-2xl">
              <span className="text-3xl font-black text-teal-700 tracking-tight leading-none">
                {result.fitScore}
              </span>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {result.summary.role}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{result.summary.company}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              {result.summary.extractedSalary && (
                <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                  <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                  <span>{result.summary.extractedSalary}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>{result.summary.workSetup}</span>
              </div>
            </div>
          </div>

          {/* Matched Skills   */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3.5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Matched Skills</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.summary.stackMatch.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 text-xs font-medium rounded-xl bg-teal-50 text-teal-800 border border-teal-200/50"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            {result.summary.missingSkills && result.summary.missingSkills.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 mb-2">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Missing Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.summary.missingSkills.map((gap) => (
                    <span
                      key={gap}
                      className="px-2.5 py-1 text-xs font-medium rounded-xl bg-rose-50 text-rose-800 border border-rose-200/50"
                    >
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Gap Analysis */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 block">AI Gap Analysis</span>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/50">
              {result.gapAnalysis}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1 pb-1">
            {result.notionUrl && (
              <a
                href={result.notionUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition duration-150 text-white shadow-sm bg-teal-600 hover:bg-teal-700 active:scale-[0.99]"
              >
                <span>View Entry in Notion</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 transition text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Track Another Job</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
