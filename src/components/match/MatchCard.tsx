import { Link } from "@tanstack/react-router";
import { Heart, MapPin, GraduationCap, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toBanglaDigits } from "@/lib/bangla";
import {
  CREATED_FOR_LABEL,
  LOOKING_FOR_LABEL,
  MARITAL_LABEL,
  type MatchRequest,
} from "@/lib/match-shared";

type Props = {
  item: MatchRequest;
  shortlisted?: boolean;
  onToggleShortlist?: (id: string) => void;
};

export function MatchCard({ item, shortlisted, onToggleShortlist }: Props) {
  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-bold text-muted-foreground">
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={`${item.display_name}-এর ছবি`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            item.display_name.slice(0, 1)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{item.display_name}</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {LOOKING_FOR_LABEL[item.looking_for]} খুঁজছেন
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {CREATED_FOR_LABEL[item.created_for]} · {MARITAL_LABEL[item.marital_status]} ·{" "}
            {toBanglaDigits(item.age_min)}–{toBanglaDigits(item.age_max)} বছর
          </p>
        </div>
        {onToggleShortlist ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="শর্টলিস্টে রাখুন"
            onClick={() => onToggleShortlist(item.id)}
          >
            <Heart className={cn("h-5 w-5", shortlisted && "fill-primary text-primary")} />
          </Button>
        ) : null}
      </div>

      <div className="space-y-1.5 px-4 pb-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" />
          {item.area}
        </p>
        {item.education ? (
          <p className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0" />
            {item.education}
          </p>
        ) : null}
        {item.profession ? (
          <p className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0" />
            {item.profession}
          </p>
        ) : null}
      </div>

      <div className="mt-auto border-t p-3">
        <Button asChild variant="secondary" className="w-full">
          <Link to="/match/$id" params={{ id: item.id }}>
            বিস্তারিত দেখুন
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export default MatchCard;
