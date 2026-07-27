import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { signTeacherPhoto } from "@/lib/teachers-shared";
import { cn } from "@/lib/utils";

export function TeacherPhoto({ path, alt, className }: { path: string | null | undefined; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signTeacherPhoto(path).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [path]);
  if (!path || !url) {
    return (
      <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)}>
        <User className="h-1/2 w-1/2 opacity-40" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
