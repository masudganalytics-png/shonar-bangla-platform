import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type {
  CommitteeMember,
  DevelopmentProject,
  FinanceSummary,
  FinancialTransaction,
  MosqueActivity,
  MosqueDetail,
  MosqueDonor,
  MosqueListItem,
  MosqueNotice,
  MosqueRow,
  SocietyLeader,
  SocietyMember,
} from "@/lib/mosque-shared";

/**
 * Mosque & Society server functions.
 *
 * Privacy model: reads go through the server so that private phone numbers,
 * private donation amounts and non-public financial records never leave the
 * server for visitors. Writes are RLS-guarded and additionally re-checked here
 * through `public.is_mosque_manager`.
 */

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

async function isPlatformAdmin(ctx: { supabase: unknown; userId: string }): Promise<boolean> {
  const sb = ctx.supabase as unknown as RpcClient;
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function ensureAdmin(ctx: { supabase: unknown; userId: string }) {
  if (!(await isPlatformAdmin(ctx))) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");
}

async function canManage(ctx: { supabase: unknown; userId: string }, mosqueId: string): Promise<boolean> {
  const sb = ctx.supabase as unknown as RpcClient;
  const { data, error } = await sb.rpc("is_mosque_manager", { _mosque_id: mosqueId, _user_id: ctx.userId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function ensureManager(ctx: { supabase: unknown; userId: string }, mosqueId: string) {
  if (!(await canManage(ctx, mosqueId))) throw new Error("Forbidden — এই প্রোফাইল পরিচালনার অনুমতি নেই");
}

const stripPhone = <T extends { phone: string | null; phone_visibility: string }>(r: T): T => ({
  ...r,
  phone: r.phone_visibility === "public" ? r.phone : null,
});

/* --------------------------------------------------------------- public */

const listSchema = z.object({
  q: z.string().trim().max(120).optional(),
  district: z.string().trim().max(80).optional(),
  upazila: z.string().trim().max(80).optional(),
  union_name: z.string().trim().max(80).optional(),
  verifiedOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(60).optional(),
});

export const listMosques = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listSchema.parse(d ?? {}))
  .handler(async ({ data }): Promise<MosqueListItem[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Optional search by society-leader name resolves to mosque ids first.
    let leaderMatchIds: string[] | null = null;
    if (data.q) {
      const { data: leaders } = await supabaseAdmin
        .from("society_leaders")
        .select("mosque_id")
        .ilike("full_name", `%${data.q}%`)
        .limit(100);
      leaderMatchIds = Array.from(new Set((leaders ?? []).map((l) => l.mosque_id as string)));
    }

    let query = supabaseAdmin
      .from("mosques")
      .select("id, slug, name, area, union_name, upazila, district, photo_url, status, created_at")
      .eq("status", "verified")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 40);

    if (data.district) query = query.eq("district", data.district);
    if (data.upazila) query = query.eq("upazila", data.upazila);
    if (data.union_name) query = query.eq("union_name", data.union_name);
    if (data.q) {
      const like = `%${data.q}%`;
      const parts = [
        `name.ilike.${like}`,
        `area.ilike.${like}`,
        `union_name.ilike.${like}`,
        `upazila.ilike.${like}`,
        `district.ilike.${like}`,
      ];
      if (leaderMatchIds && leaderMatchIds.length > 0) parts.push(`id.in.(${leaderMatchIds.join(",")})`);
      query = query.or(parts.join(","));
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as MosqueListItem[];
  });

export const getMosqueFilterOptions = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("mosques")
    .select("district, upazila, union_name")
    .eq("status", "verified")
    .limit(500);
  const uniq = (xs: Array<string | null>) => Array.from(new Set(xs.filter(Boolean) as string[])).sort();
  const rows = (data ?? []) as Array<{ district: string; upazila: string; union_name: string | null }>;
  return {
    districts: uniq(rows.map((r) => r.district)),
    upazilas: uniq(rows.map((r) => r.upazila)),
    unions: uniq(rows.map((r) => r.union_name)),
  };
});

/** Public profile view. Private phones, private amounts and non-public finance are stripped. */
export const getMosqueDetail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<MosqueDetail | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.slug);
    const { data: mosque, error } = await supabaseAdmin
      .from("mosques")
      .select("*")
      .eq(isUuid ? "id" : "slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!mosque || (mosque as MosqueRow).status !== "verified") return null;
    const m = mosque as MosqueRow;

    const [committee, leaders, members, donors, projects, notices, activities, txns] = await Promise.all([
      supabaseAdmin.from("mosque_committee_members").select("*").eq("mosque_id", m.id).order("sort_order"),
      supabaseAdmin.from("society_leaders").select("*").eq("mosque_id", m.id).order("sort_order"),
      supabaseAdmin.from("society_members").select("*").eq("mosque_id", m.id).order("sort_order"),
      supabaseAdmin.from("mosque_donors").select("*").eq("mosque_id", m.id).order("donated_on", { ascending: false }),
      supabaseAdmin.from("development_projects").select("*").eq("mosque_id", m.id).order("created_at", { ascending: false }),
      supabaseAdmin
        .from("community_notices")
        .select("*")
        .eq("mosque_id", m.id)
        .eq("is_hidden", false)
        .order("notice_date", { ascending: false }),
      supabaseAdmin
        .from("community_activities")
        .select("*")
        .eq("mosque_id", m.id)
        .eq("is_hidden", false)
        .order("activity_date", { ascending: false }),
      supabaseAdmin.from("financial_transactions").select("txn_type, amount").eq("mosque_id", m.id),
    ]);

    const income = ((txns.data ?? []) as Array<{ txn_type: string; amount: number }>)
      .filter((t) => t.txn_type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = ((txns.data ?? []) as Array<{ txn_type: string; amount: number }>)
      .filter((t) => t.txn_type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    const finance: FinanceSummary = m.finance_public
      ? { visible: true, income, expense, balance: income - expense }
      : { visible: false, income: 0, expense: 0, balance: 0 };

    return {
      mosque: { ...m, phone: m.phone_visibility === "public" ? m.phone : null },
      committee: ((committee.data ?? []) as CommitteeMember[]).map(stripPhone),
      leaders: ((leaders.data ?? []) as SocietyLeader[]).map(stripPhone),
      members: ((members.data ?? []) as SocietyMember[]).map(stripPhone),
      donors: ((donors.data ?? []) as MosqueDonor[]).map((d) => ({
        ...d,
        full_name: d.is_anonymous ? "" : d.full_name,
        photo_url: d.is_anonymous ? null : d.photo_url,
        location: d.is_anonymous ? null : d.location,
        amount: d.amount_visibility === "public" ? d.amount : null,
      })),
      projects: (projects.data ?? []) as DevelopmentProject[],
      notices: (notices.data ?? []) as MosqueNotice[],
      activities: (activities.data ?? []) as MosqueActivity[],
      finance,
      transactions: [],
      canManage: false,
    };
  });

/** Recently verified profiles for the homepage card. */
export const listRecentMosques = createServerFn({ method: "GET" }).handler(async (): Promise<MosqueListItem[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("mosques")
    .select("id, slug, name, area, union_name, upazila, district, photo_url, status, created_at")
    .eq("status", "verified")
    .order("verified_at", { ascending: false, nullsFirst: false })
    .limit(3);
  return (data ?? []) as MosqueListItem[];
});

/* ------------------------------------------------- manager-only reading */

/** Full data for people allowed to manage the profile (includes private fields). */
export const getMosqueManageData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }): Promise<MosqueDetail | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.slug);
    const { data: mosque } = await supabaseAdmin
      .from("mosques")
      .select("*")
      .eq(isUuid ? "id" : "slug", data.slug)
      .maybeSingle();
    if (!mosque) return null;
    const m = mosque as MosqueRow;
    if (!(await canManage(context, m.id))) return null;

    const [committee, leaders, members, donors, projects, notices, activities, txns] = await Promise.all([
      supabaseAdmin.from("mosque_committee_members").select("*").eq("mosque_id", m.id).order("sort_order"),
      supabaseAdmin.from("society_leaders").select("*").eq("mosque_id", m.id).order("sort_order"),
      supabaseAdmin.from("society_members").select("*").eq("mosque_id", m.id).order("sort_order"),
      supabaseAdmin.from("mosque_donors").select("*").eq("mosque_id", m.id).order("donated_on", { ascending: false }),
      supabaseAdmin.from("development_projects").select("*").eq("mosque_id", m.id).order("created_at", { ascending: false }),
      supabaseAdmin.from("community_notices").select("*").eq("mosque_id", m.id).order("notice_date", { ascending: false }),
      supabaseAdmin.from("community_activities").select("*").eq("mosque_id", m.id).order("activity_date", { ascending: false }),
      supabaseAdmin.from("financial_transactions").select("*").eq("mosque_id", m.id).order("txn_date", { ascending: false }),
    ]);

    const rows = (txns.data ?? []) as FinancialTransaction[];
    const income = rows.filter((t) => t.txn_type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = rows.filter((t) => t.txn_type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    return {
      mosque: m,
      committee: (committee.data ?? []) as CommitteeMember[],
      leaders: (leaders.data ?? []) as SocietyLeader[],
      members: (members.data ?? []) as SocietyMember[],
      donors: (donors.data ?? []) as MosqueDonor[],
      projects: (projects.data ?? []) as DevelopmentProject[],
      notices: (notices.data ?? []) as MosqueNotice[],
      activities: (activities.data ?? []) as MosqueActivity[],
      finance: { visible: true, income, expense, balance: income - expense },
      transactions: rows,
      canManage: true,
    };
  });

