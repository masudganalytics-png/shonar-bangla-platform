import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "যোগাযোগ — খিজিরিয়ন" },
      { name: "description", content: "খিজিরিয়ন টিমের সাথে যোগাযোগ করুন—মতামত, সেবা যুক্ত করা বা সমস্যার রিপোর্টের জন্য।" },
      { property: "og:title", content: "যোগাযোগ — খিজিরিয়ন" },
      { property: "og:description", content: "খিজিরিয়ন টিমের সাথে যোগাযোগ করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="hairline-gold" aria-hidden />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">যোগাযোগ</h1>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        মতামত, নতুন সেবা যুক্ত করার অনুরোধ কিংবা কোনো সমস্যার রিপোর্টের জন্য আমাদের ইমেইল করুন।
      </p>
      <a href="mailto:support@khijirion.com" className="mt-6 inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10">
        support@khijirion.com
      </a>
    </div>
  );
}
