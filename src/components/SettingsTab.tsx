import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Upload, Check, Loader2, X, Save } from "lucide-react";
import type { LeadInSettings, Currency, RatePeriod, WorkSetup } from "../types";
import { extractTextFromPdf } from "../lib/pdf";
import { DEFAULT_SETTINGS } from "../lib/storage";

interface SettingsTabProps {
  initialSettings?: LeadInSettings | null;
  focusField?: string | null;
  onSave?: (settings: LeadInSettings) => Promise<void> | void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ initialSettings, focusField, onSave }) => {
  // Declare states
  const [form, setForm] = useState<LeadInSettings>(initialSettings || DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const jobBoardInputRef = useRef<HTMLInputElement>(null);

  // Sync form state when storage finishes loading
  useEffect(() => {
    if (initialSettings) {
      setForm(initialSettings);
    }
  }, [initialSettings]);

  // Auto-focus requested field if navigated from quick action
  useEffect(() => {
    if (focusField === "jobBoardUrl" && jobBoardInputRef.current) {
      jobBoardInputRef.current.focus();
      jobBoardInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusField]);

  const updateField = <K extends keyof LeadInSettings>(key: K, value: LeadInSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePreference = <K extends keyof LeadInSettings["preferences"]>(
    key: K,
    value: LeadInSettings["preferences"][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  };

  // Compare against baseline to detect unsaved changes
  const baseline = initialSettings || DEFAULT_SETTINGS;
  const hasChanges =
    form.webhookUrl.trim() !== baseline.webhookUrl.trim() ||
    form.apiKey.trim() !== baseline.apiKey.trim() ||
    (form.jobBoardUrl || "").trim() !== (baseline.jobBoardUrl || "").trim() ||
    form.resumeText.trim() !== baseline.resumeText.trim() ||
    form.preferences.minRate.trim() !== baseline.preferences.minRate.trim() ||
    form.preferences.currency !== baseline.preferences.currency ||
    form.preferences.ratePeriod !== baseline.preferences.ratePeriod ||
    form.preferences.workSetup !== baseline.preferences.workSetup ||
    (form.preferences.customNotes || "").trim() !== (baseline.preferences.customNotes || "").trim();

  // Validate required configuration fields
  const isFormValid =
    form.webhookUrl.trim() !== "" &&
    form.resumeText.trim() !== "" &&
    (form.webhookUrl.trim().startsWith("http://") || form.webhookUrl.trim().startsWith("https://"));

  const canSave = isFormValid && hasChanges && !isSaving;

  // Handle PDF file uploads and parse text
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    try {
      setIsParsingPdf(true);
      setPdfFileName(file.name);
      const text = await extractTextFromPdf(file);
      updateField("resumeText", text);
    } catch (err: any) {
      console.error("PDF Parsing Error:", err);
      alert("Failed to parse PDF: " + (err.message || "Unknown error"));
      setPdfFileName(null);
    } finally {
      setIsParsingPdf(false);
      e.target.value = "";
    }
  };

  const handleClearPdf = () => {
    setPdfFileName(null);
    updateField("resumeText", "");
  };

  const handleSave = async () => {
    if (!isFormValid || isSaving) return;
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(form);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = form.resumeText.trim() ? form.resumeText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3.5 text-slate-800">
      {/* Endpoints */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Webhook URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            placeholder="https://hook.us1.make.com/..."
            value={form.webhookUrl}
            onChange={(e) => updateField("webhookUrl", e.target.value)}
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
              placeholder="x-make-apikey header (optional)"
              value={form.apiKey}
              onChange={(e) => updateField("apiKey", e.target.value)}
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">Notion / Job Board URL</label>
          </div>
          <input
            ref={jobBoardInputRef}
            type="url"
            placeholder="https://notion.so/your-job-tracker-board (optional)"
            value={form.jobBoardUrl || ""}
            onChange={(e) => updateField("jobBoardUrl", e.target.value)}
            className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition ${
              focusField === "jobBoardUrl"
                ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20"
                : "border-slate-200/70"
            }`}
          />
        </div>
      </div>

      {/* Resume */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            Resume / CV Text <span className="text-red-500">*</span>
          </label>

          {wordCount > 0 && (
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 font-mono">
              {wordCount} words
            </span>
          )}
        </div>

        {/* PDF File Picker */}
        <div className="relative">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            id="resume-pdf-upload"
            className="hidden"
          />
          <label
            htmlFor="resume-pdf-upload"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800 transition active:scale-[0.99]"
          >
            {isParsingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Extracting Text from PDF...</span>
              </>
            ) : pdfFileName ? (
              <>
                <span className="truncate max-w-[200px] text-teal-700 font-medium">
                  {pdfFileName}
                </span>
                <span className="text-slate-400 text-[10px]">(click to change)</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>Upload Resume PDF</span>
              </>
            )}
          </label>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={5}
            placeholder="Paste your raw resume text here, or upload your PDF above..."
            value={form.resumeText}
            onChange={(e) => updateField("resumeText", e.target.value)}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none transition leading-relaxed font-sans"
          />
          {form.resumeText && (
            <button
              type="button"
              onClick={handleClearPdf}
              title="Clear text"
              className="absolute right-2.5 bottom-3.5 p-1 text-slate-400 hover:text-slate-600 bg-white/80 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Target Criteria */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <h3 className="text-xs font-semibold text-slate-700">Target Criteria</h3>

        {/* Rate Row */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Minimum Expected Rate
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="15000"
                value={form.preferences.minRate}
                onChange={(e) => updatePreference("minRate", e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition font-mono"
              />
            </div>

            <select
              value={form.preferences.currency}
              onChange={(e) => updatePreference("currency", e.target.value as Currency)}
              className="px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200/70 rounded-xl text-slate-700 outline-none focus:outline-none focus:bg-white focus:border-teal-500 transition"
            >
              <option value="PHP">PHP</option>
              <option value="USD">USD</option>
            </select>

            <select
              value={form.preferences.ratePeriod}
              onChange={(e) => updatePreference("ratePeriod", e.target.value as RatePeriod)}
              className="px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200/70 rounded-xl text-slate-700 outline-none focus:outline-none focus:bg-white focus:border-teal-500 transition"
            >
              <option value="/ hr">/ hr</option>
              <option value="/ mo">/ mo</option>
              <option value="/ yr">/ yr</option>
            </select>
          </div>
        </div>

        {/* Work Setup */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Preferred Work Setup
          </label>
          <select
            value={form.preferences.workSetup}
            onChange={(e) => updatePreference("workSetup", e.target.value as WorkSetup)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-700 outline-none focus:outline-none focus:bg-white focus:border-teal-500 transition font-medium"
          >
            <option value="Any">Any</option>
            <option value="Remote">Remote </option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Custom Guidance
          </label>
          <textarea
            rows={4}
            placeholder="e.g. Flag roles requiring weekend work or night shifts. Prioritize leadership opportunities and strong team culture."
            value={form.preferences.customNotes}
            onChange={(e) => updatePreference("customNotes", e.target.value)}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none transition leading-relaxed"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-1">
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition duration-150 text-white shadow-sm ${
            canSave
              ? "bg-teal-600 hover:bg-teal-700 active:scale-[0.99] cursor-pointer"
              : "bg-teal-600 opacity-40 cursor-not-allowed shadow-none"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : hasChanges ? (
            <>
              <Save className="w-4 h-4 stroke-[3]" />
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Saved</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
