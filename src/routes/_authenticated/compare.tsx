import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({
    meta: [
      { title: "তুলনা — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "মাস-ভিত্তিক ব্যবহার ও খরচের তুলনামূলক বিশ্লেষণ।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ComingSoon
      icon={BarChart3}
      title="তুলনামূলক বিশ্লেষণ"
      description="মাসিক ও বাৎসরিক ব্যবহার তুলনা করে সঞ্চয়ের সুযোগ খুঁজুন। ফিচারটি শীঘ্রই আসছে।"
    />
  ),
});
