import { buildExtractionPrompt } from "./prompt";
import { CrmRecord, FieldMapping, RawRow, SkippedRecord } from "./types";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const BATCH_SIZE = 25;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;
const MAX_CONCURRENT_BATCHES = 5; // stay well under free-tier RPM even with several batches in flight

interface BatchResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  fieldMappings: FieldMapping[];
  batchIndex: number;
  failed?: boolean;
  error?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Strips accidental markdown fences some models still add despite JSON mode. */
function cleanJson(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

async function callGeminiOnce(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

async function processBatchWithRetry(
  rows: RawRow[],
  batchIndex: number,
  apiKey: string,
): Promise<BatchResult> {
  const prompt = buildExtractionPrompt(rows);
  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callGeminiOnce(prompt, apiKey);
      const parsed = JSON.parse(cleanJson(raw));

      return {
        imported: Array.isArray(parsed.imported) ? parsed.imported : [],
        skipped: Array.isArray(parsed.skipped) ? parsed.skipped : [],
        fieldMappings: Array.isArray(parsed.fieldMappings) ? parsed.fieldMappings : [],
        batchIndex,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  // All retries exhausted — mark whole batch as skipped rather than losing rows silently.
  return {
    imported: [],
    skipped: rows.map((row) => ({ row, reason: `AI extraction failed after ${MAX_RETRIES + 1} attempts: ${lastError}` })),
    fieldMappings: [],
    batchIndex,
    failed: true,
    error: lastError,
  };
}

export async function extractLeadsWithGemini(
  rows: RawRow[],
  apiKey: string,
  onBatchDone?: (done: number, total: number) => void,
) {
  const batches = chunk(rows, BATCH_SIZE);
  const results: BatchResult[] = new Array(batches.length);
  let completedCount = 0;
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= batches.length) return;
      results[i] = await processBatchWithRetry(batches[i], i, apiKey);
      completedCount++;
      onBatchDone?.(completedCount, batches.length);
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_BATCHES, batches.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  results.sort((a, b) => a.batchIndex - b.batchIndex);

  const imported = results.flatMap((r) => r.imported);
  const skipped = results.flatMap((r) => r.skipped);
  const mappingSeen = new Set<string>();
  const fieldMappings = results
    .flatMap((r) => r.fieldMappings)
    .filter((m) => {
      const key = `${m.sourceColumn}::${m.crmField}`;
      if (mappingSeen.has(key)) return false;
      mappingSeen.add(key);
      return true;
    });

  const failedBatches = results.filter((r) => r.failed).length;

  return {
    imported,
    skipped,
    fieldMappings,
    totalImported: imported.length,
    totalSkipped: skipped.length,
    failedBatches,
    totalBatches: batches.length,
  };
}