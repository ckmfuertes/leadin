import { defineConfig } from "wxt";
import path from "node:path";

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],

  vite: () => ({
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),

  manifest: {
    name: "LeadIn - AI Job Lead Tracker",
    description:
      "Capture job postings, match against your resume, and track leads in your automated pipeline.",
    version: "1.0.0",
    permissions: ["storage", "activeTab", "scripting"],
  },
});
