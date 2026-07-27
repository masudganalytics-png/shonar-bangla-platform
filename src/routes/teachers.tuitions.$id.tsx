import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, MapPin, Clock, Wallet, Users, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STUDENT_CLASSES, TUITION_MODES, TUTOR_GENDERS, TUITION_STATUS_LABEL, type TuitionRequestPublic } from "@/lib/education-shared";
import { EducationSubNav } from "@/components/teachers/EducationSubNav";
import { toBanglaDigits } from "@/lib/bangla";
import { applyToTuition } from "@/lib/education.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/teachers/tuitions/$id")({
  component: TuitionDetail,
});

function TuitionDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const applyFn = useServerFn(applyToTuition);

  const q = useQuery({
    queryKey: ["tuition", id],
    queryFn: async (): Promise<TuitionRequestPublic | null> => {
      const { data, error } = await supabase.from("public_tuition_requests").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as TuitionRequestPublic | null;
    },
  });

  const applyMut = useMutation({
    mutationFn: async () => applyFn({ data: { request_id: id, message: message || undefined } }),
    onSuccess: () => { toast.success("আবেদন জমা হয়েছে"); setMessage(""); qc.invalidateQueries({ queryKey: ["tuition", id] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl px-4 py-8"><Skeleton className="h-64 w-full" /></div>;
  if (!q.data) return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-bold">টিউশনটি পাওয়া যায়নি</h1>
      <Button asChild variant="outline" className="mt-4"><Link to="/teachers/tuitions">তালিকায় ফিরে যান</Link></Button>
    </div>
  );

  const r = q.data;
  const gender = TUTOR_GENDERS.find((g) => g.value === r.preferred_gender)?.label ?? "যেকোনো";
  const modeLabel = TUITION_MODES.find((m) => m.value === r.mode)?.label ?? r.mode;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <EducationSubNav />
      <Link to="/teachers/tuitions" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> টিউশন তালিকা
      </Link>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-primary">{r.subject}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{r.student_class}</p>
            </div>
            <Badge variant="outline">{TUITION_STATUS_LABEL[r.status] ?? r.status}</Badge>
          </div>

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <Detail icon={MapPin} label="এলাকা" value={[r.area, r.upazila, r.district].filter(Boolean).join(", ")} />
            <Detail icon={Users} label="পছন্দের লিঙ্গ" value={gender} />
            <Detail icon={Wallet} label="বাজেট" value={r.budget != null ? `৳ ${toBanglaDigits(r.budget)}` : "আলোচনা সাপেক্ষে"} />
            <Detail icon={Clock} label="সময়" value={r.preferred_time || "—"} />
            <Detail icon={Users} label="ধরন" value={modeLabel} />
            <Detail icon={Clock} label="সপ্তাহে দিন" value={r.days_per_week ? toBanglaDigits(r.days_per_week) : "—"} />
          </div>

          {r.notes && (
            <div className="mt-5 rounded-lg bg-muted/30 p-4 text-sm">
              <p className="mb-1 font-medium">নোট</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{r.notes}</p>
            </div>
          )}

          <div className="mt-6 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium">🔒 গোপনীয়তা</p>
            <p className="mt-1 text-xs text-muted-foreground">অভিভাবকের ফোন নম্বর গোপন রাখা হয়েছে। শিক্ষক অনুমোদিত হলে ও অভিভাবক নির্বাচন করলে অ্যাডমিন যোগাযোগের ব্যবস্থা করবেন।</p>
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="mb-2 font-semibold">এই টিউশনের জন্য আবেদন করুন</p>
            {!user ? (
              <p className="text-sm text-muted-foreground">আবেদনের জন্য <Link to="/auth" className="text-primary underline">লগইন</Link> করুন। শুধুমাত্র অনুমোদিত শিক্ষকরা আবেদন করতে পারবেন।</p>
            ) : (
              <>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="আপনার অভিজ্ঞতা ও উপযুক্ততা সংক্ষেপে লিখুন…" />
                <Button className="mt-3 h-11" disabled={applyMut.isPending} onClick={() => applyMut.mutate()}>
                  {applyMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  এই টিউশনের জন্য আবেদন করুন
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-muted/20 p-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}
