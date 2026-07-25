import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "সেটিংস — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "থিম, বিজ্ঞপ্তি ও অ্যাকাউন্ট সেটিংস।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { role, signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("সাইন আউট হয়েছে");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">সেটিংস</h1>
      <p className="mt-1 text-sm text-muted-foreground">প্রয়োজন অনুযায়ী অ্যাপ কাস্টমাইজ করুন</p>

      <div className="mt-6 space-y-4">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-base">ডার্ক মোড</Label>
              <p className="text-sm text-muted-foreground">চোখের আরামের জন্য গাঢ় থিম</p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className={`h-4 w-4 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
              <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
              <Moon className={`h-4 w-4 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <Label className="text-base">অ্যাকাউন্ট ধরন</Label>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant={role === "admin" ? "default" : "secondary"}>
              {role === "admin" ? "অ্যাডমিন" : "সাধারণ গ্রাহক"}
            </Badge>
          </div>
        </Card>

        <Card className="border-destructive/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Label className="text-base">সাইন আউট</Label>
              <p className="text-sm text-muted-foreground">এই ডিভাইস থেকে বেরিয়ে যান</p>
            </div>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> সাইন আউট
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
