import { Phone, MessageCircle, Facebook, Globe, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  phone: string;
  whatsapp?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  name: string;
};

export function ContactButtons(p: Props) {
  const waNumber = (p.whatsapp || p.phone).replace(/\D/g, "");
  const mapsHref = p.lat && p.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || p.name)}`;

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("লিংক কপি করা হয়েছে");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button asChild size="lg" className="h-12">
        <a href={`tel:${p.phone}`}><Phone className="mr-2 h-4 w-4" /> এখনই কল করুন</a>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-12 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white">
        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
        </a>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-12">
        <a href={mapsHref} target="_blank" rel="noreferrer"><MapPin className="mr-2 h-4 w-4" /> দিকনির্দেশনা</a>
      </Button>
      {p.facebook_url && (
        <Button asChild size="lg" variant="outline" className="h-12">
          <a href={p.facebook_url} target="_blank" rel="noreferrer"><Facebook className="mr-2 h-4 w-4" /> Facebook</a>
        </Button>
      )}
      {p.website_url && (
        <Button asChild size="lg" variant="outline" className="h-12">
          <a href={p.website_url} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" /> ওয়েবসাইট</a>
        </Button>
      )}
      <Button size="lg" variant="ghost" className="h-12" onClick={share}>
        <Share2 className="mr-2 h-4 w-4" /> শেয়ার করুন
      </Button>
    </div>
  );
}
