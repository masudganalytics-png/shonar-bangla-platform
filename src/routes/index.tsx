import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Zap, ShieldCheck, BarChart3, Bell, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "উখিয়া বিদ্যুৎ বিল — হোম" },
      {
        name: "description",
        content: "উখিয়া উপজেলার বিদ্যুৎ বিল, তুলনা, অভিযোগ ও নোটিশ — এক প্ল্যাটফর্মে।",
      },
      { property: "og:title", content: "উখিয়া বিদ্যুৎ বিল — হোম" },
      {
        property: "og:description",
        content: "স্বচ্ছ বিল, সচেতন গ্রাহক। আপনার বিদ্যুৎ বিল ট্র্যাক করুন সহজে।",
      },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  { icon: FileText, title: "বিল জমা ও ইতিহাস", desc: "প্রতি মাসের বিল সংরক্ষণ ও পরিশোধের অবস্থা।" },
  { icon: BarChart3, title: "মাসিক তুলনা", desc: "গত মাসের সাথে ব্যবহার ও খরচের তুলনামূলক বিশ্লেষণ।" },
  { icon: MessageSquare, title: "অভিযোগ দাখিল", desc: "মিটার, লোডশেডিং বা বিলিং সংক্রান্ত অভিযোগ পাঠান।" },
  { icon: Bell, title: "নোটিশ ও ঘোষণা", desc: "কর্তৃপক্ষের সর্বশেষ ঘোষণা তাৎক্ষণিক পান।" },
  { icon: ShieldCheck, title: "নিরাপদ অ্যাকাউন্ট", desc: "আধুনিক অথেনটিকেশন এবং গোপনীয়তা সুরক্ষা।" },
  { icon: Zap, title: "দ্রুত ও রেসপনসিভ", desc: "মোবাইল ও ডেস্কটপ — সব ডিভাইসে নিখুঁত অভিজ্ঞতা।" },
];

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-95"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,white/20,transparent_50%)]" aria-hidden />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center text-white">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              সরকারি ডিজিটাল সেবা
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              উখিয়া বিদ্যুৎ বিল
            </h1>
            <p className="mt-4 text-lg font-medium text-white/90 sm:text-xl">স্বচ্ছ বিল, সচেতন গ্রাহক।</p>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 sm:text-base">
              উখিয়া উপজেলার বিদ্যুৎ গ্রাহকদের জন্য বিল ব্যবস্থাপনা, তুলনামূলক বিশ্লেষণ, অভিযোগ দাখিল ও অফিসিয়াল নোটিশ — সব এক জায়গায়।
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Link to="/dashboard">
                    ড্যাশবোর্ডে যান <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    <Link to="/auth" search={{ mode: "register" }}>
                      নিবন্ধন করুন <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                    <Link to="/notices">অতিথি হিসেবে নোটিশ দেখুন</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">আপনার প্রয়োজনীয় সব ফিচার</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            আধুনিক প্ল্যাটফর্মে বিদ্যুৎ বিল ব্যবস্থাপনার সম্পূর্ণ সমাধান।
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="group p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary to-secondary p-10 text-center text-white shadow-[var(--shadow-lg)]">
            <h2 className="text-2xl font-bold sm:text-3xl">আজই যুক্ত হোন</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/90">
              বিনামূল্যে অ্যাকাউন্ট খুলুন — ইমেইল, গুগল বা অতিথি হিসেবে।
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/auth" search={{ mode: "register" }}>নিবন্ধন করুন</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                <Link to="/auth">সাইন ইন করুন</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
