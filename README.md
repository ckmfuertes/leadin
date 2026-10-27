# LeadIn 🎯

> **Open-source, Bring Your Own Endpoint (BYOE) Chrome extension to ingest job postings, analyze skill gaps, and track applications in your personal pipeline.**

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-MV3-0d9488.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Built with WXT](https://img.shields.io/badge/Built%20with-WXT-5eead4.svg?color=0d9488)](https://wxt.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

---

## Why LeadIn?

Most job application trackers force you into their proprietary web app, store your data on their servers, or charge a monthly subscription.

**LeadIn is different.** It is built on the **BYOE (Bring Your Own Endpoint)** philosophy:

- **Zero Vendor Lock-in:** You own your data. LeadIn dispatches clean JSON directly to your webhook (Make.com, n8n, Zapier, Cloudflare Worker, or your own server).
- **Client-Side Privacy:** Your PDF resume is parsed locally in the browser using `pdfjs-dist`. Raw binary files are never sent over the wire.
- **Instant Extraction:** Highlight any text on any job board (LinkedIn, Indeed, Wellfound, personal career sites) and click the extension. If you don't highlight anything, LeadIn automatically grabs the job description container.
- **Actionable AI Feedback:** View your fit score, matching strengths, missing skill gaps, and an AI overview right inside the extension popup.
- **One-Click Notion Jump:** A direct link button takes you straight to the newly created row in your Notion database.

---

## Features

- **DOM Extraction with Fallback:** Pulls highlighted text, page title, and domain. Falls back to job content selectors (`<main>`, `#jobDescriptionText`, `.jobs-description`) capped safely at 12,000 characters.
- **Editable Job Review:** Review and edit extracted job descriptions live before sending. Includes a real-time character count and a warning for short descriptions (<100 characters).
- **Client-Side PDF Resume Parser:** Upload your PDF resume in Settings. LeadIn extracts plain text and computes live word count.
- **Compensation & Role Preferences:** Set minimum rate, currency (PHP, USD), rate period (/ hr, / mo, / yr), and work arrangement (Remote, Hybrid, Onsite, Any).
- **Fit Score Dial:** High-contrast SVG gauge with color thresholds (Emerald for 80%+, Teal for 60-79%, Amber for 40-59%, Rose for <40%).
- **Interactive Chip States:** Matched skills (soft teal) and missing skills (soft rose) chips with clean pill badges.
- **Resilient Webhook Client:** 45-second timeout, `x-make-apikey` header support, and developer-friendly error messaging for default `"Accepted"` Make.com responses.
- **Background Execution & State Persistence:** Analyzing is dispatched through a Chrome MV3 background service worker so closing the popup never aborts in-flight requests. Results persist across popup closures until explicitly resetting.
- **Smart Notion Quick Navigation:** Direct contextual shortcuts to view your Notion board or jump straight to configuring it in Settings.

---

## Architecture & Data Contracts

LeadIn acts as the lightweight browser client. Your automation pipeline (Make.com, n8n, etc.) handles the LLM prompt and database storage.

```
[ Active Job Tab ]
       │
       ▼
 [ LeadIn Popup ] ── (Locally parses Resume PDF)
       │
       ▼ (Background Message)
 [ Background Worker ] ── (POST Outbound Payload)
       │
       ▼
[ Your Webhook (Make.com / n8n / Serverless) ]
       │
       ├─► Send to LLM (Gemini / Claude / OpenAI) for gap analysis
       ├─► Insert row into your Notion / Airtable board
       │
       ▼ (JSON Inbound Response)
 [ Background Worker ] ── (Persists into local storage)
       │
       ▼
  [ LeadIn Popup ] ──► Displays Fit Score, Skills Chips & Notion Link
```

### Outbound Webhook Payload (LeadIn ➔ Your Endpoint)

When you click **Analyze & Track**, LeadIn sends a `POST` request with `Content-Type: application/json`:

```json
{
  "timestamp": "2026-10-27T13:40:00.000Z",
  "metadata": {
    "sourceUrl": "https://www.linkedin.com/jobs/view/1234567890",
    "pageTitle": "Senior Frontend Engineer - Acme Corp",
    "domain": "linkedin.com"
  },
  "jobPosting": {
    "rawText": "We are seeking a Senior Frontend Engineer proficient in React, TypeScript...",
    "characterCount": 4250,
    "wordCount": 612
  },
  "candidate": {
    "resumeText": "Experienced engineer with 5+ years of building web applications...",
    "preferences": {
      "minRate": "15000",
      "currency": "PHP",
      "ratePeriod": "/ mo",
      "workSetup": "Remote",
      "customNotes": "Prioritize roles with modern React and TypeScript stacks."
    }
  }
}
```

If you configured an **API Key** in Settings, it is sent in the `x-make-apikey` request header.

### Inbound Response Payload (Your Endpoint ➔ LeadIn)

Your webhook must respond with HTTP 200 and a JSON body matching this shape:

```json
{
  "success": true,
  "fitScore": 88,
  "summary": {
    "company": "Acme Corp",
    "role": "Senior Frontend Engineer",
    "workSetup": "Remote",
    "extractedSalary": "$120,000 / yr",
    "stackMatch": ["React", "TypeScript", "Tailwind CSS", "REST APIs"],
    "missingSkills": ["GraphQL", "Kubernetes", "Docker"]
  },
  "gapAnalysis": "Strong match with frontend core requirements. Some experience gaps in backend containerization.",
  "notionUrl": "https://www.notion.so/acme-corp-lead-abc123xyz"
}
```

> **Note for Make.com Users:** By default, Make.com webhooks return plain text `"Accepted"`. To return the analysis back to LeadIn, add a **Webhook Response** module at the end of your Make.com scenario that returns the JSON body above.

---

## Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### 1. Clone the repository

```bash
git clone https://github.com/ckmfuertes/leadin.git
cd leadin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development mode

```bash
npm run dev
```

WXT will build the extension and output it to `.output/chrome-mv3`.

### 4. Load the extension in Chrome

1. Open Google Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` folder inside the `leadin` directory.
5. Pin LeadIn to your Chrome toolbar.

### 5. Production build

To create a minified production build:

```bash
npm run build
```

To package a `.zip` archive ready for distribution:

```bash
npm run zip
```

---

## Project Structure

```
leadin/
├── entrypoints/
│   ├── background.ts        # MV3 background service worker for reliable async dispatch
│   └── popup/               # Extension popup entry point
│       ├── App.tsx          # Main tab layout & state management
│       ├── main.tsx         # React root mount
│       └── style.css        # Tailwind directives & Chrome outline resets
├── src/
│   ├── components/
│   │   ├── SettingsTab.tsx  # Endpoint config, PDF parser, compensation controls
│   │   └── TrackerTab.tsx   # Capture preview, live edit, fit dial, chips & Notion CTA
│   ├── lib/
│   │   ├── api.ts           # Webhook POST client & error handling
│   │   ├── extractor.ts     # Active tab DOM extraction logic
│   │   ├── pdf.ts           # Client-side PDF text parser (pdfjs-dist)
│   │   └── storage.ts       # Typed chrome.storage wrapper
│   └── types/               # TypeScript data models and contracts
├── public/
│   ├── icon.svg             # Vector source logo
│   └── icon/                # Rasterized icons (16, 32, 48, 96, 128)
├── wxt.config.ts            # WXT configuration & MV3 permissions
└── tailwind.config.js       # Styling configuration
```

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/ckmfuertes/leadin/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

Developed by [Cherwen Kirk Fuertes](https://github.com/ckmfuertes).
