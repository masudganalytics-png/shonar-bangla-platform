import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { signBusinessMedia } from "@/lib/business-shared";
import { cn } from "@/lib/utils";

export function BusinessLogo({ path, name, className }: { path: string | null | undefined; name: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signBusinessMedia(path).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [path]);
  if (!path || !url) {
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    return (
      <div className={cn("grid place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold", className)}>
        {initial || <Store className="h-1/2 w-1/2 opacity-60" />}
      </div>
    );
  }
  return <img src={url} alt={name} loading="lazy" className={cn("rounded-2xl object-cover", className)} />;
}

export function BusinessImage({ path, alt, className }: { path: string | null | undefined; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signBusinessMedia(path).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [path]);
  if (!path || !url) {
    return <div className={cn("bg-muted", className)} />;
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
