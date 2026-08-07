import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  Cake,
  CalendarClock,
  Facebook,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/common/CountryFlag";
import { ProbashiPhoto } from "@/components/probashi/ProbashiPhoto";
import { ShareButtons } from "@/components/teachers/ShareButtons";
import { useProbashiProfile } from "@/components/probashi/use-probashi";
import { getProbashiContact } from "@/lib/probashi.functions";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  PRESENCE_META,
  calcAge,
  countryMeta,
  daysAbroad,
  daysUntilReturn,
  formatDaysRemaining,
  formatDuration,
  isBirthdayToday,
  presenceOf,
  toBanglaDigits,
} from "@/lib/probashi-shared";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/probashi/$slug")({
  head: () => ({
    meta: [
      { title: "প্রবাসী প্রোফাইল — প্রবাসী কর্নার | উখিয়া সেবা" },
      {
        name: "description",
        content: "উখিয়ার প্রবাসী সদস্যের প্রোফাইল — দেশ, শহর, পেশা এবং দেশে ফেরার সম্ভাব্য তারিখ।",
      },
      { property: "og:title", content: "প্রবাসী প্রোফাইল — উখিয়া সেবা" },
      { property: "og:description", content: "উখিয়ার প্রবাসী সদস্যের প্রোফাইল দেখুন।" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProbashiProfilePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-xl font-bold">প্রোফাইল পাওয়া যায়নি</h1>
      <Button asChild className="mt-4"><Link to="/probashi">প্রবাসী কর্নারে ফিরুন</Link></Button>
    </div>
  ),
});

function ProbashiProfilePage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useProbashiProfile(slug);
  const { isAuthenticated } = useAuth();
  const fetchContact = useServerFn(getProbashiContact);
  const [contact, setContact] = useState<{ phone: string | null; whatsapp: string | null; facebook_url: string | null } | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">লোড হচ্ছে…</div>;
  }
  if (!data) throw notFound();

  const meta = countryMeta(data.country);
  const presence = presenceOf(data);
  const presenceMeta = PRESENCE_META[presence];
  const age = calcAge(data.birth_date);
  const abroad = daysAbroad(data.moved_abroad_date);
  const remaining = daysUntilReturn(data.expected_return_date);

  async function revealContact() {
    setLoadingContact(true);
    try {
      const res = await fetchContact({ data: { id: data!.id } });
      setContact(res);
      if (!res.phone && !res.whatsapp) toast.info("এই সদস্য যোগাযোগ নম্বর গোপন রেখেছেন।");
    } catch {
      toast.error("নম্বর আনা যায়নি");
    } finally {
      setLoadingContact(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/probashi" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> প্রবাসী কর্নার
      </Link>

      <Card className="mt-4 overflow-hidden border-border/60 bg-card/70 backdrop-blur-xl">
        <div className="h-28 w-full" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            <ProbashiPhoto
              url={data.photo_url}
              alt={data.full_name}
              className="h-24 w-24 rounded-2xl border-4 border-background bg-muted shadow-lg"
            />
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{data.full_name}</h1>
                {data.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" /> যাচাইকৃত
                  </span>
                )}
                {isBirthdayToday(data.birth_date) && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-2 py-0.5 text-xs font-medium text-pink-600 dark:text-pink-400">
                    <Cake className="h-3.5 w-3.5" /> আজ জন্মদিন
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.profession || "প্রবাসী"}
                {age !== null && ` • ${toBanglaDigits(age)} বছর`}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", presenceMeta.className)}>
              {presenceMeta.emoji} {presenceMeta.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs">
              <CountryFlag src={null} iso={meta.iso} countryName={meta.name} /> {meta.bn}
              {data.city ? ` • ${data.city}` : ""}
            </span>
            {data.village && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs">
                <MapPin className="h-3.5 w-3.5" /> {data.village}
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InfoTile icon={Plane} label="প্রবাসে অবস্থান" value={abroad !== null ? formatDuration(abroad) : "—"} />
            <InfoTile
              icon={CalendarClock}
              label="দেশে ফেরা"
              value={data.expected_return_date ? formatBanglaDate(data.expected_return_date) : "—"}
              hint={remaining !== null ? formatDaysRemaining(remaining) : undefined}
            />
            <InfoTile
              icon={Cake}
              label="জন্ম তারিখ"
              value={data.birth_date ? formatBanglaDate(data.birth_date) : "—"}
            />
          </div>

          {data.community_message && (
            <blockquote className="mt-6 rounded-xl border-l-4 border-primary bg-muted/40 p-4 text-sm italic">
              “{data.community_message}”
            </blockquote>
          )}

          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold">যোগাযোগ</h2>
            {!data.show_contact ? (
              <p className="text-sm text-muted-foreground">এই সদস্য যোগাযোগ নম্বর গোপন রেখেছেন।</p>
            ) : !isAuthenticated ? (
              <p className="text-sm text-muted-foreground">
                নম্বর দেখতে{" "}
                <Link to="/auth" search={{ mode: "login" }} className="text-primary underline">সাইন ইন করুন</Link>।
              </p>
            ) : contact ? (
              <div className="flex flex-wrap gap-2">
                {contact.phone && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`tel:${contact.phone}`}><Phone className="mr-1.5 h-4 w-4" /> {contact.phone}</a>
                  </Button>
                )}
                {contact.whatsapp && (
                  <Button asChild size="sm">
                    <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                {!contact.phone && !contact.whatsapp && (
                  <p className="text-sm text-muted-foreground">নম্বর দেওয়া নেই।</p>
                )}
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={revealContact} disabled={loadingContact}>
                {loadingContact && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} যোগাযোগ নম্বর দেখুন
              </Button>
            )}

            {contact?.facebook_url && (
              <Button asChild variant="ghost" size="sm">
                <a href={contact.facebook_url} target="_blank" rel="noopener noreferrer">
                  <Facebook className="mr-1.5 h-4 w-4" /> ফেসবুক প্রোফাইল
                </a>
              </Button>
            )}
          </div>

          <div className="mt-6 border-t border-border/60 pt-4">
            <ShareButtons title={`${data.full_name} — প্রবাসী কর্নার | উখিয়া সেবা`} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Plane;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
      {hint && <p className="text-xs text-primary">{hint}</p>}
    </div>
  );
}
