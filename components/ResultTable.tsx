"use client";

import { useState } from "react";
import { CRM_FIELD_LIST, CrmRecord, SkippedRecord } from "@/lib/types";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-jade-tint text-jade-deep",
  SALE_DONE: "bg-jade text-white",
  DID_NOT_CONNECT: "bg-amber-tint text-amber",
  BAD_LEAD: "bg-rust-tint text-rust",
};

export function ResultTable({
  imported,
  skipped,
}: {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
}) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SummaryPill
          icon={<CheckCircle2 size={15} />}
          label="Imported"
          value={imported.length}
          tone="jade"
        />
        <SummaryPill
          icon={<AlertTriangle size={15} />}
          label="Skipped"
          value={skipped.length}
          tone="amber"
        />
      </div>

      <div className="mb-3 flex gap-1 rounded-full bg-code-tint p-1 text-sm w-fit">
        <button
          onClick={() => setTab("imported")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            tab === "imported" ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
          }`}
        >
          Imported ({imported.length})
        </button>
        <button
          onClick={() => setTab("skipped")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            tab === "skipped" ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
          }`}
        >
          Skipped ({skipped.length})
        </button>
      </div>

      {tab === "imported" ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="scrollbar-thin max-h-[480px] overflow-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-ink text-white">
                <tr>
                  <th className="sticky left-0 z-20 bg-ink px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-white/60">
                    #
                  </th>
                  {CRM_FIELD_LIST.map((f) => (
                    <th
                      key={f.key}
                      className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-white/90"
                    >
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {imported.map((rec, i) => (
                  <tr
                    key={i}
                    className="row-in border-t border-line odd:bg-paper/60 hover:bg-jade-tint/50"
                    style={{ animationDelay: `${Math.min(i, 30) * 15}ms` }}
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-mono text-xs text-ink-muted">
                      {i + 1}
                    </td>
                    {CRM_FIELD_LIST.map((f) => (
                      <td key={f.key} className="whitespace-nowrap px-4 py-2 font-mono text-xs text-ink">
                        {f.key === "crm_status" && rec[f.key] ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              STATUS_STYLES[rec[f.key] as string] ?? "bg-code-tint text-ink-muted"
                            }`}
                          >
                            {rec[f.key]}
                          </span>
                        ) : (
                          rec[f.key] || <span className="text-ink-muted/50">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="scrollbar-thin max-h-[480px] overflow-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-ink text-white">
                <tr>
                  <th className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-white/90">
                    Reason
                  </th>
                  <th className="px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-white/90">
                    Raw row
                  </th>
                </tr>
              </thead>
              <tbody>
                {skipped.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-sm text-ink-muted">
                      Nothing skipped — every row had an email or a mobile number.
                    </td>
                  </tr>
                ) : (
                  skipped.map((s, i) => (
                    <tr key={i} className="border-t border-line odd:bg-paper/60">
                      <td className="whitespace-nowrap px-4 py-2 align-top text-xs text-rust">{s.reason}</td>
                      <td className="px-4 py-2 font-mono text-xs text-ink-muted">
                        {JSON.stringify(s.row)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "jade" | "amber";
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ${
        tone === "jade" ? "bg-jade-tint text-jade-deep" : "bg-amber-tint text-amber"
      }`}
    >
      {icon}
      <span className="font-mono text-base font-semibold">{value}</span>
      <span>{label}</span>
    </div>
  );
}
