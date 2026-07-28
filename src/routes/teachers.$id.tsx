import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, MapPin, Phone, MessageCircle, GraduationCap, BookOpen, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { TeacherRow, CategoryRow } from "@/lib/teachers-shared";
import { TeacherPhoto } from "@/components/teachers/TeacherPhoto";
import { ShareButtons } from "@/components/teachers/ShareButtons";
import { buildProfileHead, isUuid, metaDescription, signMediaForOg, SITE_BRAND, SITE_URL } from "@/lib/seo";

type TeacherWithSlug = TeacherRow & { slug: string | null };

export const Route = createFileRoute("/teachers/$id")({
  loader: async ({ params }) => {
    const key = params.id;
    const base = supabase.from("teachers").select("*").eq("status", "approved");
    const { data, error } = isUuid(key)
      ? await base.eq("id", key).maybeSingle()
      : await base.eq("slug", key).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const t = data as TeacherWithSlug;
    const canonicalSlug = t.slug ?? t.id;
    const url = `${SITE_URL}/teachers/${canonicalSlug}`;
    const image = await signMediaForOg("teacher-images", t.photo_url);
    return { teacher: t, url, image };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: `শিক্ষক পাওয়া যায়নি — ${SITE_BRAND}` }, { name: "robots", content: "noindex" }] };
    }
    const { teacher: t, url, image } = loaderData;
    const location = [t.area, t.upazila, t.district].filter(Boolean).join(", ");
    const title = `${t.full_name} — শিক্ষক | ${SITE_BRAND}`;
    const description = metaDescription(
      t.description ||
        `${t.full_name}${t.subjects ? " — বিষয়: " + t.subjects : ""}${t.qualification ? " | " + t.qualification : ""}। অবস্থান: ${location}।`,
    );
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: t.full_name,
      description,
      url,
      image,
      telephone: t.phone,
      jobTitle: "Teacher",
      address: { "@type": "PostalAddress", addressLocality: t.upazila, addressRegion: t.district, addressCountry: "BD" },
    };
    const head = buildProfileHead({ title, description, url, image, type: "profile", imageAlt: t.full_name });
    return { ...head, scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }] };
  },
  component: TeacherDetails,
});

function TeacherDetails() {
  const { teacher: t, url } = Route.useLoaderData();
  const catQ = useQuery({
    queryKey: ["teacher-cats"],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_categories").select("*");
      return (data ?? []) as CategoryRow[];
    },
  });
  const cat = catQ.data?.find((c) => c.id === t.category_id);
  const waNumber = (t.whatsapp || t.phone).replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link to="/teachers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> সব শিক্ষক
      </Link>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <TeacherPhoto path={t.photo_url} alt={t.full_name} className="h-28 w-28 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{t.full_name}</h1>
                {t.is_verified && <Badge className="gap-1 bg-primary text-primary-foreground"><BadgeCheck className="h-3.5 w-3.5" /> যাচাইকৃত</Badge>}
                {t.is_available ? (
                  <Badge className="bg-secondary text-secondary-foreground">উপলব্ধ</Badge>
                ) : (
                  <Badge variant="outline">ব্যস্ত</Badge>
                )}
              </div>
              {cat && <p className="mt-1 text-primary">{cat.name_bn}</p>}
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {[t.area, t.upazila, t.district].filter(Boolean).join(", ")}
              </p>
              {typeof t.experience_years === "number" && t.experience_years > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" /> অভিজ্ঞতা: {t.experience_years} বছর
                </p>
              )}
            </div>
          </div>

          {t.subjects && (
            <div className="mt-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold"><BookOpen className="h-4 w-4" /> পড়ানো বিষয়</h2>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{t.subjects}</p>
            </div>
          )}
          {t.qualification && (
            <div className="mt-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold"><GraduationCap className="h-4 w-4" /> শিক্ষাগত যোগ্যতা</h2>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{t.qualification}</p>
            </div>
          )}
          {t.description && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold">সংক্ষিপ্ত বিবরণ</h2>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{t.description}</p>
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button asChild size="lg" className="h-12">
              <a href={`tel:${t.phone}`}><Phone className="mr-2 h-4 w-4" /> কল করুন — {t.phone}</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          </div>

          <div className="mt-6 border-t pt-4">
            <ShareButtons title={`${t.full_name} — ${SITE_BRAND}`} url={url} />
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        এই প্ল্যাটফর্ম শুধুমাত্র একটি ডিরেক্টরি। যোগাযোগের আগে তথ্য যাচাই করে নিন।
      </p>
    </div>
  );
}
