import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Droplet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BLOOD_GROUPS, GENDERS, UKHIYA_UNIONS, normalizePhone } from "@/lib/blood-shared";

export const Route = createFileRoute("/blood-donors/register")({
  head: () => ({
    meta: [
      { title: "রক্তদাতা নিবন্ধন — উখিয়া সেবা" },
      {
        name: "description",
        content:
          "উখিয়ার রক্তদাতা ডিরেক্টরিতে বিনামূল্যে নিবন্ধন করুন। জরুরি সময়ে জীবন বাঁচাতে সাহায্য করুন।",
      },
      { property: "og:title", content: "রক্তদাতা হিসেবে যুক্ত হোন — উখিয়া সেবা" },
      {
        property: "og:description",
        content: "সহজে নিবন্ধন করে আপনার এলাকার প্রয়োজনে রক্তদাতা হিসেবে যুক্ত হোন।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterDonor,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "নাম আবশ্যক").max(80),
  blood_group: z.enum(BLOOD_GROUPS, { message: "রক্তের গ্রুপ নির্বাচন করুন" }),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, "সঠিক WhatsApp নম্বর দিন")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional(),
  age: z.number().int().min(16, "বয়স কমপক্ষে ১৬").max(80, "বয়স ৮০ এর কম").optional(),
  union_name: z.string().trim().max(80).optional().or(z.literal("")),
  village: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  last_donation_date: z.string().optional().or(z.literal("")),
  available: z.boolean(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

function RegisterDonor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    blood_group: "",
    phone: "",
    whatsapp: "",
    gender: "",
    age: "",
    union_name: "",
    village: "",
    address: "",
    last_donation_date: "",
    available: true,
    notes: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      phone: normalizePhone(form.phone),
      whatsapp: form.whatsapp ? normalizePhone(form.whatsapp) : "",
      age: form.age === "" ? undefined : Number(form.age),
      gender: form.gender || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ফর্ম যাচাই করুন");
      return;
    }
    setSubmitting(true);
    try {
      // Duplicate phone check
      const { data: existing } = await supabase
        .from("blood_donors")
        .select("id")
        .eq("phone", parsed.data.phone)
        .maybeSingle();
      if (existing) {
        toast.error("এই ফোন নম্বরে ইতিমধ্যে নিবন্ধন করা হয়েছে");
        setSubmitting(false);
        return;
      }

      let photo_url: string | null = null;
      if (photoFile) {
        const { uploadImageToCloudinary } = await import("@/lib/cloudinary");
        photo_url = await uploadImageToCloudinary(
          photoFile,
          `ukhiya-seba/blood-donors/${user?.id ?? "guest"}`,
        );
      }

      const { error } = await supabase.from("blood_donors").insert({
        user_id: user?.id ?? null,
        full_name: parsed.data.full_name,
        blood_group: parsed.data.blood_group,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp || null,
        gender: parsed.data.gender ?? null,
        age: parsed.data.age ?? null,
        union_name: parsed.data.union_name || null,
        village: parsed.data.village || null,
        address: parsed.data.address || null,
        last_donation_date: parsed.data.last_donation_date || null,
        available: parsed.data.available,
        photo_url,
        notes: parsed.data.notes || null,
        status: "pending",
      });
      if (error) {
        if (String(error.message).toLowerCase().includes("duplicate")) {
          toast.error("এই ফোন নম্বরে ইতিমধ্যে নিবন্ধন করা হয়েছে");
        } else {
          throw error;
        }
        return;
      }
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message || "নিবন্ধন ব্যর্থ হয়েছে");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-bold">নিবন্ধন সফল হয়েছে</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ধন্যবাদ! প্রশাসকের অনুমোদনের পর আপনার প্রোফাইল পাবলিক ডিরেক্টরিতে দেখা যাবে।
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link to="/blood-donors">ডিরেক্টরিতে ফিরুন</Link>
          </Button>
          <Button onClick={() => navigate({ to: "/" })}>হোমে যান</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link
        to="/blood-donors"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> ডিরেক্টরি
      </Link>
      <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
        <Droplet className="h-6 w-6 fill-red-600 text-red-600" /> ❤️ রক্তদাতা নিবন্ধন
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        সম্পূর্ণ বিনামূল্যে। প্রশাসক অনুমোদনের পর আপনার প্রোফাইল পাবলিক হবে।
      </p>

      <Card className="mt-5">
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>পূর্ণ নাম *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>রক্তের গ্রুপ *</Label>
              <Select value={form.blood_group} onValueChange={(v) => update("blood_group", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>লিঙ্গ</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>মোবাইল নম্বর *</Label>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                inputMode="tel"
                placeholder="01XXXXXXXXX"
                required
              />
            </div>
            <div>
              <Label>WhatsApp নম্বর</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
                inputMode="tel"
                placeholder="ফোনের মত হলে খালি রাখুন"
              />
            </div>

            <div>
              <Label>বয়স</Label>
              <Input
                value={form.age}
                onChange={(e) => update("age", e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="১৮"
              />
            </div>
            <div>
              <Label>শেষ রক্তদানের তারিখ</Label>
              <Input
                type="date"
                value={form.last_donation_date}
                onChange={(e) => update("last_donation_date", e.target.value)}
              />
            </div>

            <div>
              <Label>ইউনিয়ন</Label>
              <Select value={form.union_name} onValueChange={(v) => update("union_name", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {UKHIYA_UNIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>গ্রাম</Label>
              <Input value={form.village} onChange={(e) => update("village", e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <Label>সম্পূর্ণ ঠিকানা</Label>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <Label>প্রোফাইল ছবি</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Cloudinary-তে সংরক্ষিত হবে (সর্বোচ্চ ১০MB)।
              </p>
            </div>

            <div className="sm:col-span-2">
              <Label>অতিরিক্ত মন্তব্য</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            <label className="col-span-full flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-red-600"
                checked={form.available}
                onChange={(e) => update("available", e.target.checked)}
              />
              এই মুহূর্তে রক্ত দিতে প্রস্তুত
            </label>

            <div className="col-span-full flex justify-end gap-2 pt-2">
              <Button asChild variant="outline">
                <Link to="/blood-donors">বাতিল</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                নিবন্ধন করুন
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
