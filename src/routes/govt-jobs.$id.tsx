import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GovtPhoto } from "@/components/govt/GovtPhoto";
import { useGovtProfile } from "@/components/govt/use-govt";
import { getGovtContactMember, getGovtContactPublic } from "@/lib/govt.functions";
import { useAuth } from "@/hooks/use-auth";
import { GOVT_DISCLAIMER, normalizeGovtPhone } from "@/lib/govt-shared";
import { toBanglaDigits } from "@/lib/bangla";

type Contact = { phone: string | null; whatsapp: string | null; official_email: string | null };

export const Route = createFileRoute("/govt-jobs/$id")({
  head: () => ({
    meta: [
      { title: "সরকারি চাকরিজীবীর প্রোফাইল — উখিয়া | KHIJIRION" },
      {
        name: "description",
        content: "উখিয়ার একজন সরকারি চাকরিজীবীর পরিচিতি — পদবি, দপ্তর, কর্মস্থল ও পরামর্শ।",
      },
      { property: "og:title", content: "সরকারি চাকরিজীবীর প্রোফাইল — উখিয়া" },
      { property: "og:description", content: "পদবি, দপ্তর, কর্মস্থল ও তরুণদের জন্য পরামর্শ দেখুন।" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GovtProfilePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-xl font-bold">প্রোফাইল পাওয়া যায়নি</h1>
      <Button asChild className="mt-4">
        <Link to="/govt-jobs">ডিরেক্টরিতে ফিরুন</Link>
      </Button>
    </div>
  ),
});

function GovtProfilePage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useGovtProfile(id);
  const { isAuthenticated } = useAuth();
  const fetchPublic = useServerFn(getGovtContactPublic);
  const fetchMember = useServerFn(getGovtContactMember);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">লোড হচ্ছে…</div>;
  }
  if (!data) throw notFound();

  const w = data;

  async function revealContact() {
    setLoadingContact(true);
    try {
      const res = isAuthenticated
        ? await fetchMember({ data: { id } })
        : await fetchPublic({ data: { id } });
      setContact(res);
      if (!res.phone && !res.whatsapp && !res.official_email) {
        toast.info("এই সদস্য যোগাযোগের তথ্য প্রকাশ করেননি।");
      }
    } catch {
      toast.error("যোগাযোগের তথ্য আনা যায়নি");
    } finally {
      setLoadingContact(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/govt-jobs">
          <ArrowLeft className="mr-2 h-4 w-4" /> ডিরেক্টরিতে ফিরুন
        </Link>
      </Button>

      <Card className="border-border/60 bg-card/70 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <GovtPhoto
            url={w.photo_url}
            alt={w.full_name}
            className="h-28 w-28 shrink-0 rounded-3xl ring-2 ring-border/70"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{w.full_name}</h1>
              {w.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> যাচাইকৃত
                </span>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">{w.designation}</p>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{w.organization}</span>
              </p>
              <p className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {w.department}
                  {w.job_category ? ` • ${w.job_category}` : ""}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {w.current_workplace ? `${w.current_workplace} • ` : ""}
                  {w.current_district}
                  {w.current_upazila ? ` • ${w.current_upazila}` : ""}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">উখিয়া: {w.ukhiya_area}</span>
              </p>
              {w.joining_year && (
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>যোগদান: {toBanglaDigits(w.joining_year)}</span>
                </p>
              )}
            </div>

            <div className="mt-5">
              {contact ? (
                <div className="flex flex-wrap gap-2">
                  {contact.phone && (
                    <Button asChild size="sm">
                      <a href={`tel:${normalizeGovtPhone(contact.phone)}`}>
                        <Phone className="mr-2 h-4 w-4" /> কল করুন
                      </a>
                    </Button>
                  )}
                  {contact.whatsapp && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={`https://wa.me/${normalizeGovtPhone(contact.whatsapp).replace("+", "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" /> হোয়াটসঅ্যাপ
                      </a>
                    </Button>
                  )}
                  {contact.official_email && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`mailto:${contact.official_email}`}>
                        <Mail className="mr-2 h-4 w-4" /> ইমেইল
                      </a>
                    </Button>
                  )}
                  {!contact.phone && !contact.whatsapp && !contact.official_email && (
                    <p className="text-sm text-muted-foreground">যোগাযোগের তথ্য গোপন রাখা হয়েছে।</p>
                  )}
                </div>
              ) : (
                <Button size="sm" onClick={revealContact} disabled={loadingContact}>
                  {loadingContact ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Phone className="mr-2 h-4 w-4" />
                  )}
                  যোগাযোগের তথ্য দেখুন
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {w.bio && (
        <Card className="border-border/60 bg-card/70 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">আমার পরিচিতি</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{w.bio}</p>
        </Card>
      )}

      {w.tips_for_younger && (
        <Card className="border-border/60 bg-card/70 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">তরুণদের জন্য পরামর্শ</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {w.tips_for_younger}
          </p>
        </Card>
      )}

      <p className="rounded-xl border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
        {GOVT_DISCLAIMER}
      </p>
    </div>
  );
}
