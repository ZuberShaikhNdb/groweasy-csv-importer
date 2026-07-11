import Papa from "papaparse";
import { RawRow } from "./types";

export interface ParsedCsv {
  headers: string[];
  rows: RawRow[];
  fileName: string;
  rowCount: number;
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const fatal = results.errors.find((e) => e.type !== "FieldMismatch");
          if (fatal) {
            reject(new Error(fatal.message));
            return;
          }
        }
        const headers = results.meta.fields ?? [];
        const rows = (results.data ?? []).filter((r) =>
          Object.values(r).some((v) => String(v ?? "").trim() !== ""),
        );
        if (headers.length === 0 || rows.length === 0) {
          reject(new Error("Couldn't find any usable rows in this CSV."));
          return;
        }
        resolve({ headers, rows, fileName: file.name, rowCount: rows.length });
      },
      error: (err) => reject(err),
    });
  });
}
