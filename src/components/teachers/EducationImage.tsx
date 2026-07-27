import { useEffect, useState } from "react";
import { signEducationMedia } from "@/lib/education-shared";
import { cn } from "@/lib/utils";

export function EducationImage({
  path,
  alt,
  className,
  fallback,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signEducationMedia(path).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [path]);
  if (!path || !url) {
    return <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)}>{fallback ?? null}</div>;
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
