import { Link } from "@tanstack/react-router";
import { BadgeCheck, Building2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GovtPhoto } from "@/components/govt/GovtPhoto";
import type { GovtWorker } from "@/lib/govt-shared";

/** Directory card — contact columns are never part of `GovtWorker`. */
export function GovtCard({ w }: { w: GovtWorker }) {
  return (
    <Link to="/govt-jobs/$id" params={{ id: w.id }} className="group block">
      <Card className="h-full border-border/60 bg-card/70 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
        <div className="flex items-start gap-4">
          <GovtPhoto
            url={w.photo_url}
            alt={w.full_name}
            className="h-16 w-16 shrink-0 rounded-2xl ring-2 ring-border/70"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-semibold group-hover:text-primary">{w.full_name}</h3>
              {w.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="যাচাইকৃত" />}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{w.designation}</p>

            <p className="mt-1.5 flex items-center gap-1.5 text-sm">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{w.organization}</span>
            </p>

            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {w.current_workplace ? `${w.current_workplace} • ` : ""}
                {w.current_district}
                {w.current_upazila ? ` • ${w.current_upazila}` : ""}
              </span>
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {w.department}
              </span>
              {w.job_category && (
                <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                  {w.job_category}
                </span>
              )}
              <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                উখিয়া: {w.ukhiya_area}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
