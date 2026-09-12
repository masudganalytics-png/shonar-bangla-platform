import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImageOff, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMyReuseListings } from "@/components/reuse/use-reuse";
import { deleteMyReuseListing, setMyReuseStatus } from "@/lib/reuse.functions";
import { REUSE_STATUS_META, REUSE_TYPE_META } from "@/lib/reuse-shared";
import { formatBanglaCurrency, formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/services/reuse/my-listings")({
  head: () => ({
    meta: [
      { title: "আমার বিজ্ঞাপন — KHIJIRION Reuse" },
      { name: "description", content: "আপনার দেওয়া ব্যবহৃত পণ্যের বিজ্ঞাপন পরিচালনা করুন।" },
      { property: "og:title", content: "আমার বিজ্ঞাপন — KHIJIRION Reuse" },
      { property: "og:description", content: "নিজের বিজ্ঞাপন সম্পাদনা, মুছে ফেলা ও অবস্থা হালনাগাদ করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyReuseListings,
});

function MyReuseListings() {
  const { isAuthenticated, loading, user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useMyReuseListings(user?.id);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<unknown>, message: string) {
    setBusy(id);
    try {
      await fn();
      toast.success(message);
      await qc.invalidateQueries({ queryKey: ["reuse"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">লোড হচ্ছে…</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold">লগইন প্রয়োজন</h1>
        <p className="mt-2 text-sm text-muted-foreground">নিজের বিজ্ঞাপন দেখতে লগইন করুন।</p>
        <Button asChild className="mt-5"><Link to="/auth">লগইন করুন</Link></Button>
      </div>
    );
  }

  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/services/reuse">
            <ArrowLeft className="mr-2 h-4 w-4" /> সব পণ্য
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/services/reuse/create">
            <PlusCircle className="mr-2 h-4 w-4" /> নতুন বিজ্ঞাপন
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold sm:text-3xl">আমার বিজ্ঞাপন</h1>

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">লোড হচ্ছে…</p>
      ) : rows.length === 0 ? (
        <Card className="border-border/60 bg-card/70 p-10 text-center text-muted-foreground backdrop-blur-xl">
          আপনি এখনো কোনো বিজ্ঞাপন দেননি।
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((item) => {
            const status = REUSE_STATUS_META[item.status];
            const type = REUSE_TYPE_META[item.listing_type];
            const isBusy = busy === item.id;
            return (
              <Card key={item.id} className="border-border/60 bg-card/70 backdrop-blur-xl">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                  <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-40">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${type.className}`}>
                        {type.label}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold">{item.title}</h2>
                    <p className="text-sm text-primary">
                      {item.listing_type === "donation" || item.price === null
                        ? "বিনামূল্যে"
                        : formatBanglaCurrency(Number(item.price))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.category} • {item.location} • {formatBanglaDate(item.created_at)}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/services/reuse/$listingId" params={{ listingId: item.id }}>বিস্তারিত</Link>
                      </Button>
                      {item.status !== "sold" && item.listing_type === "sale" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => run(item.id, () => setMyReuseStatus({ data: { id: item.id, status: "sold" } }), "বিক্রি হয়েছে হিসেবে চিহ্নিত")}
                        >
                          বিক্রি হয়েছে
                        </Button>
                      )}
                      {item.status !== "donated" && item.listing_type === "donation" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => run(item.id, () => setMyReuseStatus({ data: { id: item.id, status: "donated" } }), "দান করা হয়েছে হিসেবে চিহ্নিত")}
                        >
                          দান করা হয়েছে
                        </Button>
                      )}
                      {item.status !== "hidden" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => run(item.id, () => setMyReuseStatus({ data: { id: item.id, status: "hidden" } }), "বিজ্ঞাপন লুকানো হয়েছে")}
                        >
                          লুকান
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => run(item.id, () => setMyReuseStatus({ data: { id: item.id, status: "pending" } }), "পুনরায় পর্যালোচনার জন্য পাঠানো হয়েছে")}
                        >
                          পুনরায় চালু
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isBusy}
                        onClick={() => {
                          if (!confirm("বিজ্ঞাপনটি মুছে ফেলবেন?")) return;
                          void run(item.id, () => deleteMyReuseListing({ data: { id: item.id } }), "বিজ্ঞাপন মুছে ফেলা হয়েছে");
                        }}
                      >
                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
