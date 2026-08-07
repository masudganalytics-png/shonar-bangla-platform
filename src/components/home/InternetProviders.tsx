import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, MapPin, Phone, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";

const PREVIEW = [
  { area: "কক্সবাজার", name: "Hello IT", phone: "+8801719-322533", note: "লোকাল ISP" },
  { area: "কোর্টবাজার", name: "Orange Communication", phone: "01817-648888", note: "ন্যাশনওয়াইড ISP" },
  { area: "উখিয়া", name: "Mim Online", phone: "01835-401111", note: "লোকাল ISP" },
  { area: "উখিয়া ও কুতুপালং", name: "STAR NET Internet", phone: "01817-969696", note: "BTRC অনুমোদিত", approved: true },
];

export function InternetProviders() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="ইন্টারনেট সেবাদাতা">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <div className="hairline-gold" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">ইন্টারনেট সেবাদাতা</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">এলাকাভিত্তিক ISP ও যোগাযোগ নম্বর</p>
        </div>
        <Link to="/isp" className="shrink-0 text-xs font-semibold text-primary hover:underline">সব দেখুন</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PREVIEW.map((p) => (
          <Card key={p.name} className="gold-hover flex h-full flex-col rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-border/60">
              <Wifi className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold">{p.name}</h3>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {p.area}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
              {p.approved && <BadgeCheck className="h-3.5 w-3.5" />} {p.note}
            </p>
            <a href={`tel:${p.phone.replace(/[^+\d]/g, "")}`} className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              <Phone className="h-3.5 w-3.5" /> {p.phone}
            </a>
          </Card>
        ))}
      </div>

      <Link to="/isp" className="mt-6 inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10">
        এরিয়াভিত্তিক তালিকা দেখুন <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
