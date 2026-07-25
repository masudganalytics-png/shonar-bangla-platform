import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Flame, Droplets, Wifi, Smartphone, Code2 } from "lucide-react";

export const Route = createFileRoute("/utilities")({
  head: () => ({
    meta: [
      { title: "ভবিষ্যৎ পরিষেবা — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "গ্যাস, পানি, ইন্টারনেট বিল ও অ্যান্ড্রয়েড অ্যাপ API — শীঘ্রই আসছে।" },
      { property: "og:title", content: "ভবিষ্যৎ পরিষেবা" },
      { property: "og:description", content: "গ্যাস, পানি, ইন্টারনেট বিল ও অ্যান্ড্রয়েড অ্যাপ — শীঘ্রই।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UtilitiesPage,
});

const UTILITIES = [
  { icon: Zap, title: "বিদ্যুৎ বিল", desc: "PDB, REB, DPDC, DESCO সহ সকল বিতরণ কোম্পানি", status: "live" as const },
  { icon: Flame, title: "গ্যাস বিল", desc: "তিতাস, বাখরাবাদ, জালালাবাদ ও অন্যান্য", status: "soon" as const },
  { icon: Droplets, title: "পানি বিল", desc: "স্থানীয় ওয়াসা ও পৌরসভা", status: "soon" as const },
  { icon: Wifi, title: "ইন্টারনেট বিল", desc: "ISP তুলনা ও মাসিক ট্র্যাকিং", status: "soon" as const },
  { icon: Smartphone, title: "অ্যান্ড্রয়েড অ্যাপ", desc: "অফলাইন সাপোর্ট সহ নেটিভ অ্যাপ", status: "soon" as const },
  { icon: Code2, title: "পাবলিক API", desc: "তৃতীয় পক্ষের ডেভেলপারদের জন্য উন্মুক্ত REST API", status: "live" as const },
];

function UtilitiesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">ভবিষ্যৎ পরিষেবা</h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            শুধু বিদ্যুৎ নয় — আসছে সব ধরনের ইউটিলিটি বিল ট্র্যাকিং, অ্যান্ড্রয়েড অ্যাপ, ও ডেভেলপার-বান্ধব API।
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UTILITIES.map(({ icon: Icon, title, desc, status }) => (
            <Card key={title} className="group relative overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={status === "live" ? "default" : "secondary"}>
                    {status === "live" ? "সচল" : "শীঘ্রই"}
                  </Badge>
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">ডেভেলপার API</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            অ্যান্ড্রয়েড অ্যাপ বা তৃতীয় পক্ষের ইন্টিগ্রেশনের জন্য উন্মুক্ত এন্ডপয়েন্ট (অথেনটিকেশন ছাড়া, শুধু পাবলিক ডেটা)।
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="rounded-lg bg-muted/40 p-3 font-mono">
              <span className="text-secondary">GET</span> /api/public/announcements?category=outage&amp;limit=20
            </li>
            <li className="rounded-lg bg-muted/40 p-3 font-mono">
              <span className="text-secondary">GET</span> /api/public/stats
            </li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
