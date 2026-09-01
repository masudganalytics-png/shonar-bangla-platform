import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Car, Bike, Package, Truck, Search, Ticket, LayoutDashboard, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/services/ukhiya-go/")({
  head: () => ({
    meta: [
      { title: "UkhiyaGo — গাড়ি, CNG, বাইক ও ফেরত ট্রিপ | KHIJIRION" },
      {
        name: "description",
        content:
          "উখিয়া ও চট্টগ্রাম-কক্সবাজার রুটে গাড়ি, CNG, বাইক, টমটম ও ফেরত ট্রিপ খুঁজুন এক জায়গায়।",
      },
      { property: "og:title", content: "UkhiyaGo by KHIJIRION" },
      {
        property: "og:description",
        content: "গাড়ি লাগবে? খুঁজুন। গাড়ি আছে? আয় করুন।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UkhiyaGoPage,
});

const SERVICE_CARDS = [
  { icon: Car, emoji: "🚗", title: "গাড়ি চাই", desc: "কার, মাইক্রোবাস ও ভাড়ার গাড়ি" },
  { icon: Truck, emoji: "🛺", title: "CNG / টমটম", desc: "স্থানীয় ও রুটভিত্তিক যাতায়াত" },
  { icon: Bike, emoji: "🏍️", title: "বাইক", desc: "দ্রুত ও সাশ্রয়ী বাইক সার্ভিস" },
  { icon: Package, emoji: "📦", title: "মালামাল পরিবহন", desc: "পিকআপ ও ট্রাকে পণ্য পরিবহন" },
] as const;

function DriverCta() {
  const { user, loading } = useAuth();

  const driverQ = useQuery({
    queryKey: ["ukhiya-go", "my-driver", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ukhiya_go_drivers")
        .select("id,verification_status")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as { id: string; verification_status: string } | null) ?? null;
    },
  });

  if (loading || (user && driverQ.isLoading)) {
    return (
      <div className="grid h-11 place-items-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const driver = driverQ.data ?? null;
  const status = driver?.verification_status;

  if (driver && status === "approved") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button asChild size="lg" variant="secondary" className="rounded-full px-6">
          <Link to="/services/ukhiya-go/driver">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            🚗 ট্রিপ পোস্ট করুন / চালক ড্যাশবোর্ড
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          আপনার চালক প্রোফাইল অনুমোদিত — এখনই ট্রিপ পোস্ট করুন।
        </span>
      </div>
    );
  }

  if (driver) {
    const msg =
      status === "pending"
        ? "আপনার চালক নিবন্ধন যাচাইয়ের অপেক্ষায় আছে। অনুমোদনের পর ট্রিপ পোস্ট করতে পারবেন।"
        : status === "rejected"
          ? "আপনার চালক নিবন্ধন অনুমোদিত হয়নি। তথ্য হালনাগাদ করে আবার চেষ্টা করুন।"
          : "আপনার চালক প্রোফাইল সাময়িকভাবে স্থগিত আছে। সহায়তার জন্য যোগাযোগ করুন।";
    return (
      <div className="flex flex-col items-center gap-2">
        <Badge variant="secondary">চালক নিবন্ধন: যাচাই প্রয়োজন</Badge>
        <p className="max-w-md text-xs text-muted-foreground">{msg}</p>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link to="/services/ukhiya-go/driver/register">নিবন্ধন তথ্য দেখুন / হালনাগাদ করুন</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button asChild size="lg" className="rounded-full px-6 shadow-sm hover:shadow-md">
        <Link to="/services/ukhiya-go/driver/register">
          <Car className="mr-2 h-4 w-4" />
          🚗 চালক হিসেবে নিবন্ধন করুন
        </Link>
      </Button>
      <span className="text-xs text-muted-foreground">
        গাড়ি আছে? আপনার প্রোফাইল যুক্ত করে আয় শুরু করুন।
      </span>
    </div>
  );
}

function UkhiyaGoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <Badge variant="secondary" className="mb-3">UkhiyaGo by KHIJIRION</Badge>
        <h1 className="text-3xl font-bold sm:text-4xl">🚗 UkhiyaGo</h1>
        <p className="mt-3 text-lg font-medium text-primary">
          গাড়ি লাগবে? খুঁজুন। গাড়ি আছে? আয় করুন।
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          উখিয়া ও চট্টগ্রাম-কক্সবাজার রুটে গাড়ি, CNG, বাইক, টমটম ও ফেরত ট্রিপ খুঁজুন এক জায়গায়।
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-6 shadow-sm hover:shadow-md">
            <Link to="/services/ukhiya-go/search">
              <Search className="mr-2 h-4 w-4" />
              🔍 গাড়ি খুঁজুন
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-6">
            <Link to="/services/ukhiya-go/bookings">
              <Ticket className="mr-2 h-4 w-4" />
              আমার বুকিং
            </Link>
          </Button>
        </div>

        <div className="mt-6">
          <DriverCta />
        </div>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICE_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.title} to="/services/ukhiya-go/search" className="block h-full">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col items-start gap-3 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold">
                    <span className="mr-1">{c.emoji}</span>
                    {c.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                  <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <Search className="h-3 w-3" />
                    ট্রিপ খুঁজুন
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
