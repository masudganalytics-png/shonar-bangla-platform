import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "অভিযোগ — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "মিটার, লোডশেডিং বা বিলিং সংক্রান্ত অভিযোগ পাঠান।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ComingSoon
      icon={MessageSquare}
      title="অভিযোগ কেন্দ্র"
      description="অভিযোগ পাঠান এবং সমাধানের অবস্থা ট্র্যাক করুন। ফিচারটি শীঘ্রই আসছে।"
    />
  ),
});
