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
  size = "sm",
}: {
  name: string | null | undefined;
  photo: string | null | undefined;
  designation?: string | null;
  verified?: boolean | null;
  className?: string;
  size?: "sm" | "lg";
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
        <div className={cn("overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm", size === "lg" ? "h-16 w-16 sm:h-20 sm:w-20" : "h-9 w-9 sm:h-10 sm:w-10")}>
          {url ? (
            <img src={url} alt={label} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <User className={cn("opacity-60", size === "lg" ? "h-7 w-7" : "h-4 w-4")} />
            </div>
          )}
        </div>
        {verified && (
          <span className={cn("absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full border-2 border-background bg-primary shadow", size === "lg" ? "h-5 w-5 sm:h-6 sm:w-6" : "h-3.5 w-3.5 sm:h-4 sm:w-4")}>
            <Check className={size === "lg" ? "h-3 w-3 text-primary-foreground" : "h-2 w-2 text-primary-foreground sm:h-2.5 sm:w-2.5"} strokeWidth={4} />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className={cn("truncate font-medium leading-tight", size === "lg" ? "text-sm" : "text-xs")}>{label}</p>
        {designation && <p className="truncate text-[11px] leading-tight text-muted-foreground">{designation}</p>}
      </div>
    </div>
  );
}

export function BusinessOwnerTile({
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

  const label = name || "মালিক";

  return (
    <div className={cn("flex w-24 flex-col items-center sm:w-28", className)}>
      <div className="relative">
        <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-gradient-to-br from-primary/20 to-secondary/20 shadow-sm sm:h-28 sm:w-28">
          {url ? (
            <img src={url} alt={label} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <User className="h-9 w-9 opacity-60" />
            </div>
          )}
        </div>
        {verified && (
          <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-primary shadow sm:h-7 sm:w-7">
            <Check className="h-3 w-3 text-primary-foreground sm:h-3.5 sm:w-3.5" strokeWidth={4} />
          </span>
        )}
      </div>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">ব্যবসার মালিক</p>
      <p className="w-full truncate text-center text-sm font-semibold leading-tight">{label}</p>
      {designation && <p className="w-full truncate text-center text-[11px] leading-tight text-muted-foreground">{designation}</p>}
    </div>
  );
}
