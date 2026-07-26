import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, MapPin, Phone, MessageCircle, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { WorkerRow, CategoryRow } from "@/lib/workers-shared";
import { WorkerPhoto } from "@/components/workers/WorkerPhoto";

export const Route = createFileRoute("/workers/$id")({
  head: () => ({
    meta: [
      { title: "কাজের লোকের প্রোফাইল — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "যাচাইকৃত কাজের লোকের বিস্তারিত প্রোফাইল ও যোগাযোগের তথ্য।" },
      { property: "og:title", content: "কাজের লোকের প্রোফাইল" },
      { property: "og:description", content: "যাচাইকৃত কাজের লোকের প্রোফাইল।" },
    ],
  }),
  component: WorkerDetails,
});

function WorkerDetails() {
  const { id } = Route.useParams();

  const q = useQuery({
    queryKey: ["worker", id],
    queryFn: async () => {
      const [wRes, cRes] = await Promise.all([
        supabase.from("workers").select("*").eq("id", id).eq("status", "approved").maybeSingle(),
        supabase.from("worker_categories").select("*"),
      ]);
      if (wRes.error) throw wRes.error;
      return { worker: wRes.data as WorkerRow | null, categories: (cRes.data ?? []) as CategoryRow[] };
    },
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!q.data?.worker) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">প্রোফাইল পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">এই প্রোফাইলটি হয়তো এখনো অনুমোদিত হয়নি বা মুছে ফেলা হয়েছে।</p>
        <Button asChild className="mt-4" variant="outline"><Link to="/workers"><ArrowLeft className="mr-2 h-4 w-4" /> ফিরে যান</Link></Button>
      </div>
    );
  }
  const w = q.data.worker;
  const cat = q.data.categories.find((c) => c.id === w.category_id);
  const waNumber = (w.whatsapp || w.phone).replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link to="/workers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> সব কাজের লোক
      </Link>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <WorkerPhoto path={w.photo_url} alt={w.full_name} className="h-28 w-28 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{w.full_name}</h1>
                {w.is_verified && <Badge className="gap-1 bg-primary text-primary-foreground"><BadgeCheck className="h-3.5 w-3.5" /> যাচাইকৃত</Badge>}
                {w.is_available ? (
                  <Badge className="bg-secondary text-secondary-foreground">উপলব্ধ</Badge>
                ) : (
                  <Badge variant="outline">ব্যস্ত</Badge>
                )}
              </div>
              {cat && <p className="mt-1 text-primary">{cat.name_bn}</p>}
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {[w.area, w.upazila, w.district].filter(Boolean).join(", ")}
              </p>
              {typeof w.experience_years === "number" && w.experience_years > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" /> অভিজ্ঞতা: {w.experience_years} বছর
                </p>
              )}
            </div>
          </div>

          {w.skills && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold">দক্ষতা</h2>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{w.skills}</p>
            </div>
          )}
          {w.description && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold">সংক্ষিপ্ত বিবরণ</h2>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{w.description}</p>
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button asChild size="lg" className="h-12">
              <a href={`tel:${w.phone}`}><Phone className="mr-2 h-4 w-4" /> কল করুন — {w.phone}</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        এই প্ল্যাটফর্ম শুধুমাত্র একটি ডিরেক্টরি। কোনো লেনদেন সম্পর্কে আমরা দায়ী নই। কাজের আগে যাচাই করে নিন।
      </p>
    </div>
  );
}
