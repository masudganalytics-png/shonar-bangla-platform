import { useState } from "react";
import { Facebook, Link2, Check, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareButtons({ title, url }: { title: string; url?: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const open = (u: string) => window.open(u, "_blank", "noopener,noreferrer,width=640,height=560");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("লিংক কপি হয়েছে");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("কপি করা যায়নি");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url: shareUrl }); } catch { /* cancelled */ }
    } else {
      copy();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">শেয়ার করুন:</span>
      <Button size="sm" variant="outline" onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)} aria-label="Facebook-এ শেয়ার">
        <Facebook className="h-4 w-4" /> Facebook
      </Button>
      <Button size="sm" variant="outline" onClick={() => open(`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`)} aria-label="WhatsApp-এ শেয়ার">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </Button>
      <Button size="sm" variant="outline" onClick={() => open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`)} aria-label="Telegram-এ শেয়ার">
        <Send className="h-4 w-4" /> Telegram
      </Button>
      <Button size="sm" variant="outline" onClick={copy} aria-label="লিংক কপি করুন">
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? "কপি হয়েছে" : "লিংক কপি"}
      </Button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button size="sm" variant="secondary" onClick={nativeShare}>আরও…</Button>
      )}
    </div>
  );
}
