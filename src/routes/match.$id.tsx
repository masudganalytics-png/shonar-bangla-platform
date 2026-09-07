import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useMatchRequest, useMyShortlist } from "@/components/match/use-match";
import { getMatchContact, sendMatchInterest } from "@/lib/match.functions";
import {
  CREATED_FOR_LABEL,
  LOOKING_FOR_LABEL,
  MARITAL_LABEL,
  MATCH_DISCLAIMER,
  normalizeMatchPhone,
} from "@/lib/match-shared";
import { toBanglaDigits } from "@/lib/bangla";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/match/$id")({
  head: () => ({
    meta: [
      { title: "ম্যাচ রিকোয়েস্টের বিস্তারিত — KHIJIRION Match" },
      {
        name: "description",
        content: "যাচাইকৃত পাত্র-পাত্রী রিকোয়েস্টের বিস্তারিত তথ্য ও আগ্রহ প্রকাশের সুযোগ।",
      },
      { property: "og:title", content: "ম্যাচ রিকোয়েস্টের বিস্তারিত — KHIJIRION Match" },
      { property: "og:description", content: "পরিবারভিত্তিক পাত্র-পাত্রী রিকোয়েস্টের বিস্তারিত।" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchDetails,
});

function MatchDetails() {
  const { id } = Route.useParams();
  const { data, isLoading } = useMatchRequest(id);
  const { user, isAuthenticated } = useAuth();
  const { data: shortlist } = useMyShortlist(user?.id);
  const qc = useQueryClient();

  const interest = useServerFn(sendMatchInterest);
  const contactFn = useServerFn(getMatchContact);

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState<{ name: string | null; phone: string | null } | null>(null);

  const shortlisted = (shortlist ?? []).includes(id);

  const interestMut = useMutation({
    mutationFn: () =>
      interest({
        data: {
          request_id: id,
          sender_name: senderName.trim(),
          sender_phone: normalizeMatchPhone(senderPhone),
          message: message.trim() ? message.trim() : null,
        },
      }),
    onSuccess: () => {
      toast.success("আগ্রহ পাঠানো হয়েছে");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["match"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const contactMut = useMutation({
    mutationFn: () => contactFn({ data: { id } }),
    onSuccess: (res) => {
      if (!res.contact_phone) {
        toast.error("আগ্রহ গৃহীত হলেই যোগাযোগের নম্বর দেখা যাবে");
        return;
      }
      setContact({ name: res.contact_name, phone: res.contact_phone });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleShortlist = async () => {
    if (!isAuthenticated || !user) return toast.error("শর্টলিস্ট করতে লগইন করুন");
    if (shortlisted) {
      const { error } = await supabase
        .from("match_shortlists")
        .delete()
        .eq("user_id", user.id)
        .eq("request_id", id);
      if (error) return toast.error(error.message);
      toast.success("শর্টলিস্ট থেকে সরানো হয়েছে");
    } else {
      const { error } = await supabase
        .from("match_shortlists")
        .insert({ user_id: user.id, request_id: id });
      if (error) return toast.error(error.message);
      toast.success("শর্টলিস্টে যোগ হয়েছে");
    }
    qc.invalidateQueries({ queryKey: ["match", "shortlist"] });
  };

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">লোড হচ্ছে…</div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">রিকোয়েস্টটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          এটি মুছে ফেলা হয়েছে অথবা এখনো যাচাই হয়নি।
        </p>
        <Button asChild className="mt-5">
          <Link to="/match">ম্যাচ তালিকায় ফিরুন</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === data.user_id;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Link to="/match" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> ম্যাচ তালিকায় ফিরুন
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-3xl font-bold text-muted-foreground">
            {data.photo_url ? (
              <img src={data.photo_url} alt={`${data.display_name}-এর ছবি`} className="h-full w-full object-cover" />
            ) : (
              data.display_name.slice(0, 1)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{data.display_name}</h1>
              {data.is_verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  <BadgeCheck className="h-3.5 w-3.5" /> যাচাইকৃত
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {LOOKING_FOR_LABEL[data.looking_for]} খুঁজছেন · {CREATED_FOR_LABEL[data.created_for]} ·{" "}
              {MARITAL_LABEL[data.marital_status]}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4" /> বয়সসীমা: {toBanglaDigits(data.age_min)}–
                {toBanglaDigits(data.age_max)} বছর
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {data.area}
              </p>
              {data.education ? (
                <p className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> {data.education}
                </p>
              ) : null}
              {data.profession ? (
                <p className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> {data.profession}
                </p>
              ) : null}
              {data.height_cm ? (
                <p className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" /> {toBanglaDigits(data.height_cm)} সেমি
                </p>
              ) : null}
            </div>
          </div>
          <Button type="button" variant="outline" onClick={toggleShortlist}>
            <Heart className={cn("mr-2 h-4 w-4", shortlisted && "fill-primary text-primary")} />
            {shortlisted ? "শর্টলিস্টে আছে" : "শর্টলিস্ট"}
          </Button>
        </CardContent>
      </Card>

      {data.family_info ? (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold">পারিবারিক তথ্য</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{data.family_info}</p>
          </CardContent>
        </Card>
      ) : null}

      {data.expectations ? (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold">প্রত্যাশা</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{data.expectations}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" /> যোগাযোগ
          </h2>
          {!isAuthenticated ? (
            <p className="text-sm text-muted-foreground">
              যোগাযোগ বা আগ্রহ প্রকাশ করতে{" "}
              <Link to="/auth" className="text-primary underline">
                লগইন করুন
              </Link>
              ।
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" onClick={() => contactMut.mutate()} disabled={contactMut.isPending}>
                  {contactMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                  যোগাযোগের নম্বর দেখুন
                </Button>
                {contact?.phone ? (
                  <a href={`tel:${contact.phone}`} className="text-sm font-medium text-primary underline">
                    {contact.name ? `${contact.name} — ` : ""}
                    {contact.phone}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    আগ্রহ গৃহীত হলেই নম্বর দেখা যাবে।
                  </span>
                )}
              </div>

              {!isOwner ? (
                <form
                  className="grid gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (senderName.trim().length < 2) return toast.error("আপনার নাম লিখুন");
                    if (!/^\+?\d{10,15}$/.test(normalizeMatchPhone(senderPhone)))
                      return toast.error("সঠিক ফোন নম্বর দিন");
                    interestMut.mutate();
                  }}
                >
                  <p className="sm:col-span-2 text-sm font-medium">আগ্রহ প্রকাশ করুন</p>
                  <div>
                    <Label htmlFor="sender_name">আপনার নাম</Label>
                    <Input id="sender_name" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="sender_phone">আপনার ফোন নম্বর</Label>
                    <Input
                      id="sender_phone"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="message">বার্তা (ঐচ্ছিক)</Label>
                    <Textarea id="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" className="w-full" disabled={interestMut.isPending}>
                      {interestMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      আগ্রহ পাঠান
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  এটি আপনার নিজের রিকোয়েস্ট।{" "}
                  <Link to="/my-match" className="text-primary underline">
                    ড্যাশবোর্ডে আগ্রহগুলো দেখুন
                  </Link>
                  ।
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="flex items-start gap-3 border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>{MATCH_DISCLAIMER}</p>
      </Card>
    </div>
  );
}
