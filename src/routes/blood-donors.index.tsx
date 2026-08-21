import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Droplet, Heart, MapPin, Phone, MessageCircle, UserPlus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BLOOD_DONOR_PUBLIC_COLUMNS, CONTACT_LOGIN_HINT, columnsFor } from "@/lib/public-columns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BLOOD_GROUPS,
  UKHIYA_UNIONS,
  formatBanglaDate,
  normalizePhone,
  type DonorRow,
} from "@/lib/blood-shared";

export const Route = createFileRoute("/blood-donors/")({
  head: () => ({
    meta: [
      { title: "রক্তদাতা ডিরেক্টরি — উখিয়া সেবা" },
      {
        name: "description",
        content:
          "উখিয়ার যাচাইকৃত রক্তদাতাদের তালিকা। রক্তের গ্রুপ, ইউনিয়ন ও অ্যাভেইলেবিলিটি অনুযায়ী খুঁজুন — ফোন বা WhatsApp-এ সরাসরি যোগাযোগ করুন।",
      },
      { property: "og:title", content: "রক্তদাতা ডিরেক্টরি — উখিয়া সেবা" },
      {
        property: "og:description",
        content: "উখিয়ার যাচাইকৃত রক্তদাতাদের তালিকা। কয়েক মিনিটেই কাছের দাতা খুঁজুন।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DonorDirectory,
});

function DonorDirectory() {
  const [group, setGroup] = useState<string>("all");
  const [unionName, setUnionName] = useState<string>("all");
  const [availOnly, setAvailOnly] = useState(false);
  const [q, setQ] = useState("");

  const { isAuthenticated, loading: authLoading } = useAuth();

  const donorsQ = useQuery({
    queryKey: ["blood-donors-public", group, unionName, availOnly, isAuthenticated],
    enabled: !authLoading,
    queryFn: async () => {
      let query = supabase
        .from("blood_donors")
        .select(columnsFor(BLOOD_DONOR_PUBLIC_COLUMNS, isAuthenticated))
        .eq("status", "approved")
        .eq("is_active", true)
        .order("available", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(300);
      if (group !== "all") query = query.eq("blood_group", group as never);
      if (unionName !== "all") query = query.eq("union_name", unionName);
      if (availOnly) query = query.eq("available", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as DonorRow[];
    },
  });

  const list = useMemo(() => {
    const rows = donorsQ.data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(needle) ||
        (r.village ?? "").toLowerCase().includes(needle) ||
        (r.union_name ?? "").toLowerCase().includes(needle),
    );
  }, [donorsQ.data, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Droplet className="h-6 w-6 fill-red-600 text-red-600" /> রক্তদাতা ডিরেক্টরি
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            উখিয়ার যাচাইকৃত রক্তদাতাদের সাথে সরাসরি যোগাযোগ করুন।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/request-blood">
              <Heart className="mr-1 h-4 w-4" /> রক্তের অনুরোধ করুন
            </Link>
          </Button>
          <Button asChild className="bg-red-600 hover:bg-red-700">
            <Link to="/blood-donors/register">
              <UserPlus className="mr-1 h-4 w-4" /> দাতা হিসেবে নিবন্ধন করুন
            </Link>
          </Button>
        </div>
      </header>

      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="নাম, গ্রাম বা ইউনিয়ন খুঁজুন…"
              className="pl-9"
            />
          </div>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger>
              <SelectValue placeholder="রক্তের গ্রুপ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব গ্রুপ</SelectItem>
              {BLOOD_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={unionName} onValueChange={setUnionName}>
            <SelectTrigger>
              <SelectValue placeholder="ইউনিয়ন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ইউনিয়ন</SelectItem>
              {UKHIYA_UNIONS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="col-span-full flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-red-600"
              checked={availOnly}
              onChange={(e) => setAvailOnly(e.target.checked)}
            />
            শুধু আজ প্রস্তুত দাতা দেখান
          </label>
        </CardContent>
      </Card>

      {donorsQ.isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">লোড হচ্ছে…</p>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          কোনো দাতা পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <DonorCard key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DonorCard({ d }: { d: DonorRow }) {
  const phone = d.phone ? normalizePhone(d.phone) : null;
  const wa = normalizePhone(d.whatsapp || d.phone || "");
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex gap-3 p-4">
        <div className="flex-shrink-0">
          {d.photo_url ? (
            <img
              src={d.photo_url}
              alt={d.full_name}
              loading="lazy"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-red-100 dark:ring-red-900/40"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40">
              <Droplet className="h-7 w-7 fill-red-600" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold">{d.full_name}</h3>
            <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              {d.blood_group}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[d.village, d.union_name].filter(Boolean).join(", ") || "উখিয়া"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {d.available ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">প্রস্তুত</Badge>
            ) : (
              <Badge variant="secondary">এই মুহূর্তে নয়</Badge>
            )}
            {d.last_donation_date && (
              <span className="text-[11px] text-muted-foreground">
                শেষ দান: {formatBanglaDate(d.last_donation_date)}
              </span>
            )}
          </div>
          {phone ? (
            <div className="mt-2 flex gap-2">
              <a
                href={`tel:${phone}`}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                <Phone className="h-3 w-3" /> কল
              </a>
              <a
                href={`https://wa.me/${wa.replace(/^\+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </a>
            </div>
          ) : (
            <Button asChild size="sm" variant="outline" className="mt-2 w-full text-xs">
              <Link to="/auth" search={{ redirect: "/blood-donors" }}>
                <Phone className="mr-1 h-3 w-3" /> {CONTACT_LOGIN_HINT}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
