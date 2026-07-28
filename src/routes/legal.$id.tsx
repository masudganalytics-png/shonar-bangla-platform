import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, MapPin, MessageCircle, Phone, Mail, Languages, Clock, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { AdvocatePhoto } from "@/components/legal/AdvocatePhoto";
import { PRACTICE_AREAS, practiceAreaLabel, buildWhatsAppUrl, type AdvocateRow } from "@/lib/legal-shared";

export const Route = createFileRoute("/legal/$id")({
  head: () => ({
    meta: [
      { title: "অ্যাডভোকেট প্রোফাইল — উখিয়া সেবা" },
      { name: "description", content: "যাচাইকৃত অ্যাডভোকেটের বিস্তারিত প্রোফাইল ও WhatsApp যোগাযোগ।" },
      { property: "og:title", content: "অ্যাডভোকেট প্রোফাইল — উখিয়া সেবা" },
      { property: "og:description", content: "যাচাইকৃত অ্যাডভোকেটের প্রোফাইল ও WhatsApp যোগাযোগ।" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdvocateProfile,
});

const leadSchema = z.object({
  full_name: z.string().trim().min(2, "নাম আবশ্যক").max(120),
  phone: z.string().trim().regex(/^\+?\d[\d\s-]{6,20}$/, "সঠিক মোবাইল নম্বর দিন"),
  category: z.string().trim().min(1, "আইনি বিষয় নির্বাচন করুন"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

function AdvocateProfile() {
  const { id } = Route.useParams();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", category: "", description: "" });

  const q = useQuery({
    queryKey: ["advocate", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("advocates").select("*").eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data as AdvocateRow | null;
    },
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!q.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">প্রোফাইল পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">এই প্রোফাইলটি বর্তমানে নিষ্ক্রিয় বা মুছে ফেলা হয়েছে।</p>
        <Button asChild className="mt-4" variant="outline"><Link to="/legal"><ArrowLeft className="mr-2 h-4 w-4" /> ফিরে যান</Link></Button>
      </div>
    );
  }

  const a = q.data;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ফর্ম যাচাই করুন");
      return;
    }
    setSubmitting(true);
    try {
      const cleanedPhone = parsed.data.phone.replace(/[\s-]/g, "");
      const { error } = await supabase.from("legal_leads").insert({
        advocate_id: a.id,
        full_name: parsed.data.full_name,
        phone: cleanedPhone,
        category: parsed.data.category,
        description: parsed.data.description || null,
      });
      if (error) throw error;
      const url = buildWhatsAppUrl(a.whatsapp, {
        name: parsed.data.full_name,
        phone: cleanedPhone,
        categoryLabel: practiceAreaLabel(parsed.data.category),
        description: parsed.data.description,
      });
      window.open(url, "_blank", "noopener,noreferrer");
      setOpen(false);
      toast.success("WhatsApp-এ অ্যাডভোকেটের সাথে সংযুক্ত করা হচ্ছে");
      setForm({ full_name: "", phone: "", category: "", description: "" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link to="/legal" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> সব অ্যাডভোকেট
      </Link>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <AdvocatePhoto path={a.photo_url} alt={a.full_name} className="h-28 w-28 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">অ্যাডভোকেট {a.full_name}</h1>
                {a.is_verified && <Badge className="gap-1 bg-primary text-primary-foreground"><BadgeCheck className="h-3.5 w-3.5" /> যাচাইকৃত</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(a.practice_areas ?? []).map((pa) => (
                  <Badge key={pa} variant="outline">{practiceAreaLabel(pa)}</Badge>
                ))}
              </div>
              {typeof a.experience_years === "number" && a.experience_years > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">অভিজ্ঞতা: {a.experience_years}+ বছর</p>
              )}
              {a.availability && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {a.availability}
                </p>
              )}
              {a.languages?.length > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Languages className="h-4 w-4" /> {a.languages.join(", ")}
                </p>
              )}
              {a.chamber_address && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> <span>{a.chamber_address}</span>
                </p>
              )}
            </div>
          </div>

          {a.bio && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold">পরিচিতি</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.bio}</p>
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button size="lg" className="h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => setOpen(true)}>
              <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp-এ চ্যাট করুন
            </Button>
            {a.phone && (
              <Button asChild size="lg" variant="outline" className="h-12">
                <a href={`tel:${a.phone}`}><Phone className="mr-2 h-4 w-4" /> কল করুন — {a.phone}</a>
              </Button>
            )}
            {a.email && (
              <Button asChild size="lg" variant="outline" className="h-12 sm:col-span-2">
                <a href={`mailto:${a.email}`}><Mail className="mr-2 h-4 w-4" /> ইমেইল — {a.email}</a>
              </Button>
            )}
          </div>

          <div className="mt-6 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">দাবিত্যাগ:</strong> এই প্ল্যাটফর্ম শুধুমাত্র ব্যবহারকারীদের স্বাধীন অ্যাডভোকেটের সাথে সংযুক্ত করে। এটি আইনি পরামর্শ প্রদান করে না বা কোনো আইনি ফলাফলের নিশ্চয়তা দেয় না।
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>WhatsApp-এ যোগাযোগের আগে</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <Label>পূর্ণ নাম *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="আপনার নাম" required />
            </div>
            <div>
              <Label>মোবাইল নম্বর *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" inputMode="tel" required />
            </div>
            <div>
              <Label>আইনি বিষয় *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {PRACTICE_AREAS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>সংক্ষিপ্ত বিবরণ</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="সমস্যা সংক্ষেপে লিখুন (ঐচ্ছিক)" />
            </div>
            <p className="text-xs text-muted-foreground">
              জমা দেওয়ার সাথে সাথে আপনি WhatsApp-এ অ্যাডভোকেটের কাছে পুনঃনির্দেশিত হবেন। আপনার তথ্য সংরক্ষণ করা হবে।
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>বাতিল</Button>
              <Button type="submit" disabled={submitting} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp খুলুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
