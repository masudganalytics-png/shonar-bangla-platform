import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, HeartHandshake, Loader2, ShieldCheck } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { createMatchRequest } from "@/lib/match.functions";
import {
  MARITAL_LABEL,
  MATCH_AREAS,
  MATCH_DISCLAIMER,
  MATCH_EDUCATION_OPTIONS,
  normalizeMatchPhone,
  type MatchMaritalStatus,
} from "@/lib/match-shared";

export const Route = createFileRoute("/match/new")({
  head: () => ({
    meta: [
      { title: "নতুন ম্যাচ রিকোয়েস্ট — KHIJIRION Match" },
      {
        name: "description",
        content: "পরিবারভিত্তিক পাত্র-পাত্রী রিকোয়েস্ট তৈরি করুন। যোগাযোগের নম্বর গোপন থাকবে।",
      },
      { property: "og:title", content: "নতুন ম্যাচ রিকোয়েস্ট — KHIJIRION Match" },
      { property: "og:description", content: "যাচাইয়ের পর আপনার রিকোয়েস্ট প্রকাশিত হবে।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MatchNew,
});

const schema = z.object({
  display_name: z.string().trim().min(2, "নাম আবশ্যক").max(80, "নাম অনেক বড়"),
  looking_for: z.enum(["groom", "bride"], { message: "পাত্র নাকি পাত্রী নির্বাচন করুন" }),
  created_for: z.enum(["self", "guardian"]),
  age_min: z.number().int().min(18, "সর্বনিম্ন বয়স ১৮").max(80),
  age_max: z.number().int().min(18).max(80),
  area: z.string().trim().min(1, "এলাকা নির্বাচন করুন"),
  education: z.string().trim().max(120),
  profession: z.string().trim().max(120),
  marital_status: z.enum(["unmarried", "divorced", "widowed"]),
  height_cm: z.string().trim(),
  family_info: z.string().trim().max(1200),
  expectations: z.string().trim().max(1200),
  photo_url: z.string().trim().max(500),
  contact_name: z.string().trim().max(80),
  contact_phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন"),
});

const EMPTY = {
  display_name: "",
  looking_for: "groom",
  created_for: "self",
  age_min: "22",
  age_max: "30",
  area: "",
  education: "",
  profession: "",
  marital_status: "unmarried",
  height_cm: "",
  family_info: "",
  expectations: "",
  photo_url: "",
  contact_name: "",
  contact_phone: "",
};

function MatchNew() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const create = useServerFn(createMatchRequest);
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (values: MatchRequestInput) => create({ data: values }),

    onSuccess: () => {
      toast.success("রিকোয়েস্ট জমা হয়েছে — যাচাইয়ের পর প্রকাশিত হবে");
      navigate({ to: "/my-match" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">লোড হচ্ছে…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <HeartHandshake className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">লগইন প্রয়োজন</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ম্যাচ রিকোয়েস্ট তৈরি করতে প্রথমে অ্যাকাউন্টে প্রবেশ করুন।
        </p>
        <Button asChild className="mt-5">
          <Link to="/auth">লগইন করুন</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      age_min: Number(form.age_min),
      age_max: Number(form.age_max),
      contact_phone: normalizeMatchPhone(form.contact_phone),
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) map[String(issue.path[0])] = issue.message;
      setErrors(map);
      toast.error("ফর্মে কিছু ভুল আছে");
      return;
    }
    if (parsed.data.age_max < parsed.data.age_min) {
      setErrors({ age_max: "সর্বোচ্চ বয়স সর্বনিম্নের চেয়ে বড় হতে হবে" });
      toast.error("বয়সের সীমা সঠিক নয়");
      return;
    }
    setErrors({});
    const d = parsed.data;
    mutation.mutate({
      display_name: d.display_name,
      looking_for: d.looking_for,
      created_for: d.created_for,
      age_min: d.age_min,
      age_max: d.age_max,
      area: d.area,
      education: d.education || null,
      profession: d.profession || null,
      marital_status: d.marital_status,
      height_cm: d.height_cm ? Number(d.height_cm) : null,
      family_info: d.family_info || null,
      expectations: d.expectations || null,
      photo_url: d.photo_url || null,
      contact_name: d.contact_name || null,
      contact_phone: d.contact_phone,
    });
  };

  const err = (k: string) =>
    errors[k] ? <p className="mt-1 text-xs text-destructive">{errors[k]}</p> : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/match" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> ম্যাচ তালিকায় ফিরুন
      </Link>

      <h1 className="mt-4 text-2xl font-bold">নতুন ম্যাচ রিকোয়েস্ট</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        আপনার যোগাযোগের নম্বর কখনো প্রকাশ্যে দেখানো হবে না। আগ্রহ গ্রহণ করলেই কেবল তা প্রকাশ পাবে।
      </p>

      <Card className="mt-6">
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="display_name">প্রদর্শিত নাম</Label>
              <Input
                id="display_name"
                value={form.display_name}
                onChange={(e) => set("display_name", e.target.value)}
                placeholder="যেমন: রহিমা আক্তার / পরিবার—উখিয়া"
              />
              {err("display_name")}
            </div>

            <div>
              <Label>কী খুঁজছেন</Label>
              <Select value={form.looking_for} onValueChange={(v) => set("looking_for", v)}>
                <SelectTrigger aria-label="কী খুঁজছেন"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="groom">পাত্র</SelectItem>
                  <SelectItem value="bride">পাত্রী</SelectItem>
                </SelectContent>
              </Select>
              {err("looking_for")}
            </div>

            <div>
              <Label>কার জন্য</Label>
              <Select value={form.created_for} onValueChange={(v) => set("created_for", v)}>
                <SelectTrigger aria-label="কার জন্য"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">নিজের জন্য</SelectItem>
                  <SelectItem value="guardian">অভিভাবকের জন্য</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="age_min">সর্বনিম্ন বয়স</Label>
              <Input
                id="age_min"
                inputMode="numeric"
                value={form.age_min}
                onChange={(e) => set("age_min", e.target.value)}
              />
              {err("age_min")}
            </div>

            <div>
              <Label htmlFor="age_max">সর্বোচ্চ বয়স</Label>
              <Input
                id="age_max"
                inputMode="numeric"
                value={form.age_max}
                onChange={(e) => set("age_max", e.target.value)}
              />
              {err("age_max")}
            </div>

            <div>
              <Label>এলাকা</Label>
              <Select value={form.area} onValueChange={(v) => set("area", v)}>
                <SelectTrigger aria-label="এলাকা"><SelectValue placeholder="এলাকা নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {MATCH_AREAS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("area")}
            </div>

            <div>
              <Label>বৈবাহিক অবস্থা</Label>
              <Select value={form.marital_status} onValueChange={(v) => set("marital_status", v)}>
                <SelectTrigger aria-label="বৈবাহিক অবস্থা"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(MARITAL_LABEL) as MatchMaritalStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>{MARITAL_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>শিক্ষাগত যোগ্যতা</Label>
              <Select value={form.education} onValueChange={(v) => set("education", v)}>
                <SelectTrigger aria-label="শিক্ষাগত যোগ্যতা"><SelectValue placeholder="নির্বাচন করুন (ঐচ্ছিক)" /></SelectTrigger>
                <SelectContent>
                  {MATCH_EDUCATION_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="profession">পেশা</Label>
              <Input
                id="profession"
                value={form.profession}
                onChange={(e) => set("profession", e.target.value)}
                placeholder="ঐচ্ছিক"
              />
            </div>

            <div>
              <Label htmlFor="height_cm">উচ্চতা (সেমি)</Label>
              <Input
                id="height_cm"
                inputMode="numeric"
                value={form.height_cm}
                onChange={(e) => set("height_cm", e.target.value)}
                placeholder="ঐচ্ছিক, যেমন ১৬৫"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="photo_url">ছবির লিংক</Label>
              <Input
                id="photo_url"
                value={form.photo_url}
                onChange={(e) => set("photo_url", e.target.value)}
                placeholder="ঐচ্ছিক — https://…"
              />
              {err("photo_url")}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="family_info">পারিবারিক তথ্য</Label>
              <Textarea
                id="family_info"
                rows={3}
                value={form.family_info}
                onChange={(e) => set("family_info", e.target.value)}
                placeholder="পরিবারের সংক্ষিপ্ত পরিচয়"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="expectations">প্রত্যাশা / পছন্দ</Label>
              <Textarea
                id="expectations"
                rows={3}
                value={form.expectations}
                onChange={(e) => set("expectations", e.target.value)}
                placeholder="কেমন পাত্র/পাত্রী চাচ্ছেন"
              />
            </div>

            <div className="sm:col-span-2 rounded-lg border border-border/60 bg-muted/40 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> গোপন যোগাযোগ তথ্য
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                এই তথ্য কখনো প্রকাশ্যে দেখানো হয় না।
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact_name">অভিভাবক / যোগাযোগকারীর নাম</Label>
                  <Input
                    id="contact_name"
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    placeholder="ঐচ্ছিক"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">যোগাযোগ ফোন নম্বর</Label>
                  <Input
                    id="contact_phone"
                    value={form.contact_phone}
                    onChange={(e) => set("contact_phone", e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                  {err("contact_phone")}
                </div>
              </div>
            </div>

            <p className="sm:col-span-2 text-xs text-muted-foreground">{MATCH_DISCLAIMER}</p>

            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                রিকোয়েস্ট জমা দিন
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
