import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Car, Loader2, PauseCircle, RotateCcw, Search, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listUkhiyaGoDrivers, moderateUkhiyaGoDriver } from "@/lib/ukhiya-go-admin.functions";
import {
  UKHIYA_GO_STATUS_META,
  ukhiyaGoVehicleLabel,
  type UkhiyaGoVerificationStatus,
} from "@/lib/ukhiya-go-shared";
import { formatBanglaDate, toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/ukhiya-go/drivers")({
  head: () => ({
    meta: [
      { title: "উখিয়া গো চালক ব্যবস্থাপনা — অ্যাডমিন | KHIJIRION" },
      { name: "description", content: "উখিয়া গো চালক প্রোফাইল যাচাই, অনুমোদন ও স্থগিত ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUkhiyaGoDrivers,
});

const STATUS_TABS: { value: "all" | UkhiyaGoVerificationStatus; label: string }[] = [
  { value: "pending", label: "অপেক্ষমাণ" },
  { value: "approved", label: "অনুমোদিত" },
  { value: "rejected", label: "প্রত্যাখ্যাত" },
  { value: "suspended", label: "স্থগিত" },
  { value: "all", label: "সব" },
];

function statusBadge(s: UkhiyaGoVerificationStatus) {
  const label = UKHIYA_GO_STATUS_META[s].label;
  if (s === "approved") return <Badge className="bg-primary text-primary-foreground">{label}</Badge>;
  if (s === "rejected" || s === "suspended") return <Badge variant="destructive">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}

function AdminUkhiyaGoDrivers() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listUkhiyaGoDrivers);
  const moderate = useServerFn(moderateUkhiyaGoDriver);

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | UkhiyaGoVerificationStatus>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "ukhiya-go", "drivers"],
    queryFn: () => fetchAll({}),
    staleTime: 30_000,
  });

  const mut = useMutation({
    mutationFn: (vars: {
      id: string;
      status: UkhiyaGoVerificationStatus;
      admin_note?: string | null;
    }) => moderate({ data: vars }),
    onSuccess: () => {
      toast.success("হালনাগাদ হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "ukhiya-go"] });
      qc.invalidateQueries({ queryKey: ["ukhiya-go"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((d) => {
      if (tab !== "all" && d.verification_status !== tab) return false;
      if (!needle) return true;
      return [d.name, d.phone, d.whatsapp, d.address, ...(d.service_areas ?? []), ...(d.services ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [data, q, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of data ?? []) c[d.verification_status] = (c[d.verification_status] ?? 0) + 1;
    return c;
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="নাম / ফোন / এলাকা খুঁজুন…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="স্ট্যাটাস" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_TABS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
                {t.value !== "all" && counts[t.value] ? ` (${toBanglaDigits(counts[t.value]!)})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : isError ? (
        <Card className="p-6 text-sm text-destructive">তালিকা লোড করা যায়নি।</Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">কোনো চালক পাওয়া যায়নি।</Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((d) => {
            const note = notes[d.id] ?? d.admin_note ?? "";
            const busy = mut.isPending;
            return (
              <Card key={d.id} className="p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{d.name}</h3>
                      {statusBadge(d.verification_status)}
                      <span className="text-xs text-muted-foreground">
                        নিবন্ধন: {formatBanglaDate(d.created_at)}
                      </span>
                    </div>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="inline text-muted-foreground">ফোন: </dt>
                        <dd className="inline">{toBanglaDigits(d.phone)}</dd>
                      </div>
                      {d.whatsapp && (
                        <div>
                          <dt className="inline text-muted-foreground">হোয়াটসঅ্যাপ: </dt>
                          <dd className="inline">{toBanglaDigits(d.whatsapp)}</dd>
                        </div>
                      )}
                      {d.address && (
                        <div>
                          <dt className="inline text-muted-foreground">ঠিকানা: </dt>
                          <dd className="inline">{d.address}</dd>
                        </div>
                      )}
                      {d.experience_years != null && (
                        <div>
                          <dt className="inline text-muted-foreground">অভিজ্ঞতা: </dt>
                          <dd className="inline">{toBanglaDigits(d.experience_years)} বছর</dd>
                        </div>
                      )}
                    </dl>

                    {(d.service_areas?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {d.service_areas.map((a) => (
                          <Badge key={a} variant="secondary" className="text-xs">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {d.bio && <p className="mt-2 text-sm text-muted-foreground">{d.bio}</p>}

                    <div className="mt-3 space-y-1">
                      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Car className="h-3.5 w-3.5" /> গাড়ি ({toBanglaDigits(d.vehicles.length)})
                      </p>
                      {d.vehicles.length === 0 ? (
                        <p className="text-xs text-muted-foreground">কোনো গাড়ি যোগ করা হয়নি।</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {d.vehicles.map((v) => (
                            <li key={v.id} className="flex flex-wrap items-center gap-2">
                              <span>{ukhiyaGoVehicleLabel(v)}</span>
                              {v.registration_number && (
                                <span className="text-xs text-muted-foreground">
                                  {toBanglaDigits(v.registration_number)}
                                </span>
                              )}
                              {v.seating_capacity != null && (
                                <span className="text-xs text-muted-foreground">
                                  {toBanglaDigits(v.seating_capacity)} সিট
                                </span>
                              )}
                              {statusBadge(v.verification_status as UkhiyaGoVerificationStatus)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="w-full space-y-2 sm:w-72">
                    <Textarea
                      rows={3}
                      placeholder="প্রশাসনিক নোট / প্রত্যাখ্যানের কারণ…"
                      value={note}
                      onChange={(e) => setNotes((p) => ({ ...p, [d.id]: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={busy || d.verification_status === "approved"}
                        onClick={() =>
                          mut.mutate({ id: d.id, status: "approved", admin_note: note.trim() || null })
                        }
                      >
                        {busy ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <BadgeCheck className="mr-1 h-3 w-3" />
                        )}
                        অনুমোদন
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={busy}>
                            <XCircle className="mr-1 h-3 w-3" /> প্রত্যাখ্যান
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>চালক প্রত্যাখ্যান করবেন?</AlertDialogTitle>
                            <AlertDialogDescription>
                              প্রত্যাখ্যানের কারণ নোট হিসেবে সংরক্ষিত হবে। চালক সংশোধন করে আবার জমা দিতে পারবেন।
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <Textarea
                            rows={3}
                            placeholder="প্রত্যাখ্যানের কারণ লিখুন…"
                            value={note}
                            onChange={(e) => setNotes((p) => ({ ...p, [d.id]: e.target.value }))}
                          />
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                mut.mutate({ id: d.id, status: "rejected", admin_note: note.trim() || null })
                              }
                            >
                              নিশ্চিত করুন
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={busy}>
                            <PauseCircle className="mr-1 h-3 w-3" /> স্থগিত
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>প্রোফাইল স্থগিত করবেন?</AlertDialogTitle>
                            <AlertDialogDescription>
                              স্থগিত চালক নতুন ট্রিপ প্রকাশ করতে পারবেন না।
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                mut.mutate({ id: d.id, status: "suspended", admin_note: note.trim() || null })
                              }
                            >
                              নিশ্চিত করুন
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy || d.verification_status === "pending"}
                        onClick={() =>
                          mut.mutate({ id: d.id, status: "pending", admin_note: note.trim() || null })
                        }
                      >
                        <RotateCcw className="mr-1 h-3 w-3" /> অপেক্ষমাণ
                      </Button>
                    </div>
                    {d.admin_note && (
                      <p className="text-xs text-muted-foreground">সর্বশেষ নোট: {d.admin_note}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
