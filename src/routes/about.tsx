import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের সম্পর্কে — খিজিরিয়ন" },
      { name: "description", content: "খিজিরিয়ন উখিয়ার একটি লোকাল সুপার অ্যাপ—শিক্ষা, ব্যবসা, ইন্টারনেট, প্রবাসী ও কমিউনিটি সেবা এক প্ল্যাটফর্মে।" },
      { property: "og:title", content: "আমাদের সম্পর্কে — খিজিরিয়ন" },
      { property: "og:description", content: "উখিয়ার সব প্রয়োজনীয় সেবা এক জায়গায়।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="hairline-gold" aria-hidden />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">আমাদের সম্পর্কে</h1>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        খিজিরিয়ন (KHIJIRION) উখিয়ার মানুষের জন্য তৈরি একটি লোকাল সুপার অ্যাপ। আমাদের লক্ষ্য—শিক্ষা, স্থানীয় ব্যবসা,
        ইন্টারনেট সেবা, প্রবাসী সহায়তা ও কমিউনিটি কার্যক্রমকে একটি নির্ভরযোগ্য প্ল্যাটফর্মে নিয়ে আসা।
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        এটি কোনো সরকারি ওয়েবসাইট নয়। সব তথ্য জনস্বার্থে সংগৃহীত ও যাচাইয়ের চেষ্টা করা হয়।
      </p>
    </div>
  );
}
