import { Link } from "@tanstack/react-router";
import { BadgeCheck, Sparkles, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BusinessLogo } from "./BusinessLogo";
import { RatingStars } from "./RatingStars";
import type { BusinessRow } from "@/lib/business-shared";

export function BusinessCard({ b, categoryName }: { b: BusinessRow; categoryName?: string }) {
  return (
    <Link to="/business/$slug" params={{ slug: b.slug || b.id }} className="group block">
      <Card className="h-full overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BusinessLogo path={b.logo_url} name={b.name} className="h-14 w-14 shrink-0 text-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-semibold group-hover:text-primary">{b.name}</h3>
                {b.is_featured && <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />}
              </div>
              {categoryName && <p className="mt-0.5 text-xs text-primary">{categoryName}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {b.is_verified && (
                  <Badge className="gap-1 bg-primary/10 px-1.5 py-0 text-primary hover:bg-primary/10">
                    <BadgeCheck className="h-3 w-3" /> যাচাইকৃত
                  </Badge>
                )}
                {b.review_count > 0 && <RatingStars value={b.avg_rating} count={b.review_count} />}
              </div>
            </div>
          </div>
          {b.short_description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{b.short_description}</p>}
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {[b.area, b.union_name, b.upazila].filter(Boolean).join(", ") || b.upazila}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
