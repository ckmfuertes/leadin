import * as pdfjsLib from "pdfjs-dist";

// Point to the bundled pdf.js worker script
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Reads and concatenates text content across all pages of a PDF file
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const textPieces: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => ("str" in item ? item.str : "")).join(" ");

    if (pageText.trim()) {
      textPieces.push(pageText.trim());
    }
  }

  return textPieces.join("\n\n");
}
