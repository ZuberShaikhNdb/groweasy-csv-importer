# GrowEasy CSV Lead Importer

An AI-powered CSV importer that accepts leads exported from **any** source —
Facebook Lead Ads, Google Ads, Excel, a competing CRM, or a hand-built
spreadsheet — and uses Gemini to intelligently map arbitrary columns onto the
GrowEasy CRM schema.

**Live demo:** groweasy-csv-importer-five-sand.vercel.app

## How it works

1. **Upload** — drag & drop or pick a `.csv` file (parsed entirely client-side
   with PapaParse; nothing is sent to a server yet).
2. **Preview** — a sticky-header, scrollable table shows exactly what was
   uploaded. No AI has run at this point.
3. **Confirm** — only on clicking "Confirm & run AI mapping" does the frontend
   call `/api/extract`.
4. **AI mapping** — the backend batches rows (25 per batch) and sends each
   batch to Gemini with a prompt that encodes every rule from the spec:
   allowed `crm_status` / `data_source` enums, multi-email/mobile merging into
   `crm_note`, and the "skip if no email AND no mobile" rule. Progress streams
   back to the UI batch-by-batch (NDJSON over a streamed response), and failed
   batches retry up to 3 times with exponential backoff before being marked
   skipped (rather than silently dropped).
5. **Result** — a second table shows imported vs. skipped records, totals, and
   a small diagram of which source columns the AI mapped to which CRM fields.

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, PapaParse
  for client-side CSV parsing, lucide-react for icons.
- **Backend:** Next.js Route Handler (`app/api/extract/route.ts`) running on
  the Node runtime, streaming NDJSON progress + result.
- **AI:** Google Gemini (`gemini-2.5-flash` by default — 2.0 Flash was shut
  down June 1, 2026, don't use it) via direct REST calls, using
  `responseMimeType: "application/json"` for reliable structured output.

## Project structure

```
app/
  page.tsx              # upload -> preview -> confirm -> result flow
  api/extract/route.ts   # streaming extraction endpoint
components/
  UploadZone.tsx         # drag & drop / file picker
  PreviewTable.tsx        # raw CSV preview (step 2)
  ResultTable.tsx         # imported/skipped tables + summary
  MappingWires.tsx        # source-column -> CRM-field mapping diagram
  Stepper.tsx              # pipeline progress indicator
lib/
  csv.ts                  # client-side CSV parsing
  gemini.ts               # batching, retry/backoff, Gemini REST calls
  prompt.ts                # the extraction prompt (all spec rules live here)
  types.ts                 # CrmRecord, RawRow, CRM enums, etc.
```

## Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste your Gemini API key
npm run dev
```

Open http://localhost:3000, upload any CSV, and confirm to see the AI mapping
run.

### Getting a Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Create a key (free tier is enough for this assignment)
3. Paste it into `.env.local` as `GEMINI_API_KEY`

## Deploying on Vercel

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new.
3. In **Project Settings → Environment Variables**, add:
   - `GEMINI_API_KEY` = your key
4. Deploy. No other configuration needed — the API route runs on Vercel's
   Node runtime automatically.

## Design notes

- **Only one AI call path, always confirmed.** No extraction happens until
  the user explicitly clicks Confirm — matches the spec exactly.
- **Batching + retry.** Large CSVs are split into batches of 25 rows;
  each batch gets up to 3 retries with exponential backoff before its rows
  are marked skipped with a reason, so a single flaky call never silently
  loses data.
- **Streaming progress.** The extract endpoint streams NDJSON so the UI can
  show real batch-by-batch progress instead of one long spinner.
- **Enum safety.** `crm_status` and `data_source` are constrained in the
  prompt to the exact allowed values (or blank) — the model is told
  explicitly never to invent new categories.
- **Skip logic is explicit.** Rows with neither an email nor a mobile number
  are excluded from `imported` and surfaced separately with a reason in the
  Skipped tab, alongside a running total.

## Known limitations / next steps

- Demo caps uploads at 2000 rows per request (Vercel serverless function
  time limits) — a production version would queue larger files.
- No persistence layer — results are shown for the current session only
  (spec says a database is optional).
- No automated tests yet; would add unit tests around `lib/prompt.ts` output
  parsing and the skip-logic edge cases first.
