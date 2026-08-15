import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GovtPhoto } from "@/components/govt/GovtPhoto";
import { useMyGovtProfile } from "@/components/govt/use-govt";
import { useAuth } from "@/hooks/use-auth";
import { upsertMyGovtProfile } from "@/lib/govt.functions";
import {
  GOVT_BIO_MAX,
  GOVT_DEPARTMENTS,
  GOVT_DISCLAIMER,
  GOVT_DISTRICT_FILTERS,
  GOVT_JOB_CATEGORY_SUGGESTIONS,
  GOVT_PHONE_VISIBILITY_META,
  GOVT_STATUS_META,
  GOVT_TIPS_MAX,
  UKHIYA_AREAS,
  normalizeGovtPhone,
  type GovtPhoneVisibility,
} from "@/lib/govt-shared";

export const Route = createFileRoute("/govt-jobs/register")({
  head: () => ({
    meta: [
      { title: "সরকারি চাকরিজীবী নিবন্ধন — KHIJIRION" },
      {
        name: "description",
        content: "উখিয়ার সরকারি চাকরিজীবী ডিরেক্টরিতে নিজের প্রোফাইল যুক্ত করুন ও তথ্য হালনাগাদ করুন।",
      },
      { property: "og:title", content: "সরকারি চাকরিজীবী নিবন্ধন — KHIJIRION" },
      { property: "og:description", content: "নিজের সরকারি চাকরির প্রোফাইল তৈরি ও সম্পাদনা করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GovtRegister,
});

type FormState = {
  full_name: string;
  photo_url: string;
  designation: string;
  organization: string;
  department: string;
  job_category: string;
  current_workplace: string;
  current_district: string;
  current_upazila: string;
  ukhiya_area: string;
  joining_year: string;
  bio: string;
  tips_for_younger: string;
  phone: string;
  whatsapp: string;
  official_email: string;
  phone_visibility: GovtPhoneVisibility;
  consent_given: boolean;
};

const EMPTY: FormState = {
  full_name: "",
  photo_url: "",
  designation: "",
  organization: "",
  department: GOVT_DEPARTMENTS[0],
  job_category: "",
  current_workplace: "",
  current_district: GOVT_DISTRICT_FILTERS[0],
  current_upazila: "",
  ukhiya_area: UKHIYA_AREAS[0],
  joining_year: "",
  bio: "",
  tips_for_younger: "",
  phone: "",
  whatsapp: "",
  official_email: "",
  phone_visibility: "members",
  consent_given: false,
};

function GovtRegister() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const mineQ = useMyGovtProfile(user?.id);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth", search: { redirect: "/govt-jobs/register" } });
    }
  }, [authLoading, user, navigate]);

  const mine = mineQ.data ?? null;
  useEffect(() => {
    if (!mine || loadedId === mine.id) return;
    setLoadedId(mine.id);
    setForm({
      full_name: mine.full_name,
      photo_url: mine.photo_url ?? "",
      designation: mine.designation,
      organization: mine.organization,
      department: mine.department,
      job_category: mine.job_category ?? "",
      current_workplace: mine.current_workplace ?? "",
      current_district: mine.current_district,
      current_upazila: mine.current_upazila ?? "",
      ukhiya_area: mine.ukhiya_area,
      joining_year: mine.joining_year ? String(mine.joining_year) : "",
      bio: mine.bio ?? "",
      tips_for_younger: mine.tips_for_younger ?? "",
      phone: mine.phone ?? "",
      whatsapp: mine.whatsapp ?? "",
      official_email: mine.official_email ?? "",
      phone_visibility: mine.phone_visibility,
      consent_given: mine.consent_given,
    });
  }, [mine, loadedId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onPhoto(file: File | null) {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const { uploadImageToCloudinary } = await import("@/lib/cloudinary");
      const url = await uploadImageToCloudinary(file, `ukhiya-seba/govt-workers/${user.id}`);
      set("photo_url", url);
      toast.success("ছবি আপলোড হয়েছে");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.full_name.trim().length < 2) return toast.error("পূর্ণ নাম লিখুন");
    if (form.designation.trim().length < 2) return toast.error("পদবি লিখুন");
    if (form.organization.trim().length < 2) return toast.error("প্রতিষ্ঠানের নাম লিখুন");
    if (!form.consent_given) return toast.error("তথ্য প্রকাশে সম্মতি দিন");
    if (form.phone_visibility !== "hidden" && !form.phone.trim())
      return toast.error("মোবাইল নম্বর দিন অথবা 'প্রকাশ করতে চাই না' নির্বাচন করুন");

    setSaving(true);
    try {
      await upsertMyGovtProfile({
        data: {
          full_name: form.full_name.trim(),
          photo_url: form.photo_url.trim() || null,
          designation: form.designation.trim(),
          organization: form.organization.trim(),
          department: form.department,
          job_category: form.job_category.trim() || null,
          current_workplace: form.current_workplace.trim() || null,
          current_district: form.current_district,
          current_upazila: form.current_upazila.trim() || null,
          ukhiya_area: form.ukhiya_area,
          joining_year: form.joining_year ? Number(form.joining_year) : null,
          bio: form.bio.trim() || null,
          tips_for_younger: form.tips_for_younger.trim() || null,
          phone: form.phone.trim() ? normalizeGovtPhone(form.phone) : null,
          whatsapp: form.whatsapp.trim() ? normalizeGovtPhone(form.whatsapp) : null,
          official_email: form.official_email.trim() || null,
          phone_visibility: form.phone_visibility,
          consent_given: form.consent_given,
        },
      });
      await qc.invalidateQueries({ queryKey: ["govt"] });
      toast.success(
        mine ? "প্রোফাইল হালনাগাদ হয়েছে — পুনরায় যাচাইয়ের জন্য অপেক্ষমাণ" : "প্রোফাইল জমা হয়েছে — যাচাইয়ের অপেক্ষায়",
      );
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || (user && mineQ.isLoading)) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  const statusMeta = mine ? GOVT_STATUS_META[mine.status] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/govt-jobs">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> ডিরেক্টরিতে ফিরে যান
        </Link>
      </Button>

      <h1 className="text-2xl font-bold sm:text-3xl">
        {mine ? "আমার প্রোফাইল সম্পাদনা" : "সরকারি চাকরিজীবী নিবন্ধন"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        আপনি কেবল নিজের প্রোফাইলটিই তৈরি ও সম্পাদনা করতে পারবেন। যাচাই ও অনুমোদন প্রশাসক করবেন।
      </p>

      {mine && statusMeta && (
        <Card className="mt-5 border-border/60 bg-card/70">
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}>
              অবস্থা: {statusMeta.label}
            </span>
            {mine.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <BadgeCheck className="h-4 w-4" /> যাচাইকৃত
              </span>
            )}
            {mine.status === "approved" && mine.is_verified && (
              <Button asChild size="sm" variant="outline" className="ml-auto">
                <Link to="/govt-jobs/$id" params={{ id: mine.id }}>
                  পাবলিক প্রোফাইল দেখুন
                </Link>
              </Button>
            )}
            {mine.admin_note && (
              <p className="w-full text-xs text-muted-foreground">প্রশাসকের মন্তব্য: {mine.admin_note}</p>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <Card className="border-border/60 bg-card/70">
          <CardContent className="space-y-4 py-6">
            <div className="flex items-center gap-4">
              <GovtPhoto url={form.photo_url || null} alt="প্রোফাইল ছবি" className="h-20 w-20 rounded-2xl ring-2 ring-border/70" />
              <div>
                <Label htmlFor="photo" className="mb-1.5 block">ছবি (ঐচ্ছিক)</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)}
                />
                {uploading && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Upload className="h-3.5 w-3.5" /> আপলোড হচ্ছে…
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full_name">পূর্ণ নাম *</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="designation">পদবি *</Label>
                <Input id="designation" value={form.designation} onChange={(e) => set("designation", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="organization">প্রতিষ্ঠান / দপ্তর *</Label>
                <Input id="organization" value={form.organization} onChange={(e) => set("organization", e.target.value)} />
              </div>
              <div>
                <Label>বিভাগ *</Label>
                <Select value={form.department} onValueChange={(v) => set("department", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOVT_DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>চাকরির ধরন</Label>
                <Select value={form.job_category || "none"} onValueChange={(v) => set("job_category", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">নির্বাচন করা হয়নি</SelectItem>
                    {GOVT_JOB_CATEGORY_SUGGESTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="joining_year">চাকরিতে যোগদানের বছর</Label>
                <Input
                  id="joining_year"
                  inputMode="numeric"
                  value={form.joining_year}
                  onChange={(e) => set("joining_year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="current_workplace">বর্তমান কর্মস্থল</Label>
              <Input id="current_workplace" value={form.current_workplace} onChange={(e) => set("current_workplace", e.target.value)} />
            </div>
            <div>
              <Label>বর্তমান জেলা *</Label>
              <Select value={form.current_district} onValueChange={(v) => set("current_district", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOVT_DISTRICT_FILTERS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="current_upazila">বর্তমান উপজেলা</Label>
              <Input id="current_upazila" value={form.current_upazila} onChange={(e) => set("current_upazila", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>উখিয়ায় নিজ এলাকা *</Label>
              <Select value={form.ukhiya_area} onValueChange={(v) => set("ukhiya_area", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UKHIYA_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardContent className="space-y-4 py-6">
            <div>
              <Label htmlFor="bio">আমার পরিচিতি ({form.bio.length}/{GOVT_BIO_MAX})</Label>
              <Textarea
                id="bio"
                rows={4}
                maxLength={GOVT_BIO_MAX}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tips">তরুণদের জন্য পরামর্শ ({form.tips_for_younger.length}/{GOVT_TIPS_MAX})</Label>
              <Textarea
                id="tips"
                rows={5}
                maxLength={GOVT_TIPS_MAX}
                value={form.tips_for_younger}
                onChange={(e) => set("tips_for_younger", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardContent className="space-y-4 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">মোবাইল নম্বর</Label>
                <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp (ঐচ্ছিক)</Label>
                <Input id="whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">অফিসিয়াল ইমেইল (ঐচ্ছিক)</Label>
                <Input id="email" type="email" value={form.official_email} onChange={(e) => set("official_email", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>মোবাইল নম্বরের গোপনীয়তা *</Label>
              <Select value={form.phone_visibility} onValueChange={(v) => set("phone_visibility", v as GovtPhoneVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(GOVT_PHONE_VISIBILITY_META) as GovtPhoneVisibility[]).map((k) => (
                    <SelectItem key={k} value={k}>{GOVT_PHONE_VISIBILITY_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {GOVT_PHONE_VISIBILITY_META[form.phone_visibility].hint}
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <Checkbox
                checked={form.consent_given}
                onCheckedChange={(v) => set("consent_given", v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground">
                আমি স্বেচ্ছায় আমার তথ্য এই কমিউনিটি ডিরেক্টরিতে প্রকাশে সম্মতি দিচ্ছি এবং নিশ্চিত করছি যে তথ্যগুলো সঠিক।
              </span>
            </label>

            <p className="text-xs text-muted-foreground">{GOVT_DISCLAIMER}</p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving || uploading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mine ? "হালনাগাদ করুন" : "জমা দিন"}
          </Button>
        </div>
      </form>
    </div>
  );
}
