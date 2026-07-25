import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MapPin, AlertCircle, Zap, FileWarning, Calculator, HelpCircle, ChevronRight, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/helpline")({
  head: () => ({
    meta: [
      { title: "অভিযোগ কেন্দ্র ও হেল্পলাইন — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "উখিয়া পল্লী বিদ্যুতের সরকারী অভিযোগ কেন্দ্রের ফোন নম্বর এবং বিদ্যুৎ সংক্রান্ত সাধারণ সমস্যার সমাধান নির্দেশিকা।" },
      { property: "og:title", content: "অভিযোগ কেন্দ্র ও হেল্পলাইন — উখিয়া বিদ্যুৎ বিল" },
      { property: "og:description", content: "উখিয়া পল্লী বিদ্যুতের সরকারী অভিযোগ কেন্দ্রের ফোন নম্বর ও সমাধান নির্দেশিকা।" },
    ],
  }),
  component: HelplinePage,
});

type Center = { name: string; phone: string };
const CENTERS: Center[] = [
  { name: "উখিয়া জোনাল অফিস", phone: "01769-401054" },
  { name: "উখিয়া জোনাল অভিযোগ কেন্দ্র", phone: "01769-401054" },
  { name: "মরিচ্যা অভিযোগ কেন্দ্র", phone: "01769-401055" },
  { name: "পালংখালী অভিযোগ কেন্দ্র", phone: "01769-401056" },
  { name: "নিদানিয়া অভিযোগ কেন্দ্র", phone: "01769-402351" },
  { name: "ভালুকিয়া অভিযোগ কেন্দ্র", phone: "01714-105874" },
  { name: "রামু সেনানিবাস এরিয়া অফিস", phone: "01769-407245" },
];

type Issue = {
  id: string;
  icon: React.ElementType;
  title: string;
  short: string;
  steps: string[];
  docs: string[];
  suggestCenters?: string[]; // filter which centers to highlight
};

const ISSUES: Issue[] = [
  {
    id: "high_bill",
    icon: FileWarning,
    title: "অতিরিক্ত বিল এসেছে",
    short: "প্রকৃত ব্যবহারের চেয়ে বিল অনেক বেশি মনে হচ্ছে।",
    steps: [
      "মিটারের বর্তমান রিডিং লিখে রাখুন এবং বিলের সাথে মিলিয়ে দেখুন।",
      "গত ৩ মাসের বিল/ইউনিট তুলনা করুন — হঠাৎ বৃদ্ধি কি না দেখুন।",
      "আপনার এলাকার ইউনিয়ন ভিত্তিক গড়ের সাথে তুলনা করুন (তুলনা পেজ)।",
      "সমস্যা থাকলে বিলের ছবিসহ নিকটস্থ অভিযোগ কেন্দ্রে ফোন দিন অথবা এই অ্যাপে অভিযোগ জমা দিন।",
    ],
    docs: ["বিলের কপি", "মিটারের বর্তমান রিডিংয়ের ছবি", "গ্রাহক নম্বর / মিটার নম্বর"],
  },
  {
    id: "wrong_reading",
    icon: Calculator,
    title: "ভুল রিডিং / ভুল হিসাব",
    short: "মিটার রিডিং বা বিলের হিসাবে গরমিল।",
    steps: [
      "মিটারের প্রকৃত রিডিং তুলে বিলে উল্লেখিত রিডিংয়ের সাথে মিলিয়ে নিন।",
      "পার্থক্য থাকলে ছবি তুলে রাখুন (তারিখসহ)।",
      "নিকটস্থ অভিযোগ কেন্দ্রে ফোন করে অভিযোগ নথিভুক্ত করুন — অভিযোগ নম্বর সংগ্রহ করুন।",
      "প্রয়োজনে অ্যাপে অভিযোগ জমা দিন যেন রেকর্ড থাকে।",
    ],
    docs: ["বিলের কপি", "মিটার রিডিংয়ের ছবি (তারিখসহ)"],
  },
  {
    id: "no_power",
    icon: Zap,
    title: "বিদ্যুৎ নেই / লোডশেডিং",
    short: "এলাকায় বিদ্যুৎ সরবরাহ বন্ধ।",
    steps: [
      "নিশ্চিত হোন সমস্যা শুধু আপনার বাড়িতে না — প্রতিবেশীদের জিজ্ঞাসা করুন।",
      "মেইন সুইচ ও সার্কিট ব্রেকার চেক করুন।",
      "এলাকাভিত্তিক সমস্যা হলে নিকটস্থ অভিযোগ কেন্দ্রে ফোন দিন।",
    ],
    docs: ["গ্রাহক নম্বর", "ঠিকানা / গ্রাম-ইউনিয়ন"],
  },
  {
    id: "meter_issue",
    icon: AlertCircle,
    title: "মিটার সমস্যা (নষ্ট / জ্বলছে না)",
    short: "মিটার কাজ করছে না বা ডিসপ্লে বন্ধ।",
    steps: [
      "মিটারের অবস্থার ছবি তুলে রাখুন।",
      "নিকটস্থ অভিযোগ কেন্দ্রে ফোন করে টেকনিশিয়ান পাঠাতে অনুরোধ করুন।",
      "নতুন মিটার প্রয়োজন হলে জোনাল অফিসে যোগাযোগ করুন।",
    ],
    docs: ["গ্রাহক নম্বর", "মিটার নম্বর", "মিটারের ছবি"],
  },
  {
    id: "new_connection",
    icon: HelpCircle,
    title: "নতুন সংযোগ / নাম পরিবর্তন",
    short: "নতুন সংযোগ, স্থানান্তর বা মালিকানা পরিবর্তন।",
    steps: [
      "জাতীয় পরিচয়পত্র, জমির কাগজ ও ছবি প্রস্তুত রাখুন।",
      "উখিয়া জোনাল অফিসে সরাসরি যোগাযোগ করুন।",
      "নির্ধারিত ফি জমা দিয়ে আবেদন ফর্ম পূরণ করুন।",
    ],
    docs: ["জাতীয় পরিচয়পত্র", "জমির দলিল/হোল্ডিং কর", "পাসপোর্ট সাইজ ছবি"],
  },
];

