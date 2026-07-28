import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { signAdvocatePhoto } from "@/lib/legal-shared";
import { cn } from "@/lib/utils";

export function AdvocatePhoto({ path, alt, className }: { path: string | null | undefined; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signAdvocatePhoto(path).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [path]);
  if (!path || !url) {
    return (
      <div className={cn("grid place-items-center bg-primary/10 text-primary", className)}>
        <Scale className="h-1/2 w-1/2 opacity-60" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
