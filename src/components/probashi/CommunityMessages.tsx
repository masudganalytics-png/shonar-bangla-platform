import { Link } from "@tanstack/react-router";
import { Cake, MessageSquareQuote, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProbashiPhoto } from "@/components/probashi/ProbashiPhoto";
import {
  countryLabel,
  dailyRotationIndex,
  isBirthdayToday,
  probashiProfilePath,
  type ProbashiProfile,
} from "@/lib/probashi-shared";

/** Rotates a handful of community messages once per day (Dhaka time). */
export function CommunityMessages({ list }: { list: ProbashiProfile[] }) {
  const withMessage = list.filter((p) => (p.community_message ?? "").trim().length > 0);
  if (withMessage.length === 0) return null;

  const start = dailyRotationIndex(withMessage.length);
  const picked = Array.from({ length: Math.min(3, withMessage.length) }, (_, i) =>
    withMessage[(start + i) % withMessage.length]!,
  );

  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <MessageSquareQuote className="h-5 w-5 text-primary" /> প্রবাসীদের বার্তা
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {picked.map((p) => (
          <Link key={p.id} to={probashiProfilePath(p)}>
            <Card className="h-full border-border/60 bg-card/70 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
              <p className="text-sm italic leading-relaxed">“{p.community_message}”</p>
              <div className="mt-4 flex items-center gap-2.5">
                <ProbashiPhoto url={p.photo_url} alt={p.full_name} className="h-9 w-9 rounded-full" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{countryLabel(p.country)}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function BirthdayStrip({ list }: { list: ProbashiProfile[] }) {
  const today = list.filter((p) => isBirthdayToday(p.birth_date));
  if (today.length === 0) return null;

  return (
    <Card className="border-pink-500/30 bg-pink-500/5 p-5 backdrop-blur-xl">
      <h2 className="flex items-center gap-2 text-base font-bold text-pink-600 dark:text-pink-400">
        <Cake className="h-5 w-5" /> আজকের জন্মদিন
      </h2>
      <div className="mt-3 flex flex-wrap gap-3">
        {today.map((p) => (
          <Link
            key={p.id}
            to={probashiProfilePath(p)}
            className="flex items-center gap-2.5 rounded-full border border-pink-500/30 bg-background/70 px-3 py-1.5"
          >
            <ProbashiPhoto url={p.photo_url} alt={p.full_name} className="h-8 w-8 rounded-full" />
            <span className="text-sm font-medium">{p.full_name}</span>
            <PartyPopper className="h-4 w-4 text-pink-500" />
          </Link>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">শুভ জন্মদিন! উখিয়া সেবা পরিবারের পক্ষ থেকে শুভেচ্ছা।</p>
    </Card>
  );
}
