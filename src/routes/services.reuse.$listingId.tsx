import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Flag, ImageOff, Loader2, MapPin, Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReuseListing } from "@/components/reuse/use-reuse";
import { useAuth } from "@/hooks/use-auth";
import { getReuseContact, reportReuseListing } from "@/lib/reuse.functions";
import {
  REUSE_REPORT_REASONS,
  REUSE_TYPE_META,
  normalizeReusePhone,
} from "@/lib/reuse-shared";
import { formatBanglaCurrency, formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/services/reuse/$listingId")({
  head: () => ({
    meta: [
      { title: "পণ্যের বিবরণ — KHIJIRION Reuse" },
      { name: "description", content: "ব্যবহৃত পণ্যের বিস্তারিত তথ্য, অবস্থা, দাম ও অবস্থান দেখুন।" },
      { property: "og:title", content: "পণ্যের বিবরণ — KHIJIRION Reuse" },
      { property: "og:description", content: "ব্যবহৃত পণ্য কিনুন, বিক্রি করুন বা দান করুন।" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReuseDetails,
});

function ReuseDetails() {
  const { listingId } = Route.useParams();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useReuseListing(listingId);

  const [contact, setContact] = useState<{ phone: string | null; whatsapp: string | null } | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string>(REUSE_REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  async function revealContact() {
    if (!isAuthenticated) {
      toast.error("যোগাযোগের তথ্য দেখতে লগইন করুন");
      return;
    }
    setLoadingContact(true);
    try {
      const res = await getReuseContact({ data: { id: listingId } });
      setContact(res);
      if (!res.phone && !res.whatsapp) toast.info("বিক্রেতা যোগাযোগের নম্বর দেননি");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingContact(false);
    }
  }

  async function submitReport() {
    if (!isAuthenticated) {
      toast.error("রিপোর্ট করতে লগইন করুন");
      return;
    }
    setSending(true);
    try {
      await reportReuseListing({
        data: { listing_id: listingId, reason, details: details.trim() ? details.trim() : null },
      });
      toast.success("রিপোর্ট পাঠানো হয়েছে");
      setReportOpen(false);
      setDetails("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (isLoading) {
    return <p className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">লোড হচ্ছে…</p>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold">পণ্যটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">এটি সরানো হয়েছে অথবা এখনো অনুমোদিত হয়নি।</p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/services/reuse">তালিকায় ফিরে যান</Link>
        </Button>
      </div>
    );
  }

  const type = REUSE_TYPE_META[data.listing_type];
  const isFree = data.listing_type === "donation" || data.price === null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/services/reuse">
          <ArrowLeft className="mr-2 h-4 w-4" /> সব পণ্য
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur-xl lg:col-span-3">
          <div className="aspect-[4/3] w-full bg-muted">
            {data.image_url ? (
              <img src={data.image_url} alt={data.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <ImageOff className="h-10 w-10" />
              </div>
            )}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/70 backdrop-blur-xl lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${type.className}`}>
                {type.label}
              </span>
              <span className="rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {data.condition}
              </span>
            </div>

            <h1 className="text-xl font-bold sm:text-2xl">{data.title}</h1>
            <p className="text-2xl font-bold text-primary">
              {isFree ? "বিনামূল্যে" : formatBanglaCurrency(Number(data.price))}
            </p>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">ক্যাটাগরি</dt>
                <dd className="text-right font-medium">{data.category}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">অবস্থা</dt>
                <dd className="text-right font-medium">{data.condition}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">এলাকা</dt>
                <dd className="text-right font-medium">{data.area ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">প্রকাশের তারিখ</dt>
                <dd className="text-right font-medium">{formatBanglaDate(data.created_at)}</dd>
              </div>
            </dl>

            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" /> {data.location}
            </p>

            {contact ? (
              <div className="space-y-2">
                {contact.phone && (
                  <Button asChild className="w-full">
                    <a href={`tel:${normalizeReusePhone(contact.phone)}`}>
                      <Phone className="mr-2 h-4 w-4" /> {contact.phone}
                    </a>
                  </Button>
                )}
                {contact.whatsapp && (
                  <Button asChild variant="outline" className="w-full">
                    <a
                      href={`https://wa.me/${normalizeReusePhone(contact.whatsapp).replace("+", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> হোয়াটসঅ্যাপ
                    </a>
                  </Button>
                )}
                {!contact.phone && !contact.whatsapp && (
                  <p className="text-sm text-muted-foreground">যোগাযোগের নম্বর দেওয়া হয়নি।</p>
                )}
              </div>
            ) : (
              <Button className="w-full" onClick={revealContact} disabled={loadingContact}>
                {loadingContact ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                যোগাযোগের তথ্য দেখুন
              </Button>
            )}
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground">যোগাযোগের তথ্য দেখতে লগইন প্রয়োজন।</p>
            )}

            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                  <Flag className="mr-2 h-4 w-4" /> বিজ্ঞাপনটি রিপোর্ট করুন
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>রিপোর্ট করুন</DialogTitle>
                  <DialogDescription>সমস্যার কারণ জানালে আমরা দ্রুত ব্যবস্থা নেব।</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>কারণ</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REUSE_REPORT_REASONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>বিস্তারিত (ঐচ্ছিক)</Label>
                    <Textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={600} rows={4} />
                  </div>
                  <Button className="w-full" onClick={submitReport} disabled={sending}>
                    {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} পাঠান
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {data.description && (
        <Card className="border-border/60 bg-card/70 backdrop-blur-xl">
          <CardContent className="p-5">
            <h2 className="mb-2 text-base font-semibold">বিবরণ</h2>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{data.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
