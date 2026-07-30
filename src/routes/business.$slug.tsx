import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Sparkles, MapPin, Building2, Star, Loader2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BusinessLogo, BusinessImage } from "@/components/business/BusinessLogo";
import { BusinessOwner } from "@/components/business/BusinessOwner";
import { RatingStars } from "@/components/business/RatingStars";
import { HoursDisplay } from "@/components/business/HoursDisplay";
import { ContactButtons } from "@/components/business/ContactButtons";
import { ShareButtons } from "@/components/teachers/ShareButtons";
import { toBanglaDigits } from "@/lib/bangla";
import { incrementBusinessView } from "@/lib/business.functions";
import { buildProfileHead, isUuid, metaDescription, signMediaForOg, SITE_BRAND, SITE_URL } from "@/lib/seo";
import type { BusinessRow, BusinessHoursRow, BusinessGalleryRow, BusinessReviewRow, BusinessCategory } from "@/lib/business-shared";

export const Route = createFileRoute("/business/$slug")({
  loader: async ({ params }) => {
    const { slug } = params;
    const base = supabase.from("businesses").select("*").eq("status", "approved");
    const { data, error } = isUuid(slug)
      ? await base.eq("id", slug).maybeSingle()
      : await base.eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const biz = data as BusinessRow;
    const canonicalSlug = biz.slug ?? biz.id;
    const url = `${SITE_URL}/business/${canonicalSlug}`;
    const image = await signMediaForOg("business-media", biz.cover_url ?? biz.logo_url);
    return { biz, url, image };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: `ব্যবসা পাওয়া যায়নি — ${SITE_BRAND}` }, { name: "robots", content: "noindex" }] };
    }
    const { biz, url, image } = loaderData;
    const title = `${biz.name} — ${SITE_BRAND}`;
    const description = metaDescription(
      biz.short_description ||
        biz.full_description ||
        `${biz.name} — ${[biz.area, biz.union_name, biz.upazila].filter(Boolean).join(", ")}। ${SITE_BRAND}-এ যাচাইকৃত স্থানীয় ব্যবসা।`,
    );
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: biz.name,
      description,
      url,
      image,
      telephone: biz.phone || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: biz.address || undefined,
        addressLocality: biz.upazila,
        addressRegion: biz.district,
        addressCountry: "BD",
      },
      geo: biz.lat && biz.lng ? { "@type": "GeoCoordinates", latitude: biz.lat, longitude: biz.lng } : undefined,
      aggregateRating:
        biz.review_count > 0
          ? { "@type": "AggregateRating", ratingValue: Number(biz.avg_rating), reviewCount: biz.review_count }
          : undefined,
    };
    const head = buildProfileHead({ title, description, url, image, type: "profile", imageAlt: biz.name });
    return {
      ...head,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: BusinessDetail,
});

