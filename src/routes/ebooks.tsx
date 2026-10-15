import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/ebooks")({
  head: () => ({ meta: [
    { title: "ই-বুক — KHIJIRION" },
    { name: "description", content: "KHIJIRION ই-বুক লাইব্রেরি — বই, লেখক ও বিবরণ।" },
    { property: "og:title", content: "ই-বুক — KHIJIRION" },
    { property: "og:description", content: "ই-বুকের তালিকা, দাম ও বিবরণ।" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://khijirion.com/ebooks" },
  ], links: [
    { rel: "canonical", href: "https://khijirion.com/ebooks" },
  ] }),
  component: EbooksPage,
});

type Ebook = {
  id: string;
  title: string;
  author: string;
  price: number;
  description: string;
  category: string;
  emoji: string;
  details_url: string;
};

const SAMPLE_EBOOKS: Ebook[] = [
  {
    id: "b1",
    title: "স্বপ্নের পথে",
    author: "রহিম উদ্দিন",
    price: 250,
    description: "তরুণদের জন্য ক্যারিয়ার গড়ার সহজ গাইড।",
    category: "উন্নয়ন",
    emoji: "🌱",
    details_url: "https://example.com/ebooks/1",
  },
  {
    id: "b2",
    title: "গণিতের মজা",
    author: "ফাতেমা আক্তার",
    price: 180,
    description: "শিশুদের জন্য মজার গণিত অনুশীলন বই।",
    category: "শিক্ষা",
    emoji: "📐",
    details_url: "https://example.com/ebooks/2",
  },
  {
    id: "b3",
    title: "ব্যবসার শুরু",
    author: "করিম মিয়া",
    price: 320,
    description: "ছোট ব্যবসা শুরু করার ধাপে ধাপে নির্দেশনা।",
    category: "ব্যবসা",
    emoji: "💼",
    details_url: "https://example.com/ebooks/3",
  },
  {
    id: "b4",
    title: "প্রবাস জীবন",
    author: "আবদুল হক",
    price: 200,
    description: "প্রবাসী জীবনের অভিজ্ঞতা ও পরামর্শ।",
    category: "প্রবাস",
    emoji: "✈️",
    details_url: "https://example.com/ebooks/4",
  },
  {
    id: "b5",
    title: "স্বাস্থ্য টিপস",
    author: "ডা. সেলিনা রহমান",
    price: 150,
    description: "দৈনন্দিন স্বাস্থ্য সচেতনতার সহজ টিপস।",
    category: "স্বাস্থ্য",
    emoji: "🩺",
    details_url: "https://example.com/ebooks/5",
  },
  {
    id: "b6",
    title: "কৃষি কথা",
    author: "জাহাঙ্গীর আলম",
    price: 220,
    description: "আধুনিক কৃষি পদ্ধতি ও ফসল ব্যবস্থাপনা।",
    category: "কৃষি",
    emoji: "🌾",
    details_url: "https://example.com/ebooks/6",
  },
];

function EbookCover({ book }: { book: Ebook }) {
  return (
    <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-t-lg border-b border-border/50 bg-gradient-to-br from-primary/15 via-background to-background">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-5xl">{book.emoji}</span>
        <span className="max-w-[80%] px-2 text-sm font-semibold text-foreground/80">{book.title}</span>
      </div>
    </div>
  );
}

function EbooksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <BookOpen className="h-7 w-7 text-primary" /> ই-বুক
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">বই, লেখক ও দামের তালিকা। বিস্তারিত দেখতে লিংকে ক্লিক করুন।</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_EBOOKS.map((b) => (
          <Card key={b.id} className="flex h-full flex-col overflow-hidden">
            <EbookCover book={b} />
            <CardContent className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{b.title}</h3>
                  <p className="text-xs text-muted-foreground">✍️ {b.author}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">{b.category}</Badge>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{b.description}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-base font-bold text-primary">৳ {toBanglaDigits(b.price)}</span>
                <Button asChild size="sm" variant="outline">
                  <a href={b.details_url} target="_blank" rel="noopener noreferrer">
                    বিস্তারিত <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" /> এই তালিকাটি এখন প্রদর্শনের জন্য নমুনা তথ্য।
      </p>

      <div className="mt-4 text-center">
        <Link to="/" className="text-sm text-primary hover:underline">← হোমে ফিরে যান</Link>
      </div>
    </div>
  );
}
