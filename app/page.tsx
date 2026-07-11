"use client";

import { useCallback, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PreviewTable } from "@/components/PreviewTable";
import { ResultTable } from "@/components/ResultTable";
import { MappingWires } from "@/components/MappingWires";
import { Stepper, StepKey } from "@/components/Stepper";
import { parseCsvFile, ParsedCsv } from "@/lib/csv";
import { ExtractResponse } from "@/lib/types";
import { ArrowRight, RotateCcw, Loader2 } from "lucide-react";

type ProgressState = { done: number; total: number } | null;

export default function Home() {
  const [step, setStep] = useState<StepKey>("upload");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please upload a .csv file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is larger than 5MB — trim it down and try again.");
      return;
    }
    try {
      const csv = await parseCsvFile(file);
      setParsed(csv);
      setStep("preview");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't parse that CSV.");
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!parsed) return;
    setStep("confirm");
    setApiError(null);
    setProgress({ done: 0, total: Math.max(1, Math.ceil(parsed.rows.length / 25)) });

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed.rows }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        try {
          const parsedErr = JSON.parse(text);
          throw new Error(parsedErr.error || "Extraction failed.");
        } catch {
          throw new Error(text || `Request failed with status ${res.status}`);
        }
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "progress") {
            setProgress({ done: event.done, total: event.total });
          } else if (event.type === "result") {
            setResult(event);
            setStep("result");
          } else if (event.type === "error") {
            throw new Error(event.error);
          }
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong during extraction.");
      setStep("preview");
    } finally {
    }
  }, [parsed]);

  const reset = useCallback(() => {
    setStep("upload");
    setParsed(null);
    setResult(null);
    setApiError(null);
    setProgress(null);
    setUploadError(null);
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-jade-deep">GrowEasy</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">
              CSV Lead Importer
            </h1>
          </div>
          {step !== "upload" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-ink/30 hover:text-ink"
            >
              <RotateCcw size={14} /> Start over
            </button>
          )}
        </div>
        <Stepper current={step} />
      </header>

      <main>
        {step === "upload" && (
          <section>
            <p className="mx-auto mb-8 max-w-2xl text-center text-ink-muted">
              Any layout works — Facebook Lead Ads, Google Ads, Excel exports, or a spreadsheet you made
              by hand. The AI figures out where everything goes.
            </p>
            <UploadZone onFile={handleFile} error={uploadError} />
          </section>
        )}

        {step === "preview" && parsed && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-ink-muted">{parsed.fileName}</p>
                <p className="text-sm text-ink-muted">
                  {parsed.rowCount} rows · {parsed.headers.length} columns detected
                </p>
              </div>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 rounded-full bg-jade px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-deep"
              >
                Confirm &amp; run AI mapping <ArrowRight size={16} />
              </button>
            </div>
            {apiError && (
              <p className="rounded-lg bg-rust-tint px-3 py-2 text-sm text-rust">{apiError}</p>
            )}
            <PreviewTable headers={parsed.headers} rows={parsed.rows} />
          </section>
        )}

        {step === "confirm" && (
          <section className="flex flex-col items-center gap-5 py-20 text-center">
            <Loader2 size={32} className="animate-spin text-jade" />
            <div>
              <p className="font-display text-lg font-semibold text-ink">Mapping your leads…</p>
              <p className="mt-1 text-sm text-ink-muted">
                {progress
                  ? `Batch ${Math.min(progress.done, progress.total)} of ${progress.total}`
                  : "Warming up the model"}
              </p>
            </div>
            <div className="h-1.5 w-64 overflow-hidden rounded-full bg-code-tint">
              <div
                className="h-full rounded-full bg-jade transition-all duration-500"
                style={{
                  width: progress ? `${Math.min(100, (progress.done / progress.total) * 100)}%` : "8%",
                }}
              />
            </div>
          </section>
        )}

        {step === "result" && result && (
          <section className="flex flex-col gap-6">
            {result.fieldMappings && result.fieldMappings.length > 0 && (
              <MappingWires mappings={result.fieldMappings} />
            )}
            <ResultTable imported={result.imported} skipped={result.skipped} />
          </section>
        )}
      </main>
    </div>
  );
}
