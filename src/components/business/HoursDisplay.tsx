import { Clock } from "lucide-react";
import { BUSINESS_DAYS, DAY_LABEL_BN, type BusinessHoursRow, isOpenNow } from "@/lib/business-shared";
import { toBanglaDigits } from "@/lib/bangla";
import { Badge } from "@/components/ui/badge";

export function HoursDisplay({ hours }: { hours: BusinessHoursRow[] }) {
  const open = isOpenNow(hours);
  return (
    <div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">খোলার সময়</h3>
        {open ? (
          <Badge className="bg-emerald-500 text-white">এখন খোলা</Badge>
        ) : (
          <Badge variant="outline">বন্ধ</Badge>
        )}
      </div>
      <ul className="mt-2 divide-y rounded-lg border">
        {BUSINESS_DAYS.map((d) => {
          const row = hours.find((h) => h.day === d);
          return (
            <li key={d} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{DAY_LABEL_BN[d]}</span>
              <span className="text-muted-foreground">
                {!row || row.is_closed ? "বন্ধ" : `${toBanglaDigits(row.open_time?.slice(0, 5) ?? "")} - ${toBanglaDigits(row.close_time?.slice(0, 5) ?? "")}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
