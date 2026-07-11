"use client";

import { RawRow } from "@/lib/types";

export function PreviewTable({ headers, rows }: { headers: string[]; rows: RawRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="scrollbar-thin max-h-[420px] overflow-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-ink text-white">
            <tr>
              <th className="sticky left-0 z-20 bg-ink px-3 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-white/60">
                #
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-white/90"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-line odd:bg-paper/60 hover:bg-jade-tint/60">
                <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-mono text-xs text-ink-muted">
                  {i + 1}
                </td>
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-4 py-2 font-mono text-xs text-ink">
                    {row[h] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
