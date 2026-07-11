import { CRM_STATUSES, DATA_SOURCES, RawRow } from "./types";

/**
 * Builds the system + user prompt for a single batch of raw CSV rows.
 * Encodes every rule from the GrowEasy assignment spec so the model
 * has zero ambiguity about allowed values, note-merging, and skip logic.
 */
export function buildExtractionPrompt(rows: RawRow[]): string {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return `You are a CRM data-mapping engine for GrowEasy, a real-estate lead management platform.

You will receive a batch of raw CSV rows exported from an unknown source (Facebook Lead Ads, Google Ads, a manual spreadsheet, another CRM, etc). Column names and layouts vary between uploads and are NOT fixed. Your job is to intelligently map whatever columns exist onto the GrowEasy CRM schema below, using semantic understanding of column names and cell values (not just exact string matches).

SOURCE COLUMNS IN THIS BATCH: ${JSON.stringify(columns)}

CRM SCHEMA (return exactly these keys for every kept record):
- created_at: Lead creation date/time. MUST be a string parseable by JavaScript's "new Date(created_at)". If no date is present, use an empty string.
- name: Lead's full name.
- email: Primary email address.
- country_code: Phone country code, formatted like "+91". Infer from context (e.g. Indian phone numbers/locations) when not explicit; otherwise leave blank.
- mobile_without_country_code: Mobile number WITHOUT the country code, digits only where possible.
- company: Company name.
- city: City.
- state: State.
- country: Country.
- lead_owner: Lead owner (often an email or a person's name / sales rep).
- crm_status: MUST be exactly one of ${JSON.stringify(CRM_STATUSES)}, or "" if nothing maps confidently. Infer from any status/stage/outcome-like column using its meaning (e.g. "closed won" -> SALE_DONE, "not interested"/"junk" -> BAD_LEAD, "no answer"/"unreachable" -> DID_NOT_CONNECT, "interested"/"hot"/"follow up" -> GOOD_LEAD_FOLLOW_UP).
- crm_note: Free-text notes. Merge into this field: any remarks/comments columns, extra phone numbers beyond the first, extra email addresses beyond the first, and any other useful info that has no dedicated CRM field. Join multiple pieces of extra info with " | ".
- data_source: MUST be exactly one of ${JSON.stringify(DATA_SOURCES)}, or "" if none match confidently. Only choose one of these if the data clearly indicates that specific project/source; otherwise leave blank.
- possession_time: Property possession timeframe, if present (e.g. "Ready to move", "Dec 2026").
- description: Any additional descriptive text that doesn't belong in crm_note.

HARD RULES:
1. If a source row contains multiple email addresses: use the first as "email", append the rest into "crm_note".
2. If a source row contains multiple mobile numbers: use the first as "mobile_without_country_code" (country code stripped into "country_code"), append the rest into "crm_note".
3. SKIP a row entirely (do not include it in "imported") if it has NEITHER a usable email NOR a usable mobile number. Instead add it to "skipped" with a short "reason".
4. Never invent data. If a field cannot be determined, use an empty string "" for that field (except crm_status/data_source which must be "" or one of the exact enum values above).
5. crm_status and data_source values must NEVER be anything other than one of the allowed values or an empty string — no invented categories.
6. Keep each record a single flat JSON object (no nested objects, no embedded raw newlines in string values — escape them as \\n if unavoidable).
7. Also return "fieldMappings": an array of {"sourceColumn": <original column name>, "crmField": <crm field key it was mapped to>} describing how you interpreted the source columns for this batch (only include columns you actually used).

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:
{
  "imported": [ { ...CrmRecord }, ... ],
  "skipped": [ { "row": { ...original raw row... }, "reason": "..." }, ... ],
  "fieldMappings": [ { "sourceColumn": "...", "crmField": "..." }, ... ]
}

RAW ROWS TO PROCESS (JSON array, one object per CSV row, keys are the original column headers):
${JSON.stringify(rows)}
`;
}
