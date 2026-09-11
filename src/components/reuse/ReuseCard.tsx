import { Link } from "@tanstack/react-router";
import { ImageOff, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatBanglaCurrency } from "@/lib/bangla";
import { REUSE_TYPE_META, type ReuseListing } from "@/lib/reuse-shared";

export function ReuseCard({ item }: { item: ReuseListing }) {
  const type = REUSE_TYPE_META[item.listing_type];
  return (
    <Link to="/services/reuse/$listingId" params={{ listingId: item.id }} className="group">
      <Card className="gold-hover h-full overflow-hidden rounded-2xl border-border/60 bg-card/70 backdrop-blur-xl">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${type.className}`}>
              {type.label}
            </span>
            <span className="rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {item.condition}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold sm:text-base">{item.title}</h3>
          <p className="text-xs text-muted-foreground">{item.category}</p>
          <p className="text-base font-bold text-primary">
            {item.listing_type === "donation" || item.price === null
              ? "বিনামূল্যে"
              : formatBanglaCurrency(Number(item.price))}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {item.location}
              {item.area ? ` • ${item.area}` : ""}
            </span>
          </p>
        </div>
      </Card>
    </Link>
  );
}
