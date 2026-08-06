import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, FileSignature, FileText, GraduationCap, HardHat, Scale, Store, Wifi, Scale as ScaleIcon, Droplet, Heart, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import logoAsset from "@/assets/khijirion-logo.png.asset.json";
import { EmergencyBloodBanner } from "@/components/blood/EmergencyBloodBanner";
import { UniversalSearch } from "@/components/home/UniversalSearch";
import { CoreServices } from "@/components/home/CoreServices";
import { ExploreServices } from "@/components/home/ExploreServices";
import { LatestUpdates } from "@/components/home/LatestUpdates";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { FeaturedTeachers } from "@/components/home/FeaturedTeachers";
import { InternetProviders } from "@/components/home/InternetProviders";
import { ProbashiServices } from "@/components/home/ProbashiServices";
import { CommunityUpdates } from "@/components/home/CommunityUpdates";
import { TodaysHighlights } from "@/components/home/TodaysHighlights";
import { LiveExchangeRates } from "@/components/home/LiveExchangeRates";

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
    to: "/probashi" as const,
    icon: Globe2,
    title: "🌍 প্রবাসী কর্নার",
    desc: "উখিয়ার প্রবাসীদের তালিকা, বার্তা ও দেশে ফেরার তথ্য।",
  },
  {
    to: "/request-blood" as const,
    icon: Heart,
    title: "🩸 রক্তের অনুরোধ",
    desc: "রোগীর জন্য জরুরি রক্তের অনুরোধ পাঠান।",
  },
];

const HERO_LINKS = [
  { to: "/isp" as const, icon: Wifi, label: "ওয়াইফাই সেবা" },
  { to: "/workers" as const, icon: HardHat, label: "কাজের লোক" },
  { to: "/cv-builder" as const, icon: FileSignature, label: "সিভি তৈরি" },
  { to: "/teachers" as const, icon: GraduationCap, label: "শিক্ষক খুঁজুন" },
  { to: "/business" as const, icon: Store, label: "স্থানীয় ব্যবসা" },
  { to: "/legal" as const, icon: ScaleIcon, label: "আইনি সহায়তা" },
];

const HERO_PILLARS = [
  { icon: Droplet, label: "রক্তসেবা" },
  { icon: Store, label: "ব্যবসা" },
  { icon: Globe2, label: "প্রবাসী" },
];

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <EmergencyBloodBanner />
      <LiveExchangeRates />

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div
          className="absolute inset-0 -z-10 opacity-[0.35]"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 80% 20%, color-mix(in oklab, var(--brand-gold) 22%, transparent) 0%, transparent 70%), radial-gradient(40% 40% at 10% 80%, color-mix(in oklab, var(--brand-red) 18%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto grid min-h-[76vh] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 backdrop-blur">
              Everything Local, One Place.
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
              উখিয়ার সব প্রয়োজনীয় সেবা,{" "}
              <span className="text-gradient-gold">এক জায়গায়</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
              বিদ্যুৎ বিল, গ্যাস বিল, পানি বিল, মোবাইল রিচার্জ, প্রয়োজনীয় সরকারি ওয়েবসাইট, স্থানীয় সেবা, চাকরির খবর, টেন্ডার, জরুরি নম্বর এবং আরও অনেক কিছু—সব এক প্ল্যাটফর্মে।
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full px-7 text-sm font-semibold shadow-[var(--shadow-glow)]"
                style={{ background: "var(--gradient-gold)", color: "oklch(0.16 0.01 80)" }}
              >
                <Link to={isAuthenticated ? "/bills/new" : "/auth"} search={isAuthenticated ? undefined : { mode: "register", redirect: "/bills/new" }}>
                  যাচাই <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/25 bg-white/5 px-6 text-sm text-white backdrop-blur hover:bg-white/12 hover:text-white">
                <Link to={isAuthenticated ? "/compare" : "/auth"} search={isAuthenticated ? undefined : { mode: "login", redirect: "/compare" }}>
                  বিল তুলনা করুন
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/25 bg-white/5 px-6 text-sm text-white backdrop-blur hover:bg-white/12 hover:text-white">
                <Link to="/calculator">বিল ক্যালকুলেটর</Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {HERO_LINKS.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/75 backdrop-blur transition-colors hover:border-[color-mix(in_oklab,var(--brand-gold)_55%,transparent)] hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute inset-8 -z-10 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--brand-gold) 30%, transparent) 0%, transparent 70%)" }} aria-hidden />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-8">
              <img
                src={logoAsset.url}
                alt="KHIJIRION — Everything Local, One Place."
                className="mx-auto h-44 w-auto object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.55)] sm:h-56"
                loading="eager"
              />
              <div className="mt-6 grid grid-cols-3 gap-3">
                {HERO_PILLARS.map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <Icon className="mx-auto h-4 w-4 text-[color-mix(in_oklab,var(--brand-gold)_80%,white)]" />
                    <div className="mt-1.5 text-[11px] font-medium text-white/70">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <UniversalSearch />
      <ExploreServices />
      <LatestUpdates />
      <FeaturedServices />
      <TodaysHighlights />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-7">
          <div className="hairline-gold" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">দ্রুত সেবা</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">সবচেয়ে বেশি ব্যবহৃত সেবাগুলো এক নজরে</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, icon: Icon, title, desc, primary }) => (
            <Link key={to} to={to} className="group">
              <Card className={`gold-hover h-full rounded-2xl p-6 ${primary ? "border-primary/45 bg-primary/[0.04]" : ""}`}>
                <div
                  className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${primary ? "text-[oklch(0.16_0.01_80)]" : "bg-primary/10 text-primary"}`}
                  style={primary ? { background: "var(--gradient-gold)" } : undefined}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

