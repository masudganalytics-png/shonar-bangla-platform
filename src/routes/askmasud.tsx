import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AskMasudBox } from "@/components/home/AskMasudBox";

const SHARE_URL = "https://khijirion.com/askmasud";
const SHARE_TEXT = "AskMasud — বাংলায় প্রশ্ন করুন, CV, আবেদনপত্র, অনুবাদ বা পড়াশোনায় AI সাহায্য নিন। বিনামূল্যে:";

export const Route = createFileRoute("/askmasud")({
  head: () => ({
    meta: [
      { title: "AskMasud — বাংলায় AI সহায়ক | KHIJIRION" },
      { name: "description", content: "AskMasud: পড়াশোনা, সিভি, আবেদনপত্র, অনুবাদ বা সাধারণ যেকোনো প্রশ্নের উত্তর বাংলায় দেয় এমন বিনামূল্যের AI সহায়ক।" },
      { property: "og:title", content: "AskMasud — বাংলায় AI সহায়ক" },
      { property: "og:description", content: "CV, আবেদনপত্র, অনুবাদ, পড়াশোনা — বাংলায় প্রশ্ন করুন, সঙ্গে সঙ্গে উত্তর পান।" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SHARE_URL },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AskMasudPage,
});

function AskMasudPage() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "AskMasud", text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch {
        /* cancelled — fall back to copy */
      }
    }
    await copy();
  };
  const copy = async () => {
    await navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">🤖 AskMasud</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        বাংলায় যেকোনো প্রশ্ন করুন — CV, আবেদনপত্র, অনুবাদ বা পড়াশোনা। বিনামূল্যে।
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void share()}>
          <Share2 /> বন্ধুদের আমন্ত্রণ জানান
        </Button>
        <Button size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />} {copied ? "কপি হয়েছে" : "লিংক কপি করুন"}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${SHARE_URL}`)}`} target="_blank" rel="noreferrer">
            WhatsApp-এ শেয়ার
          </a>
        </Button>
      </div>
      <div className="mt-5">
        <AskMasudBox />
      </div>
    </div>
  );
}
