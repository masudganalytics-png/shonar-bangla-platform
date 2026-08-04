import { Cake, Globe2, Home, Plane, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountryFlag } from "@/components/common/CountryFlag";
import {
  countryMeta,
  isBirthdayToday,
  presenceOf,
  toBanglaDigits,
  type ProbashiProfile,
} from "@/lib/probashi-shared";

export function ProbashiStats({ list }: { list: ProbashiProfile[] }) {
  const total = list.length;
  const abroad = list.filter((p) => presenceOf(p) === "abroad").length;
  const home = total - abroad;
  const birthdays = list.filter((p) => isBirthdayToday(p.birth_date)).length;
  const countries = new Set(list.map((p) => countryMeta(p.country).name)).size;

  const items = [
    { icon: Users, label: "মোট প্রবাসী", value: total, className: "text-primary" },
    { icon: Plane, label: "বর্তমানে প্রবাসে", value: abroad, className: "text-emerald-600 dark:text-emerald-400" },
    { icon: Home, label: "দেশে অবস্থানরত", value: home, className: "text-sky-600 dark:text-sky-400" },
    { icon: Globe2, label: "দেশের সংখ্যা", value: countries, className: "text-amber-600 dark:text-amber-400" },
    { icon: Cake, label: "আজ জন্মদিন", value: birthdays, className: "text-pink-600 dark:text-pink-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ icon: Icon, label, value, className }) => (
        <Card key={label} className="border-border/60 bg-card/70 p-4 backdrop-blur-xl">
          <Icon className={`h-5 w-5 ${className}`} />
          <p className="mt-2 text-2xl font-bold">{toBanglaDigits(value)}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </Card>
      ))}
    </div>
  );
}

export function CountryBreakdown({ list }: { list: ProbashiProfile[] }) {
  const counts = new Map<string, number>();
  for (const p of list) {
    const key = countryMeta(p.country).name;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const max = rows[0]?.[1] ?? 1;

  if (rows.length === 0) return null;

  return (
    <Card className="border-border/60 bg-card/70 p-5 backdrop-blur-xl">
      <h3 className="text-sm font-semibold">দেশভিত্তিক প্রবাসী</h3>
      <ul className="mt-3 space-y-2.5">
        {rows.map(([name, count]) => {
          const meta = countryMeta(name);
          return (
            <li key={name} className="flex items-center gap-3">
              <CountryFlag src={null} iso={meta.iso} countryName={meta.name} />
              <span className="w-28 shrink-0 truncate text-sm">{meta.bn}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(6, (count / max) * 100)}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right text-sm font-medium">{toBanglaDigits(count)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function CityBreakdown({ list }: { list: ProbashiProfile[] }) {
  const counts = new Map<string, number>();
  for (const p of list) {
    if (!p.city) continue;
    counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (rows.length === 0) return null;

  return (
    <Card className="border-border/60 bg-card/70 p-5 backdrop-blur-xl">
      <h3 className="text-sm font-semibold">শহরভিত্তিক প্রবাসী</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {rows.map(([city, count]) => (
          <li
            key={city}
            className="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium"
          >
            {city} · {toBanglaDigits(count)}
          </li>
        ))}
      </ul>
    </Card>
  );
}
