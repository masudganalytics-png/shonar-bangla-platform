import { Link } from "@tanstack/react-router";
import { ArrowRight, Droplet, Briefcase, GraduationCap, Store, Scale, Wifi, FileText, Calculator } from "lucide-react";

const SERVICES = [
  { to: "/blood-donors" as const, icon: Droplet, title: "রক্তদাতা", desc: "যাচাইকৃত রক্তদাতাদের সাথে যোগাযোগ", tone: "text-destructive bg-destructive/10" },
  { to: "/teachers/tuitions" as const, icon: Briefcase, title: "চাকরি ও টিউশন", desc: "শিক্ষক নিয়োগ ও টিউশন অনুরোধ", tone: "text-primary bg-primary/10" },
  { to: "/teachers" as const, icon: GraduationCap, title: "টিউশন", desc: "যাচাইকৃত শিক্ষক ও টিউটর খুঁজুন", tone: "text-primary bg-primary/10" },
  { to: "/business" as const, icon: Store, title: "স্থানীয় ব্যবসা", desc: "উখিয়ার সব দোকান ও সেবা", tone: "text-primary bg-primary/10" },
  { to: "/legal" as const, icon: Scale, title: "আইনি সহায়তা", desc: "যাচাইকৃত অ্যাডভোকেট পরামর্শ", tone: "text-primary bg-primary/10" },
  { to: "/isp" as const, icon: Wifi, title: "ওয়াইফাই সেবা", desc: "এরিয়াভিত্তিক ISP তালিকা", tone: "text-primary bg-primary/10" },
  { to: "/bills/new" as const, icon: FileText, title: "বিল সেবা", desc: "বিদ্যুৎ বিল যাচাই ও সংরক্ষণ", tone: "text-primary bg-primary/10" },
  { to: "/calculator" as const, icon: Calculator, title: "ক্যালকুলেটর", desc: "ইউনিট থেকে বিল হিসাব", tone: "text-primary bg-primary/10" },
];

export function ExploreServices() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="সেবাসমূহ">
      <div className="mb-7">
        <div className="hairline-gold" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">সেবা এক্সপ্লোর করুন</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">আপনার প্রয়োজন অনুযায়ী সেবা বেছে নিন</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {SERVICES.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="gold-hover group flex h-full flex-col rounded-2xl border bg-card p-4 shadow-[var(--shadow-sm)] sm:p-5"
          >
            <div className={`mb-3 grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ring-border/60 ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold sm:text-base">{s.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{s.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100">
              দেখুন <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
