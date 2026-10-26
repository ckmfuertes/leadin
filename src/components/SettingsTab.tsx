import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Upload, Check, Loader2, X } from 'lucide-react';
import type { LeadInSettings, Currency, RatePeriod, WorkSetup } from '../types';
import { extractTextFromPdf } from '../lib/pdf';
import { DEFAULT_SETTINGS } from '../lib/storage';

interface SettingsTabProps {
  initialSettings?: LeadInSettings | null;
  onSave?: (settings: LeadInSettings) => Promise<void> | void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ initialSettings, onSave }) => {
  // Single source of truth for form data initialized with DEFAULT_SETTINGS
  const [form, setForm] = useState<LeadInSettings>(initialSettings || DEFAULT_SETTINGS);

  // UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync whenever initialSettings loads from chrome.storage
  useEffect(() => {
    if (initialSettings) {
      setForm(initialSettings);
    }
  }, [initialSettings]);

  // Form field updater helpers
  const updateField = <K extends keyof LeadInSettings>(key: K, value: LeadInSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePreference = <K extends keyof LeadInSettings['preferences']>(
    key: K,
    value: LeadInSettings['preferences'][K]
  ) => {
    setForm((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  };

  // Compare against baseline (initialSettings or DEFAULT_SETTINGS)
  const baseline = initialSettings || DEFAULT_SETTINGS;
  const hasChanges =
    form.webhookUrl.trim() !== baseline.webhookUrl.trim() ||
    form.apiKey.trim() !== baseline.apiKey.trim() ||
    (form.jobBoardUrl || '').trim() !== (baseline.jobBoardUrl || '').trim() ||
    form.resumeText.trim() !== baseline.resumeText.trim() ||
    form.preferences.minRate.trim() !== baseline.preferences.minRate.trim() ||
    form.preferences.currency !== baseline.preferences.currency ||
    form.preferences.ratePeriod !== baseline.preferences.ratePeriod ||
    form.preferences.workSetup !== baseline.preferences.workSetup ||
    form.preferences.customNotes.trim() !== baseline.preferences.customNotes.trim();

  // Validation
  const isUrlValid = form.webhookUrl.trim().startsWith('http://') || form.webhookUrl.trim().startsWith('https://');
  const isResumeValid = form.resumeText.trim().length > 20;
  const isRateValid = form.preferences.minRate.trim().length > 0 && Number(form.preferences.minRate) > 0;
  const isFormValid = isUrlValid && isResumeValid && isRateValid && hasChanges;

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfFileName(file.name);

    try {
      const extracted = await extractTextFromPdf(file);
      if (extracted.trim()) {
        updateField('resumeText', extracted);
      }
    } catch (err) {
      console.error('PDF extraction failed:', err);
    } finally {
      setIsParsingPdf(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!isFormValid || isSaving) return;

    setIsSaving(true);
    const cleanedSettings: LeadInSettings = {
      webhookUrl: form.webhookUrl.trim(),
      apiKey: form.apiKey.trim(),
      jobBoardUrl: (form.jobBoardUrl || '').trim(),
      resumeText: form.resumeText.trim(),
      preferences: {
        minRate: form.preferences.minRate.trim(),
        currency: form.preferences.currency,
        ratePeriod: form.preferences.ratePeriod,
        workSetup: form.preferences.workSetup,
        customNotes: form.preferences.customNotes.trim(),
      },
    };

    try {
      await onSave?.(cleanedSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = form.resumeText.trim() ? form.resumeText.trim().split(/\s+/).length : 0;

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
            value={form.webhookUrl}
            onChange={(e) => updateField('webhookUrl', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            API Secret Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="x-make-apikey header (optional)"
              value={form.apiKey}
              onChange={(e) => updateField('apiKey', e.target.value)}
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
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Job Board URL
          </label>
          <input
            type="url"
            placeholder="https://notion.so/your-job-tracker-board (optional)"
            value={form.jobBoardUrl || ''}
            onChange={(e) => updateField('jobBoardUrl', e.target.value)}
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
                updateField('resumeText', '');
              }}
              className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <textarea
          rows={5}
          placeholder="Paste plain-text resume or click Upload PDF above..."
          value={form.resumeText}
          onChange={(e) => updateField('resumeText', e.target.value)}
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
              value={form.preferences.minRate}
              onChange={(e) => updatePreference('minRate', e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-transparent outline-none focus:outline-none"
            />
            <select
              value={form.preferences.currency}
              onChange={(e) => updatePreference('currency', e.target.value as Currency)}
              className="px-3 text-xs font-semibold bg-slate-100/80 border-l border-slate-200 text-slate-700 outline-none focus:outline-none cursor-pointer"
            >
              <option value="PHP">PHP (₱)</option>
              <option value="USD">USD ($)</option>
            </select>
            <select
              value={form.preferences.ratePeriod}
              onChange={(e) => updatePreference('ratePeriod', e.target.value as RatePeriod)}
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
            value={form.preferences.workSetup}
            onChange={(e) => updatePreference('workSetup', e.target.value as WorkSetup)}
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
            value={form.preferences.customNotes}
            onChange={(e) => updatePreference('customNotes', e.target.value)}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200/70 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none transition leading-relaxed"
          />
        </div>
      </div>

      {/* 4. Action Save Button */}
      <div className="pt-1">
        <button
          type="button"
          disabled={!isFormValid || isSaving}
          onClick={handleSave}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition duration-200 text-white shadow-md cursor-pointer ${
            isFormValid
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/20 active:scale-[0.98]'
              : 'bg-gradient-to-r from-teal-500 to-emerald-500 opacity-40 cursor-not-allowed shadow-none'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : hasChanges ? (
            <span>Save Settings</span>
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
