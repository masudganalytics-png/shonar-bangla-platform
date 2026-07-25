import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/AppShell";
import { BillForm } from "@/components/bills/BillForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type BillRow = Database["public"]["Tables"]["bills"]["Row"];

export const Route = createFileRoute("/_authenticated/bills/$id/edit")({
  head: () => ({
    meta: [
      { title: "বিল সম্পাদনা — উখিয়া বিদ্যুৎ বিল" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditBillPage,
});

function EditBillPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bill, setBill] = useState<BillRow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        toast.error("বিল লোড করতে ব্যর্থ");
        setStatus("notfound");
        return;
      }
      if (!data) {
        setStatus("notfound");
        return;
      }
      setBill(data);
      setStatus("ready");
    })();
  }, [id, user?.id, authLoading]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/bills"><ChevronLeft className="mr-1 h-4 w-4" /> বিল ইতিহাসে ফিরুন</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">বিল সম্পাদনা</h1>
          <p className="mt-1 text-sm text-muted-foreground">প্রয়োজনীয় পরিবর্তন করে সংরক্ষণ করুন।</p>
        </div>

        {status === "loading" ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে...
          </div>
        ) : status === "notfound" ? (
          <div className="rounded-lg border border-border/60 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">এই বিলটি পাওয়া যায়নি অথবা আপনার অ্যাক্সেস নেই।</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/bills" })}>ফিরে যান</Button>
          </div>
        ) : (
          <BillForm mode="edit" initial={bill} />
        )}
      </div>
    </AppShell>
  );
}
