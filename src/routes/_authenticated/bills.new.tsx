import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BillForm } from "@/components/bills/BillForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/bills/new")({
  head: () => ({
    meta: [
      { title: "নতুন বিল জমা — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "আপনার মাসিক বিদ্যুৎ বিল জমা দিন। বিলের ছবি থেকে AI স্বয়ংক্রিয়ভাবে তথ্য পড়বে।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewBillPage,
});

function NewBillPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/bills"><ChevronLeft className="mr-1 h-4 w-4" /> বিল ইতিহাসে ফিরুন</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">নতুন বিল জমা দিন</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            বিলের ছবি আপলোড করুন — AI স্বয়ংক্রিয়ভাবে মাস, ইউনিট, পরিমাণ ও মিটার নম্বর পড়ে দেবে।
          </p>
        </div>
        <BillForm mode="create" />
      </div>
    </AppShell>
  );
}