/** Profiles the signed-in user submitted or manages. */
export const listMyMosques = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MosqueListItem[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: managed } = await supabaseAdmin
      .from("mosque_managers")
      .select("mosque_id")
      .eq("user_id", context.userId);
    const ids = (managed ?? []).map((r) => r.mosque_id as string);
    const filter = ids.length > 0 ? `created_by.eq.${context.userId},id.in.(${ids.join(",")})` : `created_by.eq.${context.userId}`;
    const { data } = await supabaseAdmin
      .from("mosques")
      .select("id, slug, name, area, union_name, upazila, district, photo_url, status, created_at")
      .or(filter)
      .order("created_at", { ascending: false });
    return (data ?? []) as MosqueListItem[];
  });

/* -------------------------------------------------------------- writing */

const phoneVisibility = z.enum(["public", "private"]);
const optText = z.string().trim().max(500).optional().nullable();

const mosqueInput = z.object({
  name: z.string().trim().min(2).max(150),
  area: optText,
  union_name: optText,
  ward: z.string().trim().max(40).optional().nullable(),
  upazila: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1).max(80),
  established_year: z.number().int().min(1000).max(2200).optional().nullable(),
  imam_name: optText,
  muazzin_name: optText,
  phone: z.string().trim().max(30).optional().nullable(),
  phone_visibility: phoneVisibility.default("public"),
  map_url: z.string().trim().max(500).optional().nullable(),
  photo_url: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
});

const committeeInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  photo_url: optText,
  position: z.enum(["president", "vice_president", "secretary", "treasurer", "member"]),
  phone: z.string().trim().max(30).optional().nullable(),
  phone_visibility: phoneVisibility.default("private"),
  bio: z.string().trim().max(1000).optional().nullable(),
});

const leaderInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  photo_url: optText,
  role_title: optText,
  phone: z.string().trim().max(30).optional().nullable(),
  phone_visibility: phoneVisibility.default("private"),
  description: z.string().trim().max(1000).optional().nullable(),
});

const societyMemberInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  photo_url: optText,
  family_name: optText,
  phone: z.string().trim().max(30).optional().nullable(),
  phone_visibility: phoneVisibility.default("private"),
  description: z.string().trim().max(1000).optional().nullable(),
});

const donorInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  photo_url: optText,
  location: optText,
  purpose: optText,
  amount: z.number().min(0).max(1_000_000_000).optional().nullable(),
  donated_on: z.string().trim().max(20).optional().nullable(),
  is_anonymous: z.boolean().default(false),
  amount_visibility: phoneVisibility.default("public"),
});

const projectInput = z
  .object({
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(2000).optional().nullable(),
    target_amount: z.number().min(0).max(1_000_000_000).default(0),
    collected_amount: z.number().min(0).max(1_000_000_000).default(0),
    spent_amount: z.number().min(0).max(1_000_000_000).default(0),
    start_date: z.string().trim().max(20).optional().nullable(),
    expected_completion_date: z.string().trim().max(20).optional().nullable(),
    status: z.enum(["planned", "ongoing", "completed", "paused"]).default("planned"),
    updates: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((p) => p.spent_amount <= p.collected_amount + 0.001 || p.collected_amount === 0, {
    message: "ব্যয় সংগৃহীত অর্থের চেয়ে বেশি হতে পারে না",
    path: ["spent_amount"],
  });

const txnInput = z.object({
  txn_type: z.enum(["income", "expense"]),
  txn_date: z.string().trim().min(4).max(20),
  category: z.string().trim().min(1).max(120),
  amount: z.number().min(0).max(1_000_000_000),
  description: z.string().trim().max(1000).optional().nullable(),
});

const noticeInput = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  notice_date: z.string().trim().max(20).optional().nullable(),
  image_url: optText,
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
});

