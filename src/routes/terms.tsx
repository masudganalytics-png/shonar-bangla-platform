import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "শর্তাবলী — খিজিরিয়ন" },
      { name: "description", content: "খিজিরিয়ন ব্যবহারের শর্তাবলী ও দায়বদ্ধতা সম্পর্কিত তথ্য।" },
      { property: "og:title", content: "শর্তাবলী — খিজিরিয়ন" },
      { property: "og:description", content: "খিজিরিয়ন ব্যবহারের শর্তাবলী।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="hairline-gold" aria-hidden />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">শর্তাবলী</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>খিজিরিয়ন একটি বেসরকারি প্ল্যাটফর্ম; এটি কোনো সরকারি সংস্থার সাথে সম্পৃক্ত নয়।</p>
        <p>প্ল্যাটফর্মে প্রদর্শিত তথ্য ব্যবহারকারী ও প্রতিষ্ঠান কর্তৃক প্রদত্ত। তথ্যের সম্পূর্ণ নির্ভুলতার নিশ্চয়তা দেওয়া হয় না।</p>
        <p>ভুল, বিভ্রান্তিকর বা আপত্তিকর কনটেন্ট প্রকাশ করলে অ্যাকাউন্ট বা লিস্টিং বাতিল করা হতে পারে।</p>
      </div>
    </div>
  );
}
