/**
 * KHIJIRION AI Database Mapping
 *
 * A controlled, read-only description of the EXISTING Supabase schema that the
 * AI layer is allowed to reason about. It contains metadata only — no user rows
 * are ever sent to the model. Private/contact columns are listed so they can be
 * excluded from every AI-driven query and from anything returned to the client.
 */

export const AI_SCHEMA_VERSION = "1.0.0";

export type AiModuleKey =
  | "business"
  | "teacher"
  | "blood_donor"
  | "match"
  | "ukhiya_go"
  | "reuse"
  | "isp"
  | "govt_job";

export type AiModuleMap = {
  key: AiModuleKey;
  /** Bangla label used in the UI. */
  label: string;
  /** Short English hint used in the model prompt. */
  hint: string;
  table: string;
  /** Columns the AI layer may match a keyword against. */
  searchableFields: string[];
  /** Columns safe to read and show publicly. */
  publicFields: string[];
  /** Never selected by the AI layer, never returned to the browser. */
  privateFields: string[];
  /** Area/location columns used for a place filter. */
  areaFields: string[];
  /** Equality filters enforcing approval/verification before anything is shown. */
  visibility: Record<string, string | boolean>;
  /** Target route for a result. */
  route: string;
};

export const AI_SCHEMA_MAP: AiModuleMap[] = [
  {
    key: "business",
    label: "ব্যবসা",
    hint: "local shops, businesses, services, products",
    table: "businesses",
    searchableFields: ["name", "short_description", "full_description"],
    publicFields: ["id", "slug", "name", "area", "upazila", "short_description"],
    privateFields: ["phone", "whatsapp", "email", "address", "owner_id"],
    areaFields: ["area", "upazila", "union_name"],
    visibility: { status: "approved" },
    route: "/business/$slug",
  },
  {
    key: "teacher",
    label: "শিক্ষক",
    hint: "teachers, tutors, subjects, tuition",
    table: "teachers",
    searchableFields: ["full_name", "subjects", "qualification", "description"],
    publicFields: ["id", "full_name", "subjects", "area", "upazila"],
    privateFields: ["phone", "whatsapp", "email", "submitted_by"],
    areaFields: ["area", "upazila"],
    visibility: { status: "approved" },
    route: "/teachers/$id",
  },
  {
    key: "blood_donor",
    label: "রক্তদাতা",
    hint: "blood donors and blood groups",
    table: "blood_donors",
    searchableFields: ["full_name", "notes"],
    publicFields: ["id", "full_name", "blood_group", "village", "union_name", "available"],
    privateFields: ["phone", "whatsapp", "address", "user_id"],
    areaFields: ["village", "union_name"],
    visibility: { status: "approved", is_active: true },
    route: "/blood-donors",
  },
  {
    key: "match",
    label: "ম্যাচ",
    hint: "marriage match requests (bride/groom)",
    table: "match_requests",
    searchableFields: ["display_name", "profession", "education"],
    publicFields: ["id", "display_name", "area", "profession", "education", "looking_for"],
    privateFields: ["contact_name", "contact_phone", "user_id", "family_info"],
    areaFields: ["area"],
    visibility: { status: "approved", is_verified: true },
    route: "/match/$id",
  },
  {
    key: "ukhiya_go",
    label: "উখিয়াগো",
    hint: "transport trips, car/CNG/microbus rides, goods delivery",
    table: "ukhiya_go_trips",
    searchableFields: ["from_location", "to_location", "vehicle_label", "notes"],
    publicFields: [
      "id",
      "from_location",
      "to_location",
      "trip_date",
      "vehicle_type",
      "vehicle_label",
      "price_per_person",
      "available_seats",
    ],
    privateFields: ["driver_id", "vehicle_id"],
    areaFields: ["from_location", "to_location"],
    visibility: { status: "published" },
    route: "/services/ukhiya-go/trip/$tripId",
  },
  {
    key: "reuse",
    label: "রিইউজ",
    hint: "used products for sale or donation, house/land rent",
    table: "reuse_listings",
    searchableFields: ["title", "description"],
    publicFields: ["id", "title", "category", "listing_type", "price", "location", "area"],
    privateFields: ["phone", "whatsapp", "user_id"],
    areaFields: ["area", "location"],
    visibility: { status: "approved" },
    route: "/services/reuse/$listingId",
  },
  {
    key: "isp",
    label: "ওয়াইফাই",
    hint: "internet service providers, wifi, broadband packages",
    table: "isps",
    searchableFields: ["name", "note"],
    publicFields: ["id", "name", "note", "is_btrc_approved"],
    privateFields: [],
    areaFields: [],
    visibility: { is_active: true },
    route: "/isp",
  },
  {
    key: "govt_job",
    label: "চাকরি",
    hint: "government job holders, officers, departments",
    table: "govt_workers",
    searchableFields: ["full_name", "designation", "organization", "department", "job_category"],
    publicFields: ["id", "full_name", "designation", "organization", "ukhiya_area", "current_upazila"],
    privateFields: ["phone", "whatsapp", "official_email", "user_id", "date_of_birth"],
    areaFields: ["ukhiya_area", "current_upazila"],
    visibility: { status: "approved" },
    route: "/govt-jobs/$id",
  },
];

export const AI_MODULE_KEYS = AI_SCHEMA_MAP.map((m) => m.key) as AiModuleKey[];

export function getModuleMap(key: AiModuleKey): AiModuleMap {
  const found = AI_SCHEMA_MAP.find((m) => m.key === key);
  if (!found) throw new Error(`Unknown AI module: ${key}`);
  return found;
}

/** Columns the AI layer may select for a module (private fields can never leak). */
export function selectColumns(map: AiModuleMap): string {
  return map.publicFields.filter((c) => !map.privateFields.includes(c)).join(", ");
}

/** Compact module catalogue handed to the model — metadata only, never data. */
export function schemaPromptSummary(): string {
  return AI_SCHEMA_MAP.map((m) => `${m.key}: ${m.hint}`).join("; ");
}

export type SchemaValidationIssue = { module: AiModuleKey; problem: string };

/** Static self-check: no private field may appear in the public/searchable lists. */
export function validateSchemaMap(): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  for (const m of AI_SCHEMA_MAP) {
    for (const field of m.privateFields) {
      if (m.publicFields.includes(field)) issues.push({ module: m.key, problem: `private field "${field}" is public` });
      if (m.searchableFields.includes(field))
        issues.push({ module: m.key, problem: `private field "${field}" is searchable` });
    }
    if (m.publicFields.length === 0) issues.push({ module: m.key, problem: "no public fields mapped" });
    if (Object.keys(m.visibility).length === 0)
      issues.push({ module: m.key, problem: "no approval/visibility rule" });
  }
  return issues;
}
