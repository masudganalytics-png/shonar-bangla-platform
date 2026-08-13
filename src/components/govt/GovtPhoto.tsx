import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cloudinary-hosted profile photo with a neutral fallback. */
export function GovtPhoto({
  url,
  alt,
  className,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (!url) {
    return (
      <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)}>
        <Briefcase className="h-1/2 w-1/2 opacity-40" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
