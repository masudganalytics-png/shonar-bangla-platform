import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "ebook-files";
const DOWNLOAD_TTL_SECONDS = 300;

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("অনুমতি নেই");
}

/** Admin: get a one-time signed upload URL for a book's PDF. Path never leaves the server except as an opaque token. */
export const createEbookUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ebookId: string; sizeBytes?: number }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.ebookId)) throw new Error("Invalid ebook id");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${data.ebookId}/${crypto.randomUUID()}.pdf`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error("আপলোড লিংক তৈরি করা যায়নি");
    const { error: rowErr } = await context.supabase.from("ebook_files").upsert({
      ebook_id: data.ebookId,
      storage_path: path,
      size_bytes: data.sizeBytes ?? null,
      uploaded_by: context.userId,
    });
    if (rowErr) throw new Error("ফাইলের তথ্য সংরক্ষণ করা যায়নি");
    return { signedUrl: signed.signedUrl };
  });

/** Admin: publish/unpublish. Publishing requires an uploaded PDF. */
export const setEbookStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ebookId: string; status: "draft" | "published" | "hidden" }) => {
    if (!["draft", "published", "hidden"].includes(input.status)) throw new Error("Invalid status");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.status === "published") {
      const { data: file } = await context.supabase
        .from("ebook_files")
        .select("ebook_id")
        .eq("ebook_id", data.ebookId)
        .maybeSingle();
      if (!file) throw new Error("PDF আপলোড না করে প্রকাশ করা যাবে না");
    }
    const { error } = await context.supabase
      .from("ebooks")
      .update({
        status: data.status,
        published_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", data.ebookId);
    if (error) throw new Error("স্ট্যাটাস আপডেট করা যায়নি");
    return { ok: true };
  });

/** Signed-in user: short-lived download link, only if the book is in their library (paid & verified). */
export const getEbookDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ebookId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.ebookId)) throw new Error("Invalid ebook id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: owned } = await context.supabase
      .from("ebook_library")
      .select("id")
      .eq("user_id", context.userId)
      .eq("ebook_id", data.ebookId)
      .maybeSingle();
    if (!owned) return { url: null, error: "এই বইটি আপনার লাইব্রেরিতে নেই" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: file } = await supabaseAdmin
      .from("ebook_files")
      .select("storage_path")
      .eq("ebook_id", data.ebookId)
      .maybeSingle();
    if (!file) return { url: null, error: "ফাইল পাওয়া যায়নি" };

    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, DOWNLOAD_TTL_SECONDS, { download: true });
    if (error || !signed) return { url: null, error: "ডাউনলোড লিংক তৈরি করা যায়নি" };
    return { url: signed.signedUrl, expiresIn: DOWNLOAD_TTL_SECONDS, error: null };
  });

/**
 * Server-only entitlement grant. Call ONLY from a verified payment webhook
 * after the provider signature is checked. The DB trigger also refuses
 * library rows without a paid order carrying a payment reference.
 */
export async function grantEbookAccessAfterVerifiedPayment(args: {
  orderId: string;
  paymentProvider: string;
  paymentReference: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("ebook_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_provider: args.paymentProvider,
      payment_reference: args.paymentReference,
    })
    .eq("id", args.orderId)
    .eq("status", "pending")
    .select("id, user_id, ebook_id")
    .single();
  if (error || !order) throw new Error("order_not_pending");
  await supabaseAdmin
    .from("ebook_library")
    .upsert(
      { user_id: order.user_id, ebook_id: order.ebook_id, order_id: order.id },
      { onConflict: "user_id,ebook_id" },
    );
}
