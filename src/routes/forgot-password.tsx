import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { authRedirectUrl } from "@/lib/auth-redirect";
import logoAsset from "@/assets/khijirion-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "পাসওয়ার্ড রিসেট — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "আপনার পাসওয়ার্ড পুনরুদ্ধার করতে ইমেইল ঠিকানা দিন।" },
      { property: "og:title", content: "পাসওয়ার্ড রিসেট" },
      { property: "og:description", content: "ইমেইলের মাধ্যমে পাসওয়ার্ড রিসেট লিংক পান।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl("/reset-password"),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("রিসেট লিংক পাঠানো হয়েছে");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">পাসওয়ার্ড ভুলে গেছেন?</h1>
        <p className="mt-1 text-sm text-muted-foreground">আপনার ইমেইলে রিসেট লিংক পাঠাব।</p>

        {sent ? (
          <div className="mt-6 flex flex-col items-center rounded-lg border border-success/30 bg-success/5 p-6 text-center">
            <MailCheck className="h-10 w-10 text-success" />
            <p className="mt-3 text-sm font-medium">ইমেইল চেক করুন — লিংক পাঠানো হয়েছে।</p>
            <Link to="/auth" className="mt-4 text-sm text-primary hover:underline">সাইন ইন পাতায় ফিরুন</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} রিসেট লিংক পাঠান
            </Button>
            <div className="text-center">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">সাইন ইনে ফিরুন</Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
