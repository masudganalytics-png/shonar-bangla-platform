import { useEffect, useState } from "react";
import { User, Check } from "lucide-react";
import { signBusinessMedia } from "@/lib/business-shared";
import { cn } from "@/lib/utils";

export function BusinessOwner({
  name,
  photo,
  designation,
  verified,
  className,
}: {
  name: string | null | undefined;
  photo: string | null | undefined;
  designation?: string | null;
  verified?: boolean | null;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signBusinessMedia(photo).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [photo]);

  if (!name && !photo) return null;
  const label = name || "মালিক";

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div className="relative shrink-0">
        <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm sm:h-10 sm:w-10">
          {url ? (
            <img src={url} alt={label} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <User className="h-4 w-4 opacity-60" />
            </div>
          )}
        </div>
        {verified && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-background bg-primary shadow sm:h-4 sm:w-4">
            <Check className="h-2 w-2 text-primary-foreground sm:h-2.5 sm:w-2.5" strokeWidth={4} />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium leading-tight">{label}</p>
        {designation && <p className="truncate text-[11px] leading-tight text-muted-foreground">{designation}</p>}
      </div>
    </div>
  );
}
