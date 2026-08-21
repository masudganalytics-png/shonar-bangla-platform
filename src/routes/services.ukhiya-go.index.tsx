import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Bike, Package, Truck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


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
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button asChild size="lg" className="rounded-full px-6 shadow-sm transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Link to="/services/ukhiya-go/driver/register">
              <Car className="mr-2 h-4 w-4" />
              🚗 চালক হিসেবে নিবন্ধন করুন
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            গাড়ি আছে? আপনার প্রোফাইল যুক্ত করে আয় শুরু করুন।
          </span>
        </div>
      </header>


      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICE_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="h-full transition-shadow hover:shadow-md">
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
                  <Clock className="h-3 w-3" />
                  শীঘ্রই আসছে
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <p className="mt-10 rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
        এই সেবাটি বর্তমানে প্রস্তুতির পর্যায়ে রয়েছে। বুকিং সুবিধা পরবর্তী ধাপে চালু হবে।
      </p>
    </div>
  );
}