function BusinessDetail() {
  const { biz: b, url } = Route.useLoaderData();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (b?.id) void incrementBusinessView({ data: { id: b.id } }).catch(() => {});
  }, [b?.id]);

  const catQ = useQuery({
    queryKey: ["biz-cat", b.category_id],
    enabled: !!b.category_id,
    queryFn: async () => {
      const { data } = await supabase.from("business_categories").select("*").eq("id", b.category_id!).maybeSingle();
      return data as BusinessCategory | null;
    },
  });

  const hoursQ = useQuery({
    queryKey: ["biz-hours", b.id],
    queryFn: async () => {
      const { data } = await supabase.from("business_hours").select("*").eq("business_id", b.id).order("day");
      return (data ?? []) as BusinessHoursRow[];
    },
  });

  const galleryQ = useQuery({
    queryKey: ["biz-gallery", b.id],
    queryFn: async () => {
      const { data } = await supabase.from("business_gallery").select("*").eq("business_id", b.id).order("sort_order");
      return (data ?? []) as BusinessGalleryRow[];
    },
  });

  const reviewsQ = useQuery({
    queryKey: ["biz-reviews", b.id],
    queryFn: async () => {
      const { data } = await supabase.from("business_reviews").select("*")
        .eq("business_id", b.id).eq("is_hidden", false).order("created_at", { ascending: false }).limit(50);
      return (data ?? []) as BusinessReviewRow[];
    },
  });

  if (!b) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">ব্যবসাটি পাওয়া যায়নি</h1>
        <Button asChild variant="outline" className="mt-4"><Link to="/business">ডিরেক্টরিতে ফিরে যান</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link to="/business/directory" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> ডিরেক্টরি
      </Link>

      {/* Cover */}
      <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/20 sm:h-56">
        {b.cover_url && <BusinessImage path={b.cover_url} alt={b.name} className="h-full w-full" />}
      </div>

      {/* Header */}
      <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <BusinessLogo path={b.logo_url} name={b.name} className="h-24 w-24 border-4 border-background text-2xl sm:h-28 sm:w-28" />
        <div className="flex-1 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{b.name}</h1>
            {b.is_verified && (
              <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                <BadgeCheck className="h-3.5 w-3.5" /> যাচাইকৃত
              </Badge>
            )}
            {b.is_featured && (
              <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5" /> ফিচার্ড
              </Badge>
            )}
          </div>
          {catQ.data && <p className="mt-1 text-sm text-primary">{catQ.data.icon} {catQ.data.name_bn}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[b.area, b.union_name, b.upazila].filter(Boolean).join(", ")}</span>
            {b.review_count > 0 && <RatingStars value={Number(b.avg_rating)} count={b.review_count} />}
            <span className="inline-flex items-center gap-1 text-xs"><Eye className="h-3.5 w-3.5" /> {toBanglaDigits(b.view_count)} ভিউ</span>
          </div>
        </div>
        {(b.owner_name || b.owner_photo_url) && (
          <div className="flex flex-col items-center gap-1 pt-2 sm:pb-1">
            <BusinessOwner
              name={b.owner_name}
              photo={b.owner_photo_url}
              designation={b.owner_designation}
              verified={b.owner_verified}
              className="flex-col items-center gap-1.5 text-center [&_.h-9]:h-16 [&_.h-9]:w-16 sm:[&_.h-9]:h-16 sm:[&_.h-9]:w-16"
            />
          </div>
        )}
      </div>


      {(b.short_description || b.full_description) && (
        <Card className="mt-6"><CardContent className="prose prose-sm max-w-none whitespace-pre-line p-5 dark:prose-invert">
          {b.short_description && <p className="text-base font-medium">{b.short_description}</p>}
          {b.full_description && <p className="mt-2 text-sm text-muted-foreground">{b.full_description}</p>}
        </CardContent></Card>
      )}

      <Card className="mt-4"><CardContent className="p-5">
        <h2 className="mb-3 text-sm font-semibold">যোগাযোগ</h2>
        <ContactButtons
          phone={b.phone} whatsapp={b.whatsapp} facebook_url={b.facebook_url} website_url={b.website_url}
          lat={b.lat} lng={b.lng} address={b.address} name={b.name}
        />
      </CardContent></Card>

      <Card className="mt-4"><CardContent className="p-5">
        <ShareButtons title={`${b.name} — ${SITE_BRAND}`} url={url} />
      </CardContent></Card>

      {b.products && b.products.length > 0 && (
        <Card className="mt-4"><CardContent className="p-5">
          <h2 className="mb-2 text-sm font-semibold">পণ্য ও সেবা</h2>
          <div className="flex flex-wrap gap-2">
            {b.products.map((p: string, i: number) => <Badge key={i} variant="secondary">{p}</Badge>)}
          </div>
        </CardContent></Card>
      )}

      {(galleryQ.data ?? []).length > 0 && (
        <Card className="mt-4"><CardContent className="p-5">
          <h2 className="mb-3 text-sm font-semibold">গ্যালারি</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(galleryQ.data ?? []).map((g) => (
              <BusinessImage key={g.id} path={g.image_url} alt={g.caption ?? b.name} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </CardContent></Card>
      )}

      {(hoursQ.data ?? []).length > 0 && (
        <Card className="mt-4"><CardContent className="p-5"><HoursDisplay hours={hoursQ.data ?? []} /></CardContent></Card>
      )}

      <Card className="mt-4" id="reviews">
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-semibold">পর্যালোচনা</h2>
          <ReviewForm businessId={b.id} disabled={!isAuthenticated || b.owner_id === user?.id} />
          <div className="mt-4 space-y-3">
            {(reviewsQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">এখনো কোন পর্যালোচনা নেই।</p>}
            {(reviewsQ.data ?? []).map((r) => (
              <div key={r.id} className="rounded-lg border p-3">
                <RatingStars value={r.rating} />
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("bn-BD")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewForm({ businessId, disabled }: { businessId: string; disabled: boolean }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const qc = useQueryClient();
  const { user } = useAuth();
  const m = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("লগইন করুন");
      const { error } = await supabase.from("business_reviews").upsert({
        business_id: businessId, user_id: user.id, rating, comment: comment.trim() || null,
      }, { onConflict: "business_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("পর্যালোচনা জমা হয়েছে");
      setComment("");
      qc.invalidateQueries({ queryKey: ["biz-reviews", businessId] });
      qc.invalidateQueries({ queryKey: ["biz"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (disabled) {
    return <p className="text-xs text-muted-foreground">
      পর্যালোচনা দিতে <Link to="/auth" className="text-primary underline">লগইন করুন</Link>।
    </p>;
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 stroke-amber-400" : "stroke-muted-foreground/50"}`} />
          </button>
        ))}
      </div>
      <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="আপনার মতামত (ঐচ্ছিক)" className="mt-2" />
      <Button onClick={() => m.mutate()} disabled={m.isPending} size="sm" className="mt-2">
        {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} পর্যালোচনা জমা দিন
      </Button>
    </div>
  );
}
