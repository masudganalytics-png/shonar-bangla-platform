import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wifi, Phone, BadgeCheck, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ISP_AREAS } from "@/lib/isp-shared";

export const Route = createFileRoute("/isp")({
  head: () => ({
    meta: [
      { title: "এরিয়াভিত্তিক ওয়াইফাই সেবা — উখিয়া বিদ্যুৎ বিল" },
      {
        name: "description",
        content:
          "কক্সবাজার, কোর্টবাজার, উখিয়া ও কুতুপালং এলাকার ISP তালিকা ও যোগাযোগ নম্বর।",
      },
      { property: "og:title", content: "এরিয়াভিত্তিক ওয়াইফাই সেবা" },
      {
        property: "og:description",
        content: "আপনার এলাকার ইন্টারনেট সেবা প্রদানকারীদের তালিকা।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IspPage,
});

type Isp = {
  id: string;
  name: string;
  phones: string[];
  note: string;
  approved?: boolean;
};

const AREAS = ISP_AREAS;

function IspPage() {
  const [area, setArea] = useState<string>("");

  const { data: rows } = useQuery({
    queryKey: ["public", "isps"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("isps")
        .select("id, name, note, phones, is_btrc_approved, sort_order, isp_areas(area_key)")
        .eq("is_active", true)
        .order("sort_order")
        .order("name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const isps: Isp[] = useMemo(() => {
    if (!area || !rows) return [];
    return rows
      .filter((r) => (r.isp_areas ?? []).some((a: { area_key: string }) => a.area_key === area))
      .map((r) => ({
        id: r.id,
        name: r.name,
        phones: r.phones ?? [],
        note: r.note ?? "",
        approved: r.is_btrc_approved ?? false,
      }));
  }, [area, rows]);

  const areaLabel = AREAS.find((a) => a.value === area)?.label;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)]">
          <Wifi className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">এরিয়াভিত্তিক ওয়াইফাই সেবা</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          আপনার এলাকা নির্বাচন করলে সেই এলাকার ISP তালিকা ও যোগাযোগ নম্বর দেখতে পাবেন।
        </p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <label className="mb-2 block text-sm font-medium">এলাকা নির্বাচন করুন</label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="একটি এলাকা বাছাই করুন" />
            </SelectTrigger>
            <SelectContent>
              {AREAS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {area && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{areaLabel} এলাকার ISP</span>
            <Badge variant="secondary" className="ml-1">{isps.length}টি</Badge>
          </div>

          {isps.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                এই এলাকার জন্য কোনো ISP তথ্য পাওয়া যায়নি।
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {isps.map((isp) => (
                <Card key={isp.name} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Wifi className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">{isp.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">{isp.note}</p>
                        </div>
                      </div>
                      {isp.approved && (
                        <Badge className="gap-1">
                          <BadgeCheck className="h-3.5 w-3.5" /> BTRC
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {isp.phones.map((p) => (
                        <a
                          key={p}
                          href={`tel:${p.replace(/[^\d+]/g, "")}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        >
                          <Phone className="h-4 w-4 text-primary" />
                          {p}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        তথ্য শুধু রেফারেন্সের জন্য। সংশোধন বা নতুন ISP যোগ করতে আমাদের সাথে যোগাযোগ করুন।
      </p>
    </div>
  );
}
