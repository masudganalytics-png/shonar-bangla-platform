import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "গোপনীয়তা নীতি — খিজিরিয়ন" },
      { name: "description", content: "খিজিরিয়ন কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখে তা জানুন।" },
      { property: "og:title", content: "গোপনীয়তা নীতি — খিজিরিয়ন" },
      { property: "og:description", content: "তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষা সম্পর্কিত নীতি।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="hairline-gold" aria-hidden />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">গোপনীয়তা নীতি</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>আমরা কেবল সেবা প্রদানের জন্য প্রয়োজনীয় তথ্য সংগ্রহ করি—যেমন নাম, মোবাইল নম্বর ও আপনি নিজে যুক্ত করা তথ্য।</p>
        <p>মোবাইল নম্বরসহ সংবেদনশীল তথ্য শুধুমাত্র প্রযোজ্য ক্ষেত্রে এবং অনুমোদিত ব্যবহারকারীদের কাছে প্রদর্শিত হয়।</p>
        <p>আপনার তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি করা হয় না। অ্যাকাউন্ট বা তথ্য মুছে ফেলতে চাইলে আমাদের সাথে যোগাযোগ করুন।</p>
      </div>
    </div>
  );
}