function HelplinePage() {
  const [active, setActive] = useState<string>(ISSUES[0].id);
  const current = ISSUES.find((i) => i.id === active) ?? ISSUES[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">অভিযোগ কেন্দ্র ও সমাধান নির্দেশিকা</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          উখিয়া পল্লী বিদ্যুৎ সমিতির সরকারী অভিযোগ কেন্দ্রের নম্বর এবং সাধারণ সমস্যার সমাধান।
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left index */}
        <Card className="h-fit p-2 lg:sticky lg:top-20">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            অভিযোগের ধরন
          </div>
          <ul className="space-y-1">
            {ISSUES.map((i) => {
              const Icon = i.icon;
              const isActive = active === i.id;
              return (
                <li key={i.id}>
                  <button
                    onClick={() => setActive(i.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{i.title}</span>
                    <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", isActive && "rotate-90")} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Right content */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <current.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{current.title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{current.short}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="mb-2 text-sm font-semibold">সমাধানের ধাপ</div>
              <ol className="space-y-2 text-sm">
                {current.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-lg border border-border/60 p-4">
              <div className="mb-2 text-sm font-semibold">যে কাগজপত্র/তথ্য লাগবে</div>
              <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                {current.docs.map((d) => (
                  <li key={d} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href="tel:01769-401054">
                  <Phone className="mr-1.5 h-4 w-4" /> জোনাল অফিসে ফোন
                </a>
              </Button>
            </div>

          </Card>

          {/* Helpline directory */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">সরকারী অভিযোগ কেন্দ্রের ফোন নম্বর</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CENTERS.map((c) => (
                <a
                  key={c.name + c.phone}
                  href={`tel:${c.phone}`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lg)]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">২৪/৭ অভিযোগ সেবা</div>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="tabular-nums">{c.phone}</span>
                  </div>
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              * নম্বরগুলো উখিয়া পল্লী বিদ্যুৎ সমিতি কর্তৃক প্রকাশিত। জরুরি প্রয়োজনে সরাসরি ফোন দিন।
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
