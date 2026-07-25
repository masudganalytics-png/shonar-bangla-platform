import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(ctx: { supabase: unknown; userId: string }) {
  const sb = ctx.supabase as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");
}

/* ------------------------------ Users ------------------------------ */

export type AdminUser = {
  id: string;
  full_name: string | null;
  phone: string | null;
  meter_no: string | null;
  created_at: string;
  role: "user" | "admin";
  email: string | null;
};

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profilesRes, rolesRes, usersRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone, meter_no, created_at").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    ]);
    if (profilesRes.error) throw new Error(profilesRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);

    const roleMap = new Map<string, "user" | "admin">();
    for (const r of rolesRes.data ?? []) {
      const cur = roleMap.get(r.user_id);
      if (r.role === "admin" || !cur) roleMap.set(r.user_id, r.role as "user" | "admin");
    }
    const emailMap = new Map<string, string | null>();
    for (const u of usersRes.data?.users ?? []) emailMap.set(u.id, u.email ?? null);

    return (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      meter_no: p.meter_no,
      created_at: p.created_at,
      role: roleMap.get(p.id) ?? "user",
      email: emailMap.get(p.id) ?? null,
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid(), role: z.enum(["user", "admin"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (data.user_id === context.userId && data.role !== "admin") {
      throw new Error("নিজের অ্যাডমিন রোল অপসারণ করা যাবে না");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Remove all existing roles then insert the new one
    const del = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    if (del.error) throw new Error(del.error.message);
    const ins = await supabaseAdmin.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    if (ins.error) throw new Error(ins.error.message);
    return { ok: true };
  });

/* ------------------------------ Bills ------------------------------ */

export type AdminBill = {
  id: string;
  user_id: string;
  meter_no: string;
  billing_month: string;
  bill_year: number | null;
  bill_month: number | null;
  units_consumed: number;
  amount: number;
  status: "pending" | "paid" | "overdue";
  union_name: string | null;
  provider: string | null;
  created_at: string;
  user_name: string | null;
};

export const listAllBills = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminBill[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [billsRes, profilesRes] = await Promise.all([
      supabaseAdmin
        .from("bills")
        .select("id, user_id, meter_no, billing_month, bill_year, bill_month, units_consumed, amount, status, union_name, provider, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabaseAdmin.from("profiles").select("id, full_name"),
    ]);
    if (billsRes.error) throw new Error(billsRes.error.message);
    if (profilesRes.error) throw new Error(profilesRes.error.message);
    const names = new Map<string, string | null>();
    for (const p of profilesRes.data ?? []) names.set(p.id, p.full_name);
    return (billsRes.data ?? []).map((b) => ({
      ...b,
      units_consumed: Number(b.units_consumed),
      amount: Number(b.amount),
      user_name: names.get(b.user_id) ?? null,
    })) as AdminBill[];
  });

export const updateBillStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "paid", "overdue"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "paid") patch.paid_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from("bills").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBillAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bills").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------- Complaints ---------------------------- */

export type AdminReport = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  reason: string;
  status: "open" | "in_progress" | "resolved" | "rejected";
  admin_response: string | null;
  image_url: string | null;
  created_at: string;
  user_name: string | null;
};

export const listAllReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReport[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [rRes, pRes] = await Promise.all([
      supabaseAdmin
        .from("reports")
        .select("id, user_id, title, description, reason, status, admin_response, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabaseAdmin.from("profiles").select("id, full_name"),
    ]);
    if (rRes.error) throw new Error(rRes.error.message);
    if (pRes.error) throw new Error(pRes.error.message);
    const names = new Map<string, string | null>();
    for (const p of pRes.data ?? []) names.set(p.id, p.full_name);
    return (rRes.data ?? []).map((r) => ({ ...r, user_name: names.get(r.user_id) ?? null })) as AdminReport[];
  });

export const updateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "in_progress", "resolved", "rejected"]),
        admin_response: z.string().max(2000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reports")
      .update({ status: data.status, admin_response: data.admin_response ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------- Overview ---------------------------- */

export type AdminOverview = {
  users: number;
  bills: number;
  reports_open: number;
  reports_total: number;
  amount_total: number;
  amount_paid: number;
};

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [u, bAll, bPaid, rOpen, rAll] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("bills").select("amount", { count: "exact" }).limit(50000),
      supabaseAdmin.from("bills").select("amount").eq("status", "paid").limit(50000),
      supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("reports").select("id", { count: "exact", head: true }),
    ]);
    const sum = (rows: Array<{ amount: number | string | null }> | null | undefined) =>
      (rows ?? []).reduce((a, r) => a + Number(r.amount ?? 0), 0);
    return {
      users: u.count ?? 0,
      bills: bAll.count ?? 0,
      reports_open: rOpen.count ?? 0,
      reports_total: rAll.count ?? 0,
      amount_total: sum(bAll.data ?? []),
      amount_paid: sum(bPaid.data ?? []),
    };
  });

/* --------------------------- Exports (CSV) ---------------------------- */

function toCsv(rows: Array<Record<string, unknown>>, cols: string[]): string {
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  // UTF-8 BOM so Excel opens Bangla correctly
  return "\uFEFF" + header + "\n" + body;
}

export const exportBillsCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ filename: string; content: string }> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bills")
      .select("id, user_id, meter_no, provider, meter_type, bill_year, bill_month, billing_month, units_consumed, amount, status, union_name, village, family_members, created_at")
      .order("created_at", { ascending: false })
      .limit(50000);
    if (error) throw new Error(error.message);
    return {
      filename: `bills-${new Date().toISOString().slice(0, 10)}.csv`,
      content: toCsv(
        (data ?? []) as unknown as Array<Record<string, unknown>>,
        ["id","user_id","meter_no","provider","meter_type","bill_year","bill_month","billing_month","units_consumed","amount","status","union_name","village","family_members","created_at"],
      ),
    };
  });

export const exportReportsCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ filename: string; content: string }> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("id, user_id, title, reason, status, admin_response, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50000);
    if (error) throw new Error(error.message);
    return {
      filename: `complaints-${new Date().toISOString().slice(0, 10)}.csv`,
      content: toCsv(
        (data ?? []) as unknown as Array<Record<string, unknown>>,
        ["id","user_id","title","reason","status","admin_response","created_at","updated_at"],
      ),
    };
  });

export const exportUsersCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ filename: string; content: string }> => {
    await ensureAdmin(context);
    const users = await listUsers();
    return {
      filename: `users-${new Date().toISOString().slice(0, 10)}.csv`,
      content: toCsv(
        users as unknown as Array<Record<string, unknown>>,
        ["id","full_name","email","phone","meter_no","role","created_at"],
      ),
    };
  });
