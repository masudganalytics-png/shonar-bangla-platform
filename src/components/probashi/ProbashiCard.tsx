import { Link } from "@tanstack/react-router";
import { BadgeCheck, CalendarClock, Cake, MapPin, Plane } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountryFlag } from "@/components/common/CountryFlag";
import { ProbashiPhoto } from "@/components/probashi/ProbashiPhoto";
import { cn } from "@/lib/utils";
import {
  PRESENCE_META,
  calcAge,
  countryMeta,
  daysAbroad,
  daysUntilReturn,
  formatDaysRemaining,
  formatDuration,
  isBirthdayToday,
  presenceOf,
  probashiProfilePath,
  toBanglaDigits,
  type ProbashiProfile,
} from "@/lib/probashi-shared";

export function ProbashiCard({ p }: { p: ProbashiProfile }) {
  const meta = countryMeta(p.country);
  const presence = presenceOf(p);
  const presenceMeta = PRESENCE_META[presence];
  const age = calcAge(p.birth_date);
  const abroad = daysAbroad(p.moved_abroad_date);
  const remaining = daysUntilReturn(p.expected_return_date);
  const birthday = isBirthdayToday(p.birth_date);

  return (
    <Link to={probashiProfilePath(p)} className="group block">
      <Card className="relative h-full overflow-hidden border-border/60 bg-card/70 p-0 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
        <div className="flex items-start gap-4 p-5">
          <div className="relative shrink-0">
            <ProbashiPhoto
              url={p.photo_url}
              alt={p.full_name}
              className="h-16 w-16 rounded-2xl ring-2 ring-border/70 sm:h-20 sm:w-20"
            />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5 shadow">
              <CountryFlag src={null} iso={meta.iso} countryName={meta.name} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-semibold group-hover:text-primary">{p.full_name}</h3>
              {p.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="যাচাইকৃত" />}
              {birthday && <Cake className="h-4 w-4 shrink-0 text-pink-500" aria-label="আজ জন্মদিন" />}
            </div>

            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {p.profession || "প্রবাসী"}
              {age !== null && ` • ${toBanglaDigits(age)} বছর`}
            </p>

            <p className="mt-1.5 flex items-center gap-1.5 truncate text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {meta.bn}
                {p.city ? ` • ${p.city}` : ""}
              </span>
            </p>

            {p.village && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">গ্রাম/ইউনিয়ন: {p.village}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  presenceMeta.className,
                )}
              >
                {presenceMeta.emoji} {presenceMeta.label}
              </span>
              {abroad !== null && presence === "abroad" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                  <Plane className="h-3 w-3" /> {formatDuration(abroad)} প্রবাসে
                </span>
              )}
              {remaining !== null && remaining >= 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <CalendarClock className="h-3 w-3" /> {formatDaysRemaining(remaining)}
                </span>
              )}
            </div>
          </div>
        </div>

        {p.community_message && (
          <p className="border-t border-border/60 bg-muted/30 px-5 py-3 text-sm italic text-muted-foreground">
            “{p.community_message}”
          </p>
        )}
      </Card>
    </Link>
  );
}
