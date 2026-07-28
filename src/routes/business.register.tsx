import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UPAZILAS, UNIONS_UKHIYA, type BusinessCategory } from "@/lib/business-shared";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/business/register")({
  head: () => ({
    meta: [
      { title: "ব্যবসা নিবন্ধন — খিজিরিয়ন" },
      { name: "description", content: "আপনার স্থানীয় ব্যবসা বিনামূল্যে খিজিরিয়নে নিবন্ধন করুন। যাচাইয়ের পর পাবলিক ডিরেক্টরিতে দেখাবে।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BusinessRegister,
});

const schema = z.object({
  name: z.string().trim().min(2, "ব্যবসার নাম আবশ্যক").max(120),
  category_id: z.string().uuid("ক্যাটাগরি নির্বাচন করুন"),
  short_description: z.string().trim().max(200).optional().or(z.literal("")),
  full_description: z.string().trim().max(2000).optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন"),
  whatsapp: z.string().trim().regex(/^\+?\d{10,15}$/).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  facebook_url: z.string().trim().url().optional().or(z.literal("")),
  website_url: z.string().trim().url().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  union_name: z.string().optional().or(z.literal("")),
  upazila: z.string(),
  established_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  products: z.string().trim().max(500).optional().or(z.literal("")),
});

async function uploadFile(userId: string, file: File, folder: string): Promise<string> {
  const { uploadImageToCloudinary } = await import("@/lib/cloudinary");
  return uploadImageToCloudinary(file, `ukhiya-seba/businesses/${userId}/${folder}`);
}

function BusinessRegister() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ slug: string } | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [ownerPhoto, setOwnerPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "", category_id: "", short_description: "", full_description: "",
    phone: "", whatsapp: "", email: "", facebook_url: "", website_url: "",
    address: "", area: "", union_name: "", upazila: "Ukhiya",
    established_year: "", products: "",
  });

  const catsQ = useQuery({
    queryKey: ["biz-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_categories").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data as BusinessCategory[];
    },
  });

  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.error("ব্যবসা যোগ করতে লগইন করুন");
      navigate({ to: "/auth" });
      return;
    }
    const parsed = schema.safeParse({
      ...form,
      established_year: form.established_year === "" ? undefined : Number(form.established_year),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ফর্ম যাচাই করুন");
      return;
    }
    setSubmitting(true);
    try {
      const [logo_path, cover_path, owner_path] = await Promise.all([
        logo ? uploadFile(user.id, logo, "logo") : Promise.resolve(null),
        cover ? uploadFile(user.id, cover, "cover") : Promise.resolve(null),
        ownerPhoto ? uploadFile(user.id, ownerPhoto, "owner") : Promise.resolve(null),
      ]);
      const products = parsed.data.products
        ? parsed.data.products.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const { data, error } = await supabase.from("businesses").insert({
        owner_id: user.id,
        name: parsed.data.name,
        category_id: parsed.data.category_id,
        short_description: parsed.data.short_description || null,
        full_description: parsed.data.full_description || null,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp || null,
        email: parsed.data.email || null,
        facebook_url: parsed.data.facebook_url || null,
        website_url: parsed.data.website_url || null,
        address: parsed.data.address || null,
        area: parsed.data.area || null,
        union_name: parsed.data.union_name || null,
        upazila: parsed.data.upazila,
        established_year: parsed.data.established_year ?? null,
        products,
        logo_url: logo_path,
        cover_url: cover_path,
        owner_photo_url: owner_path,
        status: "pending",
      }).select("slug, id").single();
      if (error) throw error;
      setDone({ slug: data?.slug || data?.id || "" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold">নিবন্ধন সফল হয়েছে</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          আপনার ব্যবসাটি প্রশাসকের অনুমোদনের জন্য অপেক্ষমাণ। অনুমোদনের পর এটি পাবলিক ডিরেক্টরিতে দেখা যাবে।
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/business">ডিরেক্টরিতে ফিরে যান</Link></Button>
          <Button asChild><Link to="/my-business">আমার ব্যবসা দেখুন</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link to="/business" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> ডিরেক্টরি
      </Link>
      <h1 className="text-2xl font-bold sm:text-3xl">🏪 ব্যবসা নিবন্ধন</h1>
      <p className="mt-1 text-sm text-muted-foreground">সম্পূর্ণ বিনামূল্যে। প্রশাসক অনুমোদনের পর প্রোফাইল পাবলিক হবে।</p>

      {!isAuthenticated && (
        <Card className="mt-4 border-amber-300 bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          ব্যবসা যোগ করতে <Link to="/auth" className="font-semibold text-primary underline">লগইন করুন</Link>।
        </Card>
      )}

      <Card className="mt-5">
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>ব্যবসার নাম *</Label>
              <Input value={form.name} onChange={(e) => upd("name", e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Label>ক্যাটাগরি *</Label>
              <Select value={form.category_id} onValueChange={(v) => upd("category_id", v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {(catsQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name_bn} — {c.group_bn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>সংক্ষিপ্ত বিবরণ (সর্বোচ্চ ২০০ অক্ষর)</Label>
              <Input value={form.short_description} onChange={(e) => upd("short_description", e.target.value)} maxLength={200} />
            </div>
            <div className="sm:col-span-2">
              <Label>বিস্তারিত বিবরণ</Label>
              <Textarea rows={4} value={form.full_description} onChange={(e) => upd("full_description", e.target.value)} />
            </div>

            <div>
              <Label>ফোন *</Label>
              <Input inputMode="tel" value={form.phone} onChange={(e) => upd("phone", e.target.value)} required />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input inputMode="tel" value={form.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} />
            </div>
            <div>
              <Label>ইমেইল</Label>
              <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} />
            </div>
            <div>
              <Label>Facebook Page URL</Label>
              <Input value={form.facebook_url} onChange={(e) => upd("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="sm:col-span-2">
              <Label>ওয়েবসাইট</Label>
              <Input value={form.website_url} onChange={(e) => upd("website_url", e.target.value)} placeholder="https://..." />
            </div>

            <div className="sm:col-span-2">
              <Label>পূর্ণ ঠিকানা</Label>
              <Input value={form.address} onChange={(e) => upd("address", e.target.value)} />
            </div>
            <div>
              <Label>এলাকা</Label>
              <Input value={form.area} onChange={(e) => upd("area", e.target.value)} placeholder="যেমন: কুতুপালং বাজার" />
            </div>
            <div>
              <Label>ইউনিয়ন</Label>
              <Select value={form.union_name} onValueChange={(v) => upd("union_name", v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {UNIONS_UKHIYA.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>উপজেলা</Label>
              <Select value={form.upazila} onValueChange={(v) => upd("upazila", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UPAZILAS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>প্রতিষ্ঠার বছর</Label>
              <Input type="number" min={1900} max={new Date().getFullYear()} value={form.established_year} onChange={(e) => upd("established_year", e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <Label>পণ্য / সেবা (কমা দিয়ে আলাদা করুন)</Label>
              <Input value={form.products} onChange={(e) => upd("products", e.target.value)} placeholder="যেমন: চাল, ডাল, চিনি" />
            </div>

            <div>
              <Label>লোগো</Label>
              <Input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Label>কভার ফটো</Label>
              <Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Label>মালিকের ফটো</Label>
              <Input type="file" accept="image/*" onChange={(e) => setOwnerPhoto(e.target.files?.[0] ?? null)} />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting} className="w-full h-12" size="lg">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                নিবন্ধন জমা দিন
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
