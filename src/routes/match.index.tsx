import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HeartHandshake, Search, ShieldCheck, UserPlus, LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchCard } from "@/components/match/MatchCard";
import { useApprovedMatchRequests, useMyShortlist } from "@/components/match/use-match";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  MARITAL_LABEL,
  MATCH_AREAS,
  MATCH_BRAND,
  MATCH_DISCLAIMER,
  MATCH_TAGLINE,
  type MatchMaritalStatus,
} from "@/lib/match-shared";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/match/")({
  head: () => ({
    meta: [
      { title: "KHIJIRION Match — সঠিক মানুষের সন্ধানে | পাত্র-পাত্রী" },
      {
        name: "description",
        content:
          "উখিয়া, টেকনাফ ও কক্সবাজারের পরিবারভিত্তিক পাত্র-পাত্রী খোঁজার নিরাপদ মাধ্যম। যাচাইকৃত রিকোয়েস্ট, গোপন যোগাযোগ নম্বর।",
      },
      { property: "og:title", content: "KHIJIRION Match — সঠিক মানুষের সন্ধানে" },
      {
        property: "og:description",
        content: "পরিবারভিত্তিক পাত্র-পাত্রী খোঁজার নিরাপদ ও যাচাইকৃত মাধ্যম।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchIndex,
});

function MatchIndex() {
  const { data, isLoading, error } = useApprovedMatchRequests();
  const { user, isAuthenticated } = useAuth();
  const { data: shortlist } = useMyShortlist(user?.id);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [lookingFor, setLookingFor] = useState("all");
  const [area, setArea] = useState("all");
  const [marital, setMarital] = useState("all");

  const list = useMemo(() => data ?? [], [data]);
  const shortIds = useMemo(() => new Set(shortlist ?? []), [shortlist]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((m) => {
      if (lookingFor !== "all" && m.looking_for !== lookingFor) return false;
      if (area !== "all" && m.area !== area) return false;
      if (marital !== "all" && m.marital_status !== marital) return false;
      if (!needle) return true;
      return [m.display_name, m.area, m.education, m.profession, m.expectations]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [list, q, lookingFor, area, marital]);

  const toggleShortlist = async (id: string) => {
    if (!isAuthenticated || !user) {
      toast.error("শর্টলিস্ট করতে লগইন করুন");
      return;
    }
    if (shortIds.has(id)) {
      const { error: e } = await supabase
        .from("match_shortlists")
        .delete()
        .eq("user_id", user.id)
        .eq("request_id", id);
      if (e) return toast.error(e.message);
      toast.success("শর্টলিস্ট থেকে সরানো হয়েছে");
    } else {
      const { error: e } = await supabase
        .from("match_shortlists")
        .insert({ user_id: user.id, request_id: id });
      if (e) return toast.error(e.message);
      toast.success("শর্টলিস্টে যোগ হয়েছে");
    }
    qc.invalidateQueries({ queryKey: ["match", "shortlist"] });
  };

  return (
    <div className="min-h-screen">
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 -z-10 opacity-95"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-12 text-white sm:px-6 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <HeartHandshake className="h-3.5 w-3.5" /> KHIJIRION · নতুন সেবা
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{MATCH_BRAND}</h1>
          <p className="mt-2 text-lg text-white/90">{MATCH_TAGLINE}</p>
          <p className="mt-3 max-w-2xl text-sm text-white/80">
            পরিবারভিত্তিক পাত্র-পাত্রী খোঁজার নিরাপদ মাধ্যম। প্রতিটি রিকোয়েস্ট প্রশাসকের যাচাইয়ের
            পর প্রকাশিত হয় এবং যোগাযোগের নম্বর সম্পূর্ণ গোপন থাকে।
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 bg-white px-6 text-primary hover:bg-white/90">
              <Link to="/match/new">
                <UserPlus className="mr-2 h-4 w-4" /> নতুন ম্যাচ রিকোয়েস্ট
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/40 bg-white/10 px-6 text-white hover:bg-white/20"
            >
              <Link to="/my-match">
                <LayoutDashboard className="mr-2 h-4 w-4" /> আমার ম্যাচ ড্যাশবোর্ড
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Card className="border-border/60 bg-card/70 p-4 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="নাম, এলাকা, পেশা খুঁজুন…"
                className="pl-9"
                aria-label="ম্যাচ খুঁজুন"
              />
            </div>
            <Select value={lookingFor} onValueChange={setLookingFor}>
              <SelectTrigger aria-label="পাত্র / পাত্রী">
                <SelectValue placeholder="পাত্র / পাত্রী" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সবাই</SelectItem>
                <SelectItem value="groom">পাত্র খুঁজছেন</SelectItem>
                <SelectItem value="bride">পাত্রী খুঁজছেন</SelectItem>
              </SelectContent>
            </Select>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger aria-label="এলাকা">
                <SelectValue placeholder="এলাকা" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব এলাকা</SelectItem>
                {MATCH_AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={marital} onValueChange={setMarital}>
              <SelectTrigger aria-label="বৈবাহিক অবস্থা">
                <SelectValue placeholder="বৈবাহিক অবস্থা" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব অবস্থা</SelectItem>
                {(Object.keys(MARITAL_LABEL) as MatchMaritalStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {MARITAL_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <p className="text-sm text-muted-foreground">
          মোট {toBanglaDigits(filtered.length)} টি প্রকাশিত রিকোয়েস্ট
        </p>

        {isLoading ? (
          <p className="py-12 text-center text-muted-foreground">লোড হচ্ছে…</p>
        ) : error ? (
          <p className="py-12 text-center text-destructive">তথ্য আনা যায়নি। আবার চেষ্টা করুন।</p>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            কোনো রিকোয়েস্ট পাওয়া যায়নি।
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <MatchCard
                key={item.id}
                item={item}
                shortlisted={shortIds.has(item.id)}
                onToggleShortlist={toggleShortlist}
              />
            ))}
          </div>
        )}

        <Card className="flex items-start gap-3 border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>{MATCH_DISCLAIMER}</p>
        </Card>
      </div>
    </div>
  );
}
