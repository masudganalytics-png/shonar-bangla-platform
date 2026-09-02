import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Car, Bike, Package, Truck, Search, Ticket, LayoutDashboard, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

function WhatsAppBookingButton() {
  return (
    <Button
      asChild
      size="lg"
      className="h-12 rounded-full bg-[#25D366] px-6 text-white shadow-sm transition-shadow hover:bg-[#128C7E] hover:shadow-md"
    >
      <a
        href="https://wa.me/8801821818183?text=%E0%A6%86%E0%A6%B8%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20UkhiyaGo%20%E0%A6%A5%E0%A7%87%E0%A6%95%E0%A7%87%20%E0%A6%8F%E0%A6%95%E0%A6%9F%E0%A6%BF%20%E0%A6%97%E0%A6%BE%E0%A7%9C%E0%A6%BF%20%E0%A6%AC%E0%A7%81%E0%A6%95%20%E0%A6%95%E0%A6%B0%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4"
        target="_blank"
        rel="noreferrer"
      >
        <svg
          className="mr-2 h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp এ বুকিং করুন
      </a>
    </Button>
  );
}

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
        <WhatsAppBookingButton />
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
        <WhatsAppBookingButton />
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
      <WhatsAppBookingButton />
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
