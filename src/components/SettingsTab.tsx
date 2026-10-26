import React, { useState } from "react";
import { Eye, EyeOff, Upload, Check, Loader2, X } from "lucide-react";
import type { LeadInSettings, Currency, RatePeriod, WorkSetup } from "../types";
import { extractTextFromPdf } from "../lib/pdf";

interface SettingsTabProps {
  onSave?: (settings: LeadInSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onSave }) => {
  // Required fields with defaults
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [jobBoardUrl, setJobBoardUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [minRate, setMinRate] = useState("15000");
  const [currency, setCurrency] = useState<Currency>("PHP");
  const [ratePeriod, setRatePeriod] = useState<RatePeriod>("/ mo");
  const [workSetup, setWorkSetup] = useState<WorkSetup>("Any");
  const [customNotes, setCustomNotes] = useState("");

  // UX State
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Validation
  const isUrlValid =
    webhookUrl.trim().startsWith("http://") || webhookUrl.trim().startsWith("https://");
  const isResumeValid = resumeText.trim().length > 20;
  const isRateValid = minRate.trim().length > 0 && Number(minRate) > 0;
  const isFormValid = isUrlValid && isResumeValid && isRateValid;

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfFileName(file.name);

    try {
      const extracted = await extractTextFromPdf(file);
      if (extracted.trim()) {
        setResumeText(extracted);
      }
    } catch (err) {
      console.error("PDF extraction failed:", err);
    } finally {
      setIsParsingPdf(false);
      e.target.value = "";
    }
  };

  const handleSave = () => {
    if (!isFormValid) return;

    const settings: LeadInSettings = {
      webhookUrl: webhookUrl.trim(),
      apiKey: apiKey.trim(),
      jobBoardUrl: jobBoardUrl.trim(),
      resumeText: resumeText.trim(),
      preferences: {
        minRate: minRate.trim(),
        currency,
        ratePeriod,
        workSetup,
        customNotes: customNotes.trim(),
      },
    };

    onSave?.(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3.5 text-slate-800">
      {/* 1. Endpoint Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Webhook URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            placeholder="https://hook.us1.make.com/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            API Secret Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              placeholder="x-make-apikey header"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Job Board URL</label>
          <input
            type="url"
            placeholder="https://notion.so/your-job-tracker-board"
            value={jobBoardUrl}
            onChange={(e) => setJobBoardUrl(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
          />
        </div>
      </div>

      {/* 2. Resume Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Resume Profile <span className="text-red-500">*</span>
            </label>
            {wordCount > 0 && (
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                {wordCount} words
              </span>
            )}
          </div>

          <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition cursor-pointer border border-teal-200/60">
            {isParsingPdf ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Reading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                <span>Upload PDF</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf"
              disabled={isParsingPdf}
              onChange={handlePdfUpload}
              className="hidden"
            />
          </label>
        </div>

        {pdfFileName && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
            <span className="truncate font-medium">{pdfFileName}</span>
            <button
              type="button"
              onClick={() => {
                setPdfFileName(null);
                setResumeText("");
              }}
              className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <textarea
          rows={5}
          placeholder="Paste plain-text ATS-friendly resume or click Upload PDF above..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          className="w-full p-3 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none transition leading-relaxed"
        />
      </div>

      {/* 3. Criteria & Preferences Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Min Compensation <span className="text-red-500">*</span>
          </label>
          <div className="flex rounded-xl border border-slate-200/70 bg-slate-50 focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 overflow-hidden transition">
            <input
              type="number"
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-transparent outline-none focus:outline-none"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="px-3 text-xs font-semibold bg-slate-100/80 border-l border-slate-200 text-slate-700 outline-none focus:outline-none cursor-pointer"
            >
              <option value="PHP">PHP (₱)</option>
              <option value="USD">USD ($)</option>
            </select>
            <select
              value={ratePeriod}
              onChange={(e) => setRatePeriod(e.target.value as RatePeriod)}
              className="px-3 text-xs font-semibold bg-slate-100/80 border-l border-slate-200 text-slate-700 outline-none focus:outline-none cursor-pointer"
            >
              <option value="/ mo">/ month</option>
              <option value="/ hr">/ hour</option>
              <option value="/ yr">/ year</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Work Setup <span className="text-red-500">*</span>
          </label>
          <select
            value={workSetup}
            onChange={(e) => setWorkSetup(e.target.value as WorkSetup)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 cursor-pointer transition font-medium"
          >
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
            <option value="Any">Any Setup</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Custom Guidance
          </label>
          <textarea
            rows={4}
            placeholder="e.g. Flag roles requiring weekend work or night shifts. Prioritize leadership opportunities and strong team culture."
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none transition leading-relaxed"
          />
        </div>
      </div>

      {/* 4. Action Save Button (Rounded, tactile pill like Peek) */}
      <div className="pt-1">
        <button
          type="button"
          disabled={!isFormValid}
          onClick={handleSave}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition duration-200 text-white shadow-md cursor-pointer ${
            savedSuccess
              ? "bg-emerald-500 shadow-emerald-500/20"
              : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Saved Settings</span>
            </>
          ) : (
            <>
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