const activityInput = z.object({
  name: z.string().trim().min(2).max(200),
  activity_date: z.string().trim().max(20).optional().nullable(),
  location: optText,
  description: z.string().trim().max(4000).optional().nullable(),
  organizer: optText,
});

const CHILD_SCHEMAS = {
  mosque_committee_members: committeeInput,
  society_leaders: leaderInput,
  society_members: societyMemberInput,
  mosque_donors: donorInput,
  development_projects: projectInput,
  financial_transactions: txnInput,
  community_notices: noticeInput,
  community_activities: activityInput,
} as const;

type ChildTable = keyof typeof CHILD_SCHEMAS;

/** Create a new mosque profile (optionally with the wizard's nested sections). */
export const submitMosque = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        mosque: mosqueInput,
        committee: z.array(committeeInput).max(30).default([]),
        leaders: z.array(leaderInput).max(30).default([]),
        members: z.array(societyMemberInput).max(200).default([]),
        donors: z.array(donorInput).max(200).default([]),
        projects: z.array(projectInput).max(30).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ id: string; slug: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin
      .from("mosques")
      .insert({
        ...data.mosque,
        status: "pending",
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);

    const id = created.id as string;
    const stamp = { mosque_id: id, created_by: context.userId, updated_by: context.userId };
    const inserts: Array<Promise<unknown>> = [];
    if (data.committee.length)
      inserts.push(Promise.resolve(supabaseAdmin.from("mosque_committee_members").insert(data.committee.map((r) => ({ ...r, ...stamp })))));
    if (data.leaders.length)
      inserts.push(Promise.resolve(supabaseAdmin.from("society_leaders").insert(data.leaders.map((r) => ({ ...r, ...stamp })))));
    if (data.members.length)
      inserts.push(Promise.resolve(supabaseAdmin.from("society_members").insert(data.members.map((r) => ({ ...r, ...stamp })))));
    if (data.donors.length)
      inserts.push(Promise.resolve(supabaseAdmin.from("mosque_donors").insert(data.donors.map((r) => ({ ...r, ...stamp })))));
    if (data.projects.length)
      inserts.push(Promise.resolve(supabaseAdmin.from("development_projects").insert(data.projects.map((r) => ({ ...r, ...stamp })))));
    await Promise.all(inserts);

    await supabaseAdmin.from("verification_records").insert({
      mosque_id: id,
      action: "submitted",
      actor_id: context.userId,
    });

    return { id, slug: (created.slug as string | null) ?? null };
  });

