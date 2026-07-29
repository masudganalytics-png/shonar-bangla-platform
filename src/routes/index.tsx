import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, FileSignature, FileText, GraduationCap, HardHat, Scale, Store, Wifi, Scale as ScaleIcon, Droplet, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import logoAsset from "@/assets/ukhiya-logo.png.asset.json";
import { EmergencyBloodBanner } from "@/components/blood/EmergencyBloodBanner";
import { UniversalSearch } from "@/components/home/UniversalSearch";
import { ExploreServices } from "@/components/home/ExploreServices";
import { LatestUpdates } from "@/components/home/LatestUpdates";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { TodaysHighlights } from "@/components/home/TodaysHighlights";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "উখিয়ার সব প্রয়োজনীয় সেবা, এক জায়গায় — উখিয়া সেবা" },
      {
        name: "description",
        content:
          "বিদ্যুৎ বিল, গ্যাস বিল, পানি বিল, মোবাইল রিচার্জ, প্রয়োজনীয় সরকারি ওয়েবসাইট, স্থানীয় সেবা, চাকরির খবর, টেন্ডার, জরুরি নম্বর এবং আরও অনেক কিছু—সব এক প্ল্যাটফর্মে।",
      },
      { property: "og:title", content: "উখিয়ার সব প্রয়োজনীয় সেবা, এক জায়গায়" },
      {
        property: "og:description",
        content: "বিদ্যুৎ বিল, গ্যাস বিল, পানি বিল, মোবাইল রিচার্জ, সরকারি ওয়েবসাইট, স্থানীয় সেবা, চাকরির খবর, টেন্ডার, জরুরি নম্বর—সব এক প্ল্যাটফর্মে।",
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
  {
    to: "/workers" as const,
    icon: HardHat,
    title: "👷 কাজের লোক খুঁজুন",
    desc: "আপনার এলাকার দক্ষ কাজের লোক সহজে খুঁজুন।",
  },
  {
    to: "/teachers" as const,
    icon: GraduationCap,
    title: "🎓 উখিয়ার শিক্ষক খুঁজুন",
    desc: "আপনার এলাকার যাচাইকৃত শিক্ষক ও টিউটর খুঁজুন।",
  },
  {
    to: "/business" as const,
    icon: Store,
    title: "🏪 স্থানীয় ব্যবসা",
    desc: "উখিয়ার সব দোকান ও সেবা এক জায়গায়।",
  },
  {
    to: "/legal" as const,
    icon: ScaleIcon,
    title: "⚖️ আইনি সহায়তা",
    desc: "যাচাইকৃত অ্যাডভোকেটদের সাথে WhatsApp-এ পরামর্শ নিন।",
  },
  {
    to: "/blood-donors" as const,
    icon: Droplet,
    title: "❤️ রক্তদাতা খুঁজুন",
    desc: "উখিয়ার যাচাইকৃত রক্তদাতাদের সাথে সরাসরি যোগাযোগ করুন।",
  },
  {
    to: "/request-blood" as const,
    icon: Heart,
    title: "🩸 রক্তের অনুরোধ",
    desc: "রোগীর জন্য জরুরি রক্তের অনুরোধ পাঠান।",
  },
];

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <EmergencyBloodBanner />
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-95" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white sm:px-6 sm:py-24">
          <img
            src={logoAsset.url}
            alt="উখিয়া সেবা"
            className="mx-auto mb-6 h-24 w-auto drop-shadow-2xl sm:h-32"
          />
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            উখিয়ার সব প্রয়োজনীয় সেবা, এক জায়গায়
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/90 sm:text-lg">
            বিদ্যুৎ বিল, গ্যাস বিল, পানি বিল, মোবাইল রিচার্জ, প্রয়োজনীয় সরকারি ওয়েবসাইট, স্থানীয় সেবা, চাকরির খবর, টেন্ডার, জরুরি নম্বর এবং আরও অনেক কিছু—সব এক প্ল্যাটফর্মে।
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
            <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/workers">
                <HardHat className="mr-2 h-4 w-4" /> কাজের লোক খুঁজুন
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/cv-builder">
                <FileSignature className="mr-2 h-4 w-4" /> প্রফেশনাল সিভি তৈরি করুন
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/teachers">
                <GraduationCap className="mr-2 h-4 w-4" /> উখিয়ার শিক্ষক খুঁজুন
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/business">
                <Store className="mr-2 h-4 w-4" /> স্থানীয় ব্যবসা
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/legal">
                <ScaleIcon className="mr-2 h-4 w-4" /> আইনি সহায়তা
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <UniversalSearch />
      <ExploreServices />
      <LatestUpdates />
      <FeaturedServices />
      <TodaysHighlights />

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
