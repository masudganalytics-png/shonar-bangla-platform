import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2, Upload } from "lucide-react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UPAZILAS, DISTRICTS, type CategoryRow } from "@/lib/teachers-shared";
import { TUTOR_GENDERS, STUDENT_CLASSES } from "@/lib/education-shared";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/teachers/register")({
  head: () => ({
    meta: [
      { title: "শিক্ষক নিবন্ধন — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "আপনার দক্ষতা ও যোগ্যতা প্রকাশ করে বিনামূল্যে শিক্ষক ডিরেক্টরিতে নিবন্ধন করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherRegister,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "নাম আবশ্যক").max(80),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন"),
  whatsapp: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক WhatsApp নম্বর দিন").optional().or(z.literal("")),
  email: z.string().trim().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  category_id: z.string().uuid("বিষয় নির্বাচন করুন"),
  subjects: z.string().trim().max(500).optional().or(z.literal("")),
  qualification: z.string().trim().max(500).optional().or(z.literal("")),
  experience_years: z.number().int().min(0).max(70).optional(),
  district: z.string(),
  upazila: z.string(),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  gender: z.enum(["male", "female", "any"]).optional(),
  student_class: z.string().trim().max(200).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
});

function TeacherRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", whatsapp: "", email: "", category_id: "",
    subjects: "", qualification: "", experience_years: "", district: DISTRICTS[0] as string,
    upazila: "Ukhiya" as string, area: "", description: "",
    gender: "any" as "male"|"female"|"any", student_class: "", bio: "",
  });

  const catsQ = useQuery({
    queryKey: ["teacher-categories"],
    queryFn: async (): Promise<CategoryRow[]> => {
      const { data, error } = await supabase.from("teacher_categories").select("*").order("sort_order").order("name_bn");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      experience_years: form.experience_years === "" ? undefined : Number(form.experience_years),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ফর্ম যাচাই করুন");
      return;
    }
    setSubmitting(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        if (!user?.id) {
          toast.error("ছবি আপলোড করতে লগইন করুন");
          setSubmitting(false);
          return;
        }
        const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `submissions/${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("teacher-images").upload(path, photoFile, {
          contentType: photoFile.type, upsert: false,
        });
        if (upErr) throw upErr;
        photo_url = `teacher-images/${path}`;
      }

      const { error } = await supabase.from("teachers").insert({
        submitted_by: user?.id ?? null,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp || null,
        email: parsed.data.email || null,
        category_id: parsed.data.category_id,
        subjects: parsed.data.subjects || null,
        qualification: parsed.data.qualification || null,
        experience_years: parsed.data.experience_years ?? 0,
        district: parsed.data.district,
        upazila: parsed.data.upazila,
        area: parsed.data.area || null,
        description: parsed.data.description || null,
        gender: parsed.data.gender ?? null,
        student_class: parsed.data.student_class || null,
        bio: parsed.data.bio || null,
        photo_url,
        status: "pending",
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-secondary" />
        <h1 className="mt-4 text-2xl font-bold">নিবন্ধন সফল হয়েছে</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          আপনার প্রোফাইলটি প্রশাসকের অনুমোদনের জন্য অপেক্ষমাণ। অনুমোদনের পর এটি পাবলিক ডিরেক্টরিতে দেখা যাবে।
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/teachers">ডিরেক্টরিতে ফিরে যান</Link></Button>
          <Button onClick={() => { setDone(false); setForm({ ...form, full_name: "", phone: "", whatsapp: "", email: "", subjects: "", qualification: "", area: "", description: "" }); }}>আরও নিবন্ধন</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link to="/teachers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> ডিরেক্টরি
      </Link>
      <h1 className="text-2xl font-bold sm:text-3xl">🎓 শিক্ষক নিবন্ধন</h1>
      <p className="mt-1 text-sm text-muted-foreground">সম্পূর্ণ বিনামূল্যে। প্রশাসক অনুমোদনের পর আপনার প্রোফাইল পাবলিক হবে।</p>

      <Card className="mt-5">
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>পূর্ণ নাম *</Label>
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="নাম" required />
            </div>
            <div>
              <Label>ফোন নম্বর *</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="01XXXXXXXXX" required inputMode="tel" />
            </div>
            <div>
              <Label>WhatsApp নম্বর</Label>
              <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="ফোন নম্বরের মত হলে খালি রাখুন" inputMode="tel" />
            </div>
            <div>
              <Label>ইমেইল</Label>
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" type="email" />
            </div>
            <div>
              <Label>বিষয় *</Label>
              <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {(catsQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label>পড়ানো বিষয় / কোর্স</Label>
              <Textarea value={form.subjects} onChange={(e) => update("subjects", e.target.value)} placeholder="যেমন: বাংলা, ইংরেজি, গণিত — ক্লাস ৬-১০" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Label>যোগ্যতা</Label>
              <Textarea value={form.qualification} onChange={(e) => update("qualification", e.target.value)} placeholder="যেমন: অনার্স, বিএড, চাকরিরত" rows={2} />
            </div>

            <div>
              <Label>অভিজ্ঞতা (বছর)</Label>
              <Input type="number" min={0} max={70} value={form.experience_years} onChange={(e) => update("experience_years", e.target.value)} />
            </div>
            <div>
              <Label>জেলা</Label>
              <Select value={form.district} onValueChange={(v) => update("district", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>উপজেলা</Label>
              <Select value={form.upazila} onValueChange={(v) => update("upazila", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UPAZILAS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>এলাকা / ইউনিয়ন</Label>
              <Input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="যেমন: কুতুপালং" />
            </div>

            <div>
              <Label>লিঙ্গ</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v as "male"|"female"|"any")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TUTOR_GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>যে শ্রেণি পড়ান</Label>
              <Select value={form.student_class} onValueChange={(v) => update("student_class", v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{STUDENT_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label>সংক্ষিপ্ত বিবরণ</Label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="নিজের সম্পর্কে সংক্ষেপে লিখুন" rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Label>বায়ো / পরিচিতি</Label>
              <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="অভিজ্ঞতা, পড়ানোর ধরন…" rows={3} />
            </div>

            <div className="sm:col-span-2">
              <Label>প্রোফাইল ছবি</Label>
              <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-accent">
                <Upload className="h-4 w-4" />
                {photoFile ? photoFile.name : "ছবি নির্বাচন করুন"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="h-12 w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                নিবন্ধন জমা দিন
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                জমা দেওয়ার পর প্রশাসক অনুমোদন করলে প্রোফাইল পাবলিক হবে।
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