/** Manager: update the mosque's own information (never the verification status). */
export const updateMosqueInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), values: mosqueInput.partial(), finance_public: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureManager(context, data.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { ...data.values, updated_by: context.userId };
    if (data.finance_public !== undefined) patch['finance_public'] = data.finance_public;
    const { error } = await (supabaseAdmin.from("mosques") as unknown as LooseTable).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Manager: create or update any child record of a mosque profile. */
export const saveMosqueChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        table: z.enum([
          "mosque_committee_members",
          "society_leaders",
          "society_members",
          "mosque_donors",
          "development_projects",
          "financial_transactions",
          "community_notices",
          "community_activities",
        ]),
        mosqueId: z.string().uuid(),
        id: z.string().uuid().optional(),
        values: z.record(z.string(), z.unknown()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureManager(context, data.mosqueId);
    const schema = CHILD_SCHEMAS[data.table as ChildTable];
    const values = schema.parse(data.values) as Record<string, unknown>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin
        .from(data.table)
        .update({ ...values, updated_by: context.userId })
        .eq("id", data.id)
        .eq("mosque_id", data.mosqueId);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from(data.table)
      .insert({ ...values, mosque_id: data.mosqueId, created_by: context.userId, updated_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id as string };
  });

export const deleteMosqueChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        table: z.enum([
          "mosque_committee_members",
          "society_leaders",
          "society_members",
          "mosque_donors",
          "development_projects",
          "financial_transactions",
          "community_notices",
          "community_activities",
        ]),
        mosqueId: z.string().uuid(),
        id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureManager(context, data.mosqueId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id).eq("mosque_id", data.mosqueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Anyone signed in can report incorrect or inappropriate information. */
export const reportMosque = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        mosqueId: z.string().uuid(),
        reason: z.string().trim().min(5).max(1000),
        contact: z.string().trim().max(120).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("mosque_reports").insert({
      mosque_id: data.mosqueId,
      reason: data.reason,
      contact: data.contact ?? null,
      reporter_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------------------------------------------------------- admin */

export const adminListMosques = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.enum(["pending", "verified", "rejected", "all"]).default("all"), q: z.string().trim().max(120).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<MosqueRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("mosques").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.q) {
      const like = `%${data.q}%`;
      query = query.or(`name.ilike.${like},area.ilike.${like},union_name.ilike.${like},upazila.ilike.${like},district.ilike.${like}`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as MosqueRow[];
  });

export const adminSetMosqueStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "verified", "rejected"]),
        note: z.string().trim().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("mosques")
      .update({
        status: data.status,
        verified_at: data.status === "verified" ? new Date().toISOString() : null,
        verified_by: data.status === "verified" ? context.userId : null,
        rejection_reason: data.status === "rejected" ? (data.note ?? null) : null,
        updated_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("verification_records").insert({
      mosque_id: data.id,
      action: data.status,
      note: data.note ?? null,
      actor_id: context.userId,
    });
    return { ok: true };
  });

export const adminDeleteMosque = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("mosques").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListMosqueReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("mosque_reports")
      .select("id, mosque_id, reason, contact, status, created_at, mosques(name, slug)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      mosque_id: string;
      reason: string;
      contact: string | null;
      status: string;
      created_at: string;
      mosques: { name: string; slug: string | null } | null;
    }>;
  });

export const adminResolveMosqueReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["open", "resolved"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("mosque_reports").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
