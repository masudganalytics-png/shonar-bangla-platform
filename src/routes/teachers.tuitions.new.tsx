import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UPAZILAS, DISTRICTS } from "@/lib/teachers-shared";
import { STUDENT_CLASSES, TUITION_MODES, TUTOR_GENDERS } from "@/lib/education-shared";
import { submitTuitionRequest } from "@/lib/education.functions";

export const Route = createFileRoute("/teachers/tuitions/new")({
  head: () => ({ meta: [
    { title: "টিউশন খুঁজছি (অভিভাবক ফর্ম) — উখিয়ার শিক্ষক খুঁজুন" },
    { name: "description", content: "সন্তানের জন্য উপযুক্ত টিউটর খুঁজতে অনুরোধ জমা দিন। অ্যাডমিন যাচাই করে প্রকাশ করবে।" },
    { name: "robots", content: "noindex" },
  ] }),
  component: NewTuition,
});

const schema = z.object({
  parent_name: z.string().trim().min(2, "নাম আবশ্যক").max(80),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন"),
  district: z.string().min(1),
  upazila: z.string().min(1),
  area: z.string().max(120).optional(),
  student_class: z.string().min(1, "শ্রেণি নির্বাচন করুন"),
  subject: z.string().trim().min(1, "বিষয় দিন").max(200),
  preferred_gender: z.enum(["male", "female", "any"]),
  budget: z.number().min(0).optional(),
  days_per_week: z.number().int().min(1).max(7).optional(),
  preferred_time: z.string().max(80).optional(),
  mode: z.enum(["online", "offline", "both"]),
  notes: z.string().max(1000).optional(),
});

function NewTuition() {
  const navigate = useNavigate();
  const submitFn = useServerFn(submitTuitionRequest);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    parent_name: "", phone: "", district: DISTRICTS[0] as string, upazila: "Ukhiya",
    area: "", student_class: "", subject: "", preferred_gender: "any" as "male"|"female"|"any",
    budget: "", days_per_week: "", preferred_time: "", mode: "offline" as "online"|"offline"|"both", notes: "",
  });
  const up = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      budget: form.budget === "" ? undefined : Number(form.budget),
      days_per_week: form.days_per_week === "" ? undefined : Number(form.days_per_week),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "ফর্ম যাচাই করুন"); return; }
    setBusy(true);
    try {
      await submitFn({ data: {
        ...parsed.data,
        area: parsed.data.area || null,
        preferred_time: parsed.data.preferred_time || null,
        notes: parsed.data.notes || null,
        budget: parsed.data.budget ?? null,
        days_per_week: parsed.data.days_per_week ?? null,
      } });
      setDone(true);
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-secondary" />
        <h1 className="mt-4 text-2xl font-bold">আবেদন জমা হয়েছে</h1>
        <p className="mt-2 text-sm text-muted-foreground">আপনার আবেদন Admin Review-এর জন্য জমা হয়েছে। অনুমোদনের পর এটি সংশ্লিষ্ট শিক্ষকদের কাছে দৃশ্যমান হবে।</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/teachers/tuitions">টিউশন তালিকা</Link></Button>
          <Button onClick={() => navigate({ to: "/teachers" })}>শিক্ষক দেখুন</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link to="/teachers/tuitions" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> টিউশন তালিকা
      </Link>
      <h1 className="text-2xl font-bold sm:text-3xl">📝 অভিভাবক টিউশন রিকোয়েস্ট</h1>
      <p className="mt-1 text-sm text-muted-foreground">সন্তানের জন্য উপযুক্ত টিউটর খুঁজতে ফর্মটি পূরণ করুন। আপনার ফোন নম্বর কখনো পাবলিকভাবে দেখানো হবে না।</p>

      <Card className="mt-5">
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>আপনার নাম *</Label>
              <Input value={form.parent_name} onChange={(e) => up("parent_name", e.target.value)} required />
            </div>
            <div>
              <Label>ফোন নম্বর * (গোপন থাকবে)</Label>
              <Input value={form.phone} onChange={(e) => up("phone", e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" required />
            </div>
            <div>
              <Label>জেলা</Label>
              <Select value={form.district} onValueChange={(v) => up("district", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>উপজেলা</Label>
              <Select value={form.upazila} onValueChange={(v) => up("upazila", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UPAZILAS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>এলাকা / ইউনিয়ন</Label>
              <Input value={form.area} onChange={(e) => up("area", e.target.value)} placeholder="যেমন: কুতুপালং" />
            </div>
            <div>
              <Label>শ্রেণি *</Label>
              <Select value={form.student_class} onValueChange={(v) => up("student_class", v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{STUDENT_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>বিষয় *</Label>
              <Input value={form.subject} onChange={(e) => up("subject", e.target.value)} placeholder="গণিত, বিজ্ঞান…" required />
            </div>
            <div>
              <Label>পছন্দের শিক্ষকের লিঙ্গ</Label>
              <Select value={form.preferred_gender} onValueChange={(v) => up("preferred_gender", v as "male"|"female"|"any")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TUTOR_GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>বাজেট (মাসে ৳)</Label>
              <Input type="number" min={0} value={form.budget} onChange={(e) => up("budget", e.target.value)} placeholder="যেমন: 3000" />
            </div>
            <div>
              <Label>সপ্তাহে দিন</Label>
              <Input type="number" min={1} max={7} value={form.days_per_week} onChange={(e) => up("days_per_week", e.target.value)} placeholder="3" />
            </div>
            <div>
              <Label>পছন্দের সময়</Label>
              <Input value={form.preferred_time} onChange={(e) => up("preferred_time", e.target.value)} placeholder="যেমন: বিকাল ৪-৬টা" />
            </div>
            <div className="sm:col-span-2">
              <Label>ধরন</Label>
              <Select value={form.mode} onValueChange={(v) => up("mode", v as "online"|"offline"|"both")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TUITION_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>অতিরিক্ত নোট</Label>
              <Textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={3} placeholder="বিশেষ প্রয়োজনীয়তা…" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="h-12 w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} রিকোয়েস্ট জমা দিন
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">অ্যাডমিন যাচাই করে অনুমোদন করলে আপনার রিকোয়েস্ট শিক্ষকদের কাছে দৃশ্যমান হবে।</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
