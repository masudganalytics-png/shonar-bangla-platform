import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/bills")({
  head: () => ({
    meta: [
      { title: "বিল জমা — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "নতুন বিল যোগ করুন এবং পরিশোধের অবস্থা দেখুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ComingSoon
      icon={FileText}
      title="বিল জমা"
      description="এখানে আপনার মাসিক বিদ্যুৎ বিল যোগ, পরিশোধ ও রসিদ ডাউনলোড করতে পারবেন। ফিচারটি শীঘ্রই আসছে।"
    />
  ),
});
