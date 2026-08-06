import { Link } from "@tanstack/react-router";
import { ArrowRight, Plane, Briefcase, BookUser, Landmark, Banknote, Users } from "lucide-react";

const ITEMS = [
  { icon: Plane, title: "ভিসা তথ্য", desc: "দেশভিত্তিক ভিসা প্রক্রিয়া ও প্রয়োজনীয় কাগজপত্র।" },
  { icon: Briefcase, title: "বিদেশে চাকরি", desc: "প্রবাসে কাজের সুযোগ ও অভিজ্ঞতা শেয়ার।" },
  { icon: BookUser, title: "পাসপোর্ট সহায়তা", desc: "নতুন পাসপোর্ট ও নবায়ন সংক্রান্ত দিকনির্দেশনা।" },
  { icon: Landmark, title: "দূতাবাস তথ্য", desc: "বাংলাদেশ দূতাবাসের ঠিকানা ও হেল্পলাইন।" },
  { icon: Banknote, title: "রেমিট্যান্স", desc: "বৈধ পথে টাকা পাঠানোর তথ্য ও প্রণোদনা।" },
  { icon: Users, title: "প্রবাসী কমিউনিটি", desc: "উখিয়ার প্রবাসীদের তালিকা, বার্তা ও দেশে ফেরার তথ্য।" },
];

export function ProbashiServices() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="প্রবাসী সেবা">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <div className="hairline-gold" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">প্রবাসী সেবা</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">উখিয়া ও কক্সবাজারের প্রবাসী পরিবারের জন্য</p>
        </div>
        <Link to="/probashi" className="shrink-0 text-xs font-semibold text-primary hover:underline">প্রবাসী কর্নার</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {ITEMS.map((it) => (
          <div key={it.title} className="gold-hover flex h-full flex-col rounded-2xl border bg-card p-5 shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-border/60">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold sm:text-base">{it.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{it.desc}</p>
          </div>
        ))}
      </div>

      <Link to="/probashi" className="mt-6 inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10">
        প্রবাসী কর্নারে যান <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
