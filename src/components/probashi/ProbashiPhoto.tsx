import { User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Probashi photos are uploaded to Cloudinary, so `url` is an absolute https URL.
 * Falls back to a neutral avatar placeholder when missing or broken.
 */
export function ProbashiPhoto({
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
        <User className="h-1/2 w-1/2 opacity-40" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
