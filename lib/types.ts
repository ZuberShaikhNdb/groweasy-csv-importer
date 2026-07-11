export const CRM_STATUSES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type CrmStatus = (typeof CRM_STATUSES)[number];
export type DataSource = (typeof DATA_SOURCES)[number];

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus | "";
  crm_note: string;
  data_source: DataSource | "";
  possession_time: string;
  description: string;
}

export interface RawRow {
  [key: string]: string;
}

export interface SkippedRecord {
  row: RawRow;
  reason: string;
}

export interface ExtractResponse {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  fieldMappings?: FieldMapping[];
}

export interface FieldMapping {
  sourceColumn: string;
  crmField: string;
}

export const CRM_FIELD_LIST: { key: keyof CrmRecord; label: string; description: string }[] = [
  { key: "created_at", label: "Created At", description: "Lead creation date" },
  { key: "name", label: "Name", description: "Lead name" },
  { key: "email", label: "Email", description: "Primary email" },
  { key: "country_code", label: "Country Code", description: "Country code" },
  { key: "mobile_without_country_code", label: "Mobile", description: "Mobile number" },
  { key: "company", label: "Company", description: "Company name" },
  { key: "city", label: "City", description: "City" },
  { key: "state", label: "State", description: "State" },
  { key: "country", label: "Country", description: "Country" },
  { key: "lead_owner", label: "Lead Owner", description: "Lead owner" },
  { key: "crm_status", label: "Status", description: "Lead status" },
  { key: "crm_note", label: "Note", description: "Notes/remarks" },
  { key: "data_source", label: "Source", description: "Source" },
  { key: "possession_time", label: "Possession Time", description: "Property possession time" },
  { key: "description", label: "Description", description: "Additional description" },
];
