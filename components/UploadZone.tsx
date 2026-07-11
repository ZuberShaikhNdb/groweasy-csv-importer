"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet } from "lucide-react";

export function UploadZone({
  onFile,
  error,
}: {
  onFile: (file: File) => void;
  error?: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
        onFile(file); // let parent validate/report — keeps logic in one place
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`group flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-colors duration-200 ${
          dragging ? "border-jade bg-jade-tint" : "border-line bg-surface hover:border-jade/60"
        }`}
      >
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
            dragging ? "bg-jade text-white" : "bg-code-tint text-ink-muted group-hover:text-jade"
          }`}
        >
          {dragging ? <FileSpreadsheet size={26} /> : <UploadCloud size={26} />}
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            Drop your CSV here
          </p>
          <p className="mt-1 text-sm text-ink-muted">or click to browse — any layout, any source</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-rust-tint px-3 py-2 text-sm text-rust">{error}</p>
      )}
      <p className="mt-4 text-center text-xs text-ink-muted">
        Facebook Lead Ads · Google Ads · Excel exports · Manual spreadsheets · Any real-estate CRM export
      </p>
    </div>
  );
}
