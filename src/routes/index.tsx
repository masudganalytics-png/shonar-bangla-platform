import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, FileSignature, FileText, Scale, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import logoAsset from "@/assets/ukhiya-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "আপনার বিদ্যুৎ বিল কি স্বাভাবিক? — উখিয়া বিদ্যুৎ বিল" },
      {
        name: "description",
        content:
          "একই এলাকার গড় তথ্যের ভিত্তিতে আপনার বিদ্যুৎ বিল তুলনা করুন এবং আনুমানিক বিল হিসাব করুন।",
      },
      { property: "og:title", content: "আপনার বিদ্যুৎ বিল কি স্বাভাবিক?" },
      {
        property: "og:description",
        content: "একই এলাকার গড় তথ্যের ভিত্তিতে আপনার বিদ্যুৎ বিল তুলনা করুন।",
      },
    ],
  }),
  component: HomePage,
});

const QUICK_ACTIONS = [
  {
    to: "/bills/new" as const,
    icon: FileText,
    title: "যাচাই",
    desc: "আপনার মাসিক বিদ্যুৎ বিলের তথ্য যাচাই ও সংরক্ষণ করুন।",
    primary: true,
  },
  {
    to: "/compare" as const,
    icon: Scale,
    title: "বিল তুলনা করুন",
    desc: "এলাকার গড়ের সাথে আপনার বিল তুলনা করুন।",
  },
  {
    to: "/calculator" as const,
    icon: Calculator,
    title: "বিল ক্যালকুলেটর",
    desc: "ইউনিট থেকে আনুমানিক বিল হিসাব করুন।",
  },
  {
    to: "/isp" as const,
    icon: Wifi,
    title: "এরিয়াভিত্তিক ওয়াইফাই সেবা",
    desc: "আপনার এলাকার ISP তালিকা ও যোগাযোগ নম্বর।",
  },
  {
    to: "/cv-builder" as const,
    icon: FileSignature,
    title: "প্রফেশনাল সিভি তৈরি করুন",
    desc: "সরকারি • এনজিও • ব্যাংক • প্রাইভেট চাকরির জন্য",
  },
];

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-95" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white sm:px-6 sm:py-24">
          <img
            src={logoAsset.url}
            alt="উখিয়া বিদ্যুৎ বিল"
            className="mx-auto mb-6 h-24 w-auto drop-shadow-2xl sm:h-32"
          />
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            আপনার বিদ্যুৎ বিল কি স্বাভাবিক?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/90 sm:text-lg">
            একই এলাকার গড় তথ্যের ভিত্তিতে আপনার বিল তুলনা করুন।
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 bg-white px-6 text-primary hover:bg-white/90">
              <Link to={isAuthenticated ? "/bills/new" : "/auth"} search={isAuthenticated ? undefined : { mode: "register", redirect: "/bills/new" }}>
                যাচাই <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to={isAuthenticated ? "/compare" : "/auth"} search={isAuthenticated ? undefined : { mode: "login", redirect: "/compare" }}>
                বিল তুলনা করুন
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/calculator">বিল ক্যালকুলেটর</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/isp">
                <Wifi className="mr-2 h-4 w-4" /> এরিয়াভিত্তিক ওয়াইফাই সেবা
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, icon: Icon, title, desc, primary }) => (
            <Link key={to} to={to} className="group">
              <Card className={`h-full p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] ${primary ? "border-primary/40" : ""}`}>
                <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${primary ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
