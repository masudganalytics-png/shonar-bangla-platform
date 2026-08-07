import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMyProbashiProfile } from "@/components/probashi/use-probashi";
import {
  PROBASHI_COUNTRIES,
  PROBASHI_STATUS_META,
  UKHIYA_UNIONS_PROBASHI,
  countryMeta,
  normalizeProbashiPhone,
} from "@/lib/probashi-shared";

export const Route = createFileRoute("/probashi/register")({
  head: () => ({
    meta: [
      { title: "প্রবাসী কর্নারে যুক্ত হোন — উখিয়া সেবা" },
      {
        name: "description",
        content: "উখিয়ার প্রবাসী ডিরেক্টরিতে বিনামূল্যে নিবন্ধন করুন এবং এলাকার মানুষের সাথে সংযুক্ত থাকুন।",
      },
      { property: "og:title", content: "প্রবাসী কর্নারে যুক্ত হোন — উখিয়া সেবা" },
      { property: "og:description", content: "প্রবাসী প্রোফাইল তৈরি করে এলাকার সাথে যুক্ত থাকুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProbashiRegister,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "নাম আবশ্যক").max(80, "নাম অনেক বড়"),
  country: z.string().trim().min(2, "দেশ নির্বাচন করুন"),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  village: z.string().trim().max(80).optional().or(z.literal("")),
  profession: z.string().trim().max(80).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  moved_abroad_date: z.string().optional().or(z.literal("")),
  expected_return_date: z.string().optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন").optional().or(z.literal("")),
  whatsapp: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক WhatsApp নম্বর দিন").optional().or(z.literal("")),
  facebook_url: z.string().trim().url("সঠিক লিংক দিন").max(300).optional().or(z.literal("")),
  community_message: z.string().trim().max(120, "বার্তা সর্বোচ্চ ১২০ অক্ষর").optional().or(z.literal("")),
  show_contact: z.boolean(),
});

const EMPTY = {
  full_name: "",
  country: "",
  city: "",
  village: "",
  profession: "",
  birth_date: "",
  moved_abroad_date: "",
  expected_return_date: "",
  phone: "",
  whatsapp: "",
  facebook_url: "",
  community_message: "",
  show_contact: true,
};

function ProbashiRegister() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { data: mine, isLoading: loadingMine, refetch } = useMyProbashiProfile(user?.id);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!mine) return;
    setForm({
      full_name: mine.full_name ?? "",
      country: countryMeta(mine.country).name,
      city: mine.city ?? "",
      village: mine.village ?? "",
      profession: mine.profession ?? "",
      birth_date: mine.birth_date ?? "",
      moved_abroad_date: mine.moved_abroad_date ?? "",
      expected_return_date: mine.expected_return_date ?? "",
      phone: mine.phone ?? "",
      whatsapp: mine.whatsapp ?? "",
      facebook_url: mine.facebook_url ?? "",
      community_message: mine.community_message ?? "",
      show_contact: mine.show_contact,
    });
  }, [mine]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (loading || (isAuthenticated && loadingMine)) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">লোড হচ্ছে…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <UserPlus className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">প্রবাসী কর্নারে যুক্ত হোন</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          প্রোফাইল তৈরি করতে প্রথমে সাইন ইন করুন। এতে আপনার তথ্য শুধু আপনিই সম্পাদনা করতে পারবেন।
        </p>
        <Button asChild className="mt-5">
          <Link to="/auth" search={{ mode: "login", redirect: "/probashi/register" }}>সাইন ইন করুন</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      phone: form.phone ? normalizeProbashiPhone(form.phone) : "",
      whatsapp: form.whatsapp ? normalizeProbashiPhone(form.whatsapp) : "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ফর্ম যাচাই করুন");
      return;
    }
    setSubmitting(true);
    try {
      let photo_url: string | null = mine?.photo_url ?? null;
      if (photoFile) {
        const { uploadImageToCloudinary } = await import("@/lib/cloudinary");
        photo_url = await uploadImageToCloudinary(photoFile, `ukhiya-seba/probashi/${user?.id ?? "guest"}`);
      }

      const v = parsed.data;
      const meta = countryMeta(v.country);
      const values = {
        user_id: user!.id,
        full_name: v.full_name,
        country: meta.name,
        country_code: meta.iso,
        city: v.city || null,
        village: v.village || null,
        profession: v.profession || null,
        birth_date: v.birth_date || null,
        moved_abroad_date: v.moved_abroad_date || null,
        expected_return_date: v.expected_return_date || null,
        phone: v.phone || null,
        whatsapp: v.whatsapp || null,
        facebook_url: v.facebook_url || null,
        community_message: v.community_message || null,
        show_contact: v.show_contact,
        photo_url,
      };

      if (mine) {
        const { error } = await supabase.from("probashi_profiles").update(values).eq("id", mine.id);
        if (error) throw new Error(error.message);
        toast.success("প্রোফাইল হালনাগাদ হয়েছে — পুনরায় অনুমোদনের অপেক্ষায় থাকবে।");
      } else {
        const { error } = await supabase.from("probashi_profiles").insert(values);
        if (error) throw new Error(error.message);
        toast.success("নিবন্ধন সম্পন্ন! অনুমোদনের পর প্রোফাইল প্রকাশিত হবে।");
      }
      await refetch();
      navigate({ to: "/probashi" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "সংরক্ষণ করা যায়নি");
    } finally {
      setSubmitting(false);
    }
  }

  const statusMeta = mine ? PROBASHI_STATUS_META[mine.status as keyof typeof PROBASHI_STATUS_META] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link to="/probashi" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> প্রবাসী কর্নারে ফিরুন
      </Link>

      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
        {mine ? "আমার প্রবাসী প্রোফাইল সম্পাদনা" : "প্রবাসী নিবন্ধন"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        তথ্য জমা দেওয়ার পর প্রশাসকের অনুমোদন সাপেক্ষে প্রোফাইল প্রকাশিত হবে।
      </p>

      {statusMeta && (
        <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}>
          বর্তমান অবস্থা: {statusMeta.label}
        </p>
      )}

      <Card className="mt-6">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="full_name">পূর্ণ নাম *</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="যেমন: মোহাম্মদ রফিক" required />
              </div>

              <div>
                <Label htmlFor="country">যে দেশে আছেন *</Label>
                <Select value={form.country} onValueChange={(v) => update("country", v)}>
                  <SelectTrigger id="country"><SelectValue placeholder="দেশ নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {PROBASHI_COUNTRIES.map((c) => (
                      <SelectItem key={c.iso} value={c.name}>{c.bn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">শহর</Label>
                <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="যেমন: রিয়াদ" />
              </div>

              <div>
                <Label htmlFor="village">উখিয়ার ইউনিয়ন/গ্রাম</Label>
                <Select value={form.village} onValueChange={(v) => update("village", v)}>
                  <SelectTrigger id="village"><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {UKHIYA_UNIONS_PROBASHI.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="profession">পেশা</Label>
                <Input id="profession" value={form.profession} onChange={(e) => update("profession", e.target.value)} placeholder="যেমন: ইলেকট্রিশিয়ান" />
              </div>

              <div>
                <Label htmlFor="birth_date">জন্ম তারিখ</Label>
                <Input id="birth_date" type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
              </div>

              <div>
                <Label htmlFor="moved_abroad_date">প্রবাসে যাওয়ার তারিখ</Label>
                <Input id="moved_abroad_date" type="date" value={form.moved_abroad_date} onChange={(e) => update("moved_abroad_date", e.target.value)} />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="expected_return_date">দেশে ফেরার সম্ভাব্য তারিখ</Label>
                <Input id="expected_return_date" type="date" value={form.expected_return_date} onChange={(e) => update("expected_return_date", e.target.value)} />
              </div>

              <div>
                <Label htmlFor="phone">ফোন নম্বর</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+8801XXXXXXXXX" inputMode="tel" />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp নম্বর</Label>
                <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+966XXXXXXXXX" inputMode="tel" />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="facebook_url">ফেসবুক প্রোফাইল লিংক</Label>
                <Input id="facebook_url" value={form.facebook_url} onChange={(e) => update("facebook_url", e.target.value)} placeholder="https://facebook.com/username" />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="community_message">এলাকাবাসীর জন্য বার্তা (সর্বোচ্চ ১২০ অক্ষর)</Label>
                <Textarea
                  id="community_message"
                  value={form.community_message}
                  onChange={(e) => update("community_message", e.target.value.slice(0, 120))}
                  placeholder="যেমন: সবাই ভালো থাকুন, দোয়া করবেন।"
                  rows={2}
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">{form.community_message.length}/120</p>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="photo">প্রোফাইল ছবি</Label>
                <Input id="photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-4">
              <Switch id="show_contact" checked={form.show_contact} onCheckedChange={(v) => update("show_contact", v)} />
              <div>
                <Label htmlFor="show_contact" className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" /> যোগাযোগ নম্বর দেখানোর অনুমতি
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  বন্ধ থাকলে আপনার ফোন/WhatsApp নম্বর কেউ দেখতে পাবেন না। চালু থাকলেও নম্বর শুধুমাত্র
                  সাইন-ইন করা ব্যবহারকারীদের কাছে প্রকাশ পাবে — সার্চ ইঞ্জিনে নয়।
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mine ? "হালনাগাদ করুন" : "নিবন্ধন সম্পন্ন করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
