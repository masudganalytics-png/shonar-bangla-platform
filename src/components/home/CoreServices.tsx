import { Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Store, Wifi, Globe2, Users } from "lucide-react";

const CORE = [
  {
    to: "/teachers" as const,
    icon: GraduationCap,
    title: "🎓 শিক্ষক খুঁজুন",
    desc: "আপনার এলাকার যাচাইকৃত শিক্ষক ও টিউটর খুঁজুন, সরাসরি যোগাযোগ করুন।",
    cta: "শিক্ষক দেখুন",
    featured: true,
  },
  {
    to: "/business" as const,
    icon: Store,
    title: "🏪 স্থানীয় ব্যবসা",
    desc: "উখিয়ার দোকান, সেবা ও প্রতিষ্ঠানের সম্পূর্ণ ডিরেক্টরি এক জায়গায়।",
    cta: "ব্যবসা দেখুন",
    featured: true,
  },
  {
    to: "/isp" as const,
    icon: Wifi,
    title: "📶 ওয়াইফাই সেবা",
    desc: "এলাকাভিত্তিক ইন্টারনেট সেবাদাতা, প্যাকেজ ও যোগাযোগ নম্বর তুলনা করুন।",
    cta: "প্রোভাইডার দেখুন",
  },
  {
    to: "/probashi" as const,
    icon: Globe2,
    title: "🌍 প্রবাসী সেবা",
    desc: "ভিসা তথ্য, বিদেশে চাকরি, পাসপোর্ট, দূতাবাস ও রেমিট্যান্স সহায়তা।",
    cta: "প্রবাসী কর্নার",
  },
  {
    to: "/community" as const,
    icon: Users,
    title: "🤝 কমিউনিটি",
    desc: "ফিড, ইভেন্ট, মসজিদ কমিটি, ক্লাব, গ্রুপ ও স্থানীয় ঘোষণা।",
    cta: "কমিউনিটিতে যান",
  },
];

export function CoreServices() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="প্রধান সেবাসমূহ">
      <div className="mb-7">
        <div className="hairline-gold" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">প্রধান সেবাসমূহ</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">খিজিরিয়নের সবচেয়ে গুরুত্বপূর্ণ পাঁচটি সেবা</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {CORE.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className={`gold-hover group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1 ${
              s.featured ? "lg:col-span-3 border-primary/40 bg-primary/[0.04]" : "lg:col-span-2"
            }`}
          >
            <div
              className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-inset ring-border/60 ${
                s.featured ? "text-[oklch(0.16_0.01_80)]" : "bg-primary/10 text-primary"
              }`}
              style={s.featured ? { background: "var(--gradient-gold)" } : undefined}
            >
              <s.icon className="h-6 w-6" />
            </div>
            <h3 className={`font-semibold ${s.featured ? "text-xl" : "text-base"}`}>{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold text-primary transition-colors group-hover:border-primary group-hover:bg-primary/10">
              {s.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
