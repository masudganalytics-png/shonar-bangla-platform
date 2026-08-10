import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/khijirion-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "নতুন পাসওয়ার্ড সেট করুন — KHIJIRION" },
      { name: "description", content: "আপনার KHIJIRION অ্যাকাউন্টের নতুন পাসওয়ার্ড সেট করুন।" },
      { property: "og:title", content: "নতুন পাসওয়ার্ড সেট" },
      { property: "og:description", content: "নিরাপদভাবে নতুন পাসওয়ার্ড সেট করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
    if (password !== confirm) return toast.error("পাসওয়ার্ড মিলছে না");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("পাসওয়ার্ড পরিবর্তিত হয়েছে");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <Card className="p-6">
        <img
          src={logoAsset.url}
          alt="KHIJIRION"
          className="mx-auto mb-6 h-16 w-16 object-contain"
          width={64}
          height={64}
        />
        <h1 className="text-2xl font-bold">নতুন পাসওয়ার্ড সেট করুন</h1>
        <p className="mt-1 text-sm text-muted-foreground">সুরক্ষিত ও মনে রাখার মতো পাসওয়ার্ড বেছে নিন।</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw">নতুন পাসওয়ার্ড</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="কমপক্ষে ৮ অক্ষর" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw2">পাসওয়ার্ড নিশ্চিত করুন</Label>
            <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} পাসওয়ার্ড সংরক্ষণ করুন
          </Button>
        </form>
      </Card>
    </div>
  );
}
