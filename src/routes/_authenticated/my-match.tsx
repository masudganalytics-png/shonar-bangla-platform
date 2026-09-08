import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, useServerFn } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  Pencil,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  CREATED_FOR_LABEL,
  INTEREST_STATUS_META,
  LOOKING_FOR_LABEL,
  MARITAL_LABEL,
  MATCH_BRAND,
  MATCH_PUBLIC_COLUMNS,
  MATCH_STATUS_META,
  type MatchInterest,
  type MatchRequest,
  type MatchRequestWithContact,
} from "@/lib/match-shared";
import {
  deleteMyMatchRequest,
  getMatchContact,
  listMyMatchRequests,
  listReceivedInterests,
  listSentInterests,
  respondToMatchInterest,
} from "@/lib/match.functions";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/my-match")({
  head: () => ({
    meta: [
      { title: "আমার ম্যাচ ড্যাশবোর্ড — KHIJIRION Match" },
      {
        name: "description",
        content: "আপনার ম্যাচ রিকোয়েস্ট, প্রাপ্ত ও পাঠানো আগ্রহ এবং শর্টলিস্ট এক জায়গায়।",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyMatchPage,
});

type ReceivedInterest = MatchInterest & { request_name: string };
type SentInterest = MatchInterest & { request: MatchRequest | null };

function MyMatchPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const myRequestsFn = useServerFn(listMyMatchRequests);
  const receivedFn = useServerFn(listReceivedInterests);
  const sentFn = useServerFn(listSentInterests);
  const contactFn = useServerFn(getMatchContact);
  const respondFn = useServerFn(respondToMatchInterest);
  const deleteFn = useServerFn(deleteMyMatchRequest);

  const requests = useQuery<MatchRequestWithContact[]>({
    queryKey: ["match", "mine", user?.id],
    queryFn: () => myRequestsFn(),
  });

  const received = useQuery<ReceivedInterest[]>({
    queryKey: ["match", "interests", "received", user?.id],
    queryFn: () => receivedFn(),
  });

  const sent = useQuery<SentInterest[]>({
    queryKey: ["match", "interests", "sent", user?.id],
    queryFn: () => sentFn(),
  });

  const shortlist = useQuery<MatchRequest[]>({
    queryKey: ["match", "shortlist-full", user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("match_shortlists")
        .select("request_id")
        .eq("user_id", user!.id);
      if (error) throw new Error(error.message);
      const ids = (rows ?? []).map((r) => r.request_id);
      if (ids.length === 0) return [];
      const { data, error: e2 } = await supabase
        .from("match_requests")
        .select(MATCH_PUBLIC_COLUMNS)
        .in("id", ids)
        .eq("status", "approved");
      if (e2) throw new Error(e2.message);
      return (data ?? []) as unknown as MatchRequest[];
    },
    enabled: !!user,
  });

  const respondMut = useMutation({
    mutationFn: (input: { id: string; status: "accepted" | "declined" | "withdrawn" }) =>
      respondFn({ data: input }),
    onSuccess: (_v, vars) => {
      toast.success(
        vars.status === "accepted"
          ? "আগ্রহ গ্রহণ করা হয়েছে"
          : vars.status === "declined"
            ? "আগ্রহ প্রত্যাখ্যান করা হয়েছে"
            : "আগ্রহ প্রত্যাহার করা হয়েছে",
      );
      qc.invalidateQueries({ queryKey: ["match", "interests"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("রিকোয়েস্ট মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["match", "mine"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const contactMut = useMutation({
    mutationFn: (id: string) => contactFn({ data: { id } }),
  });

  const [contacts, setContacts] = useState<Record<string, string | null>>({});

  const revealContact = async (id: string) => {
    try {
      const res = await contactMut.mutateAsync(id);
      setContacts((prev) => ({ ...prev, [id]: res.contact_phone }));
      if (!res.contact_phone) {
        toast.info("যোগাযোগের তথ্য এখনো উপলব্ধ নয় — আগ্রহ গৃহীত হলে দেখা যাবে");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "যোগাযোগের তথ্য আনা যায়নি");
    }
  };

  const myList = useMemo(() => requests.data ?? [], [requests.data]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <HeartHandshake className="h-4 w-4" /> {MATCH_BRAND}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <LayoutDashboard className="h-6 w-6 text-primary" /> আমার ম্যাচ ড্যাশবোর্ড
          </h1>
        </div>
        <Button asChild>
          <Link to="/match/new">
            <Plus className="mr-1.5 h-4 w-4" /> নতুন রিকোয়েস্ট
          </Link>
        </Button>
      </header>

      <Tabs defaultValue="requests">
        <TabsList className="flex-wrap">
          <TabsTrigger value="requests">
            আমার রিকোয়েস্ট ({toBanglaDigits(myList.length)})
          </TabsTrigger>
          <TabsTrigger value="received">
            <Inbox className="mr-1.5 h-4 w-4" /> প্রাপ্ত আগ্রহ ({toBanglaDigits(received.data?.length ?? 0)})
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="mr-1.5 h-4 w-4" /> পাঠানো আগ্রহ ({toBanglaDigits(sent.data?.length ?? 0)})
          </TabsTrigger>
          <TabsTrigger value="shortlist">শর্টলিস্ট ({toBanglaDigits(shortlist.data?.length ?? 0)})</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ my requests */}
        <TabsContent value="requests" className="space-y-4 pt-4">
          {requests.isLoading ? (
            <p className="py-12 text-center text-muted-foreground">লোড হচ্ছে…</p>
          ) : myList.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">আপনার কোনো ম্যাচ রিকোয়েস্ট নেই।</p>
              <Button asChild className="mt-4">
                <Link to="/match/new">নতুন রিকোয়েস্ট তৈরি করুন</Link>
              </Button>
            </Card>
          ) : (
            myList.map((m) => {
              const meta = MATCH_STATUS_META[m.status];
              return (
                <Card key={m.id} className="border-border/60 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{m.display_name}</h2>
                        <Badge variant="secondary" className={meta.className}>
                          {meta.label}
                        </Badge>
                        {m.is_verified && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary"
                          >
                            <ShieldCheck className="mr-1 h-3 w-3" /> যাচাইকৃত
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {LOOKING_FOR_LABEL[m.looking_for]} · {CREATED_FOR_LABEL[m.created_for]} ·{" "}
                        {MARITAL_LABEL[m.marital_status]} · {m.area} · বয়স{" "}
                        {toBanglaDigits(m.age_min)}–{toBanglaDigits(m.age_max)}
                      </p>
                      {m.admin_note && (
                        <p className="mt-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                          প্রশাসকের নোট: {m.admin_note}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.status === "approved" && (
                        <Button asChild size="sm" variant="outline">
                          <Link to="/match/$id" params={{ id: m.id }}>
                            বিস্তারিত
                          </Link>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="mr-1 h-4 w-4" /> মুছুন
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>রিকোয়েস্ট মুছবেন?</AlertDialogTitle>
                            <AlertDialogDescription>
                              এই রিকোয়েস্ট এবং এর সঙ্গে যুক্ত সব আগ্রহ স্থায়ীভাবে মুছে যাবে।
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMut.mutate(m.id)}>
                              মুছে ফেলুন
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ---------------------------------------------- received interests */}
        <TabsContent value="received" className="space-y-4 pt-4">
          {received.isLoading ? (
            <p className="py-12 text-center text-muted-foreground">লোড হচ্ছে…</p>
          ) : (received.data ?? []).length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              এখনো কেউ আগ্রহ প্রকাশ করেনি।
            </Card>
          ) : (
            (received.data ?? []).map((i) => {
              const meta = INTEREST_STATUS_META[i.status];
              return (
                <Card key={i.id} className="border-border/60 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="flex items-center gap-1.5 font-semibold">
                          <User className="h-4 w-4 text-primary" /> {i.sender_name}
                        </h3>
                        <Badge variant="secondary" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        রিকোয়েস্ট: {i.request_name}
                      </p>
                      {i.message && <p className="text-sm">“{i.message}”</p>}
                      {i.status === "accepted" && (
                        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                          <Phone className="h-4 w-4" /> {i.sender_phone}
                        </p>
                      )}
                    </div>
                    {i.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={respondMut.isPending}
                          onClick={() => respondMut.mutate({ id: i.id, status: "accepted" })}
                        >
                          গ্রহণ করুন
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={respondMut.isPending}
                          onClick={() => respondMut.mutate({ id: i.id, status: "declined" })}
                        >
                          প্রত্যাখ্যান
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ------------------------------------------------- sent interests */}
        <TabsContent value="sent" className="space-y-4 pt-4">
          {sent.isLoading ? (
            <p className="py-12 text-center text-muted-foreground">লোড হচ্ছে…</p>
          ) : (sent.data ?? []).length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              আপনি এখনো কোনো আগ্রহ পাঠাননি।
            </Card>
          ) : (
            (sent.data ?? []).map((i) => {
              const meta = INTEREST_STATUS_META[i.status];
              const phone = contacts[i.request_id];
              return (
                <Card key={i.id} className="border-border/60 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {i.request ? (
                          <Link
                            to="/match/$id"
                            params={{ id: i.request.id }}
                            className="font-semibold text-primary hover:underline"
                          >
                            {i.request.display_name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-muted-foreground">
                            রিকোয়েস্ট আর উপলব্ধ নয়
                          </span>
                        )}
                        <Badge variant="secondary" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </div>
                      {i.message && <p className="text-sm text-muted-foreground">“{i.message}”</p>}
                      {i.status === "accepted" && phone && (
                        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                          <Phone className="h-4 w-4" /> {phone}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {i.status === "accepted" && !phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={contactMut.isPending}
                          onClick={() => revealContact(i.request_id)}
                        >
                          <Phone className="mr-1 h-4 w-4" /> যোগাযোগ দেখুন
                        </Button>
                      )}
                      {i.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={respondMut.isPending}
                          onClick={() => respondMut.mutate({ id: i.id, status: "withdrawn" })}
                        >
                          প্রত্যাহার করুন
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ----------------------------------------------------- shortlist */}
        <TabsContent value="shortlist" className="pt-4">
          {shortlist.isLoading ? (
            <p className="py-12 text-center text-muted-foreground">লোড হচ্ছে…</p>
          ) : (shortlist.data ?? []).length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              শর্টলিস্ট খালি। তালিকা পেজ থেকে পছন্দের রিকোয়েস্ট যোগ করুন।
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(shortlist.data ?? []).map((m) => (
                <Card key={m.id} className="border-border/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{m.display_name}</h3>
                    {m.is_verified && (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-label="যাচাইকৃত" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {LOOKING_FOR_LABEL[m.looking_for]} · {MARITAL_LABEL[m.marital_status]} · {m.area} ·
                    বয়স {toBanglaDigits(m.age_min)}–{toBanglaDigits(m.age_max)}
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link to="/match/$id" params={{ id: m.id }}>
                      বিস্তারিত দেখুন
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="flex items-start gap-3 border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>
          রিকোয়েস্ট সম্পাদনা করলে তা আবার প্রশাসকের যাচাইয়ের জন্য অপেক্ষমাণ থাকবে। যোগাযোগের নম্বর
          শুধুমাত্র আগ্রহ গৃহীত হলে দেখা যায়।
        </p>
      </Card>
    </div>
  );
}
