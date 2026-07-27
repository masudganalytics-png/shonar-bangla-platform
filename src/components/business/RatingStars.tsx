import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toBanglaDigits } from "@/lib/bangla";

export function RatingStars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" | "lg" }) {
  const rounded = Math.round(value);
  const sz = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(sz, i <= rounded ? "fill-amber-400 stroke-amber-400" : "stroke-muted-foreground/40")} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {toBanglaDigits(value.toFixed(1))}
        {typeof count === "number" && <> · {toBanglaDigits(count)}</>}
      </span>
    </div>
  );
}
