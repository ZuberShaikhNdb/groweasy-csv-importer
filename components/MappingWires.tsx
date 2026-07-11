"use client";

import { FieldMapping } from "@/lib/types";

/**
 * Renders the raw source columns on the left, GrowEasy CRM fields on the
 * right, and draws a connecting line for every mapping the model reported.
 * This is the literal visualization of the assignment's actual thesis:
 * "AI intelligently maps whatever columns exist onto our schema."
 */
export function MappingWires({ mappings }: { mappings: FieldMapping[] }) {
  if (mappings.length === 0) return null;

  const sources = Array.from(new Set(mappings.map((m) => m.sourceColumn)));
  const targets = Array.from(new Set(mappings.map((m) => m.crmField)));

  const rowH = 30;
  const height = Math.max(sources.length, targets.length) * rowH + 16;
  const width = 560;
  const colGap = width - 220;

  const yFor = (list: string[], key: string) => {
    const idx = list.indexOf(key);
    return 12 + idx * rowH + rowH / 2;
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="mb-3 font-display text-sm font-semibold text-ink">
        How the AI mapped your columns
      </p>
      <div className="scrollbar-thin overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="min-w-[480px]"
        >
          {mappings.map((m, i) => {
            const y1 = yFor(sources, m.sourceColumn);
            const y2 = yFor(targets, m.crmField);
            const midX = 110 + colGap / 2;
            return (
              <path
                key={i}
                d={`M110,${y1} C${midX},${y1} ${midX},${y2} ${width - 110},${y2}`}
                fill="none"
                stroke="var(--jade)"
                strokeWidth={1.5}
                strokeOpacity={0.55}
                className="wire-path"
                style={{ animationDelay: `${i * 40}ms` }}
              />
            );
          })}

          {sources.map((s) => (
            <g key={s} transform={`translate(0, ${yFor(sources, s) - 10})`}>
              <rect width={100} height={20} rx={5} fill="var(--code-tint)" />
              <text
                x={50}
                y={14}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={9.5}
                fill="var(--ink)"
              >
                {s.length > 14 ? s.slice(0, 13) + "…" : s}
              </text>
            </g>
          ))}

          {targets.map((t) => (
            <g key={t} transform={`translate(${width - 100}, ${yFor(targets, t) - 10})`}>
              <rect width={100} height={20} rx={5} fill="var(--jade-tint)" />
              <text
                x={50}
                y={14}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={9.5}
                fill="var(--jade-deep)"
              >
                {t.length > 14 ? t.slice(0, 13) + "…" : t}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
