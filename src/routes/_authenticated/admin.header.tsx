import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NAV_ITEMS } from "@/lib/nav-items";
import { useNavSettings } from "@/hooks/use-nav-settings";
import { setNavItemVisibility } from "@/lib/nav-settings.functions";

export const Route = createFileRoute("/_authenticated/admin/header")({
  head: () => ({
    meta: [
      { title: "হেডার মেনু ব্যবস্থাপনা — অ্যাডমিন" },
      { name: "description", content: "হেডারের নেভিগেশন মেনু দেখান বা লুকান।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHeaderMenu,
});

function AdminHeaderMenu() {
  const { data: settings, isLoading } = useNavSettings();
  const qc = useQueryClient();
  const setVisibility = useServerFn(setNavItemVisibility);

  const mut = useMutation({
    mutationFn: (vars: { item_key: string; is_visible: boolean }) => setVisibility({ data: vars }),
    onSuccess: () => {
      toast.success("মেনু সেটিংস সংরক্ষিত হয়েছে");
      qc.invalidateQueries({ queryKey: ["nav-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <header>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Menu className="h-5 w-5 text-primary" /> হেডার / মেনু ব্যবস্থাপনা
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          প্রতিটি মেনু আইটেম চালু বা বন্ধ করুন। পরিবর্তন সঙ্গে সঙ্গে ওয়েবসাইটের হেডারে প্রয়োগ হবে।
        </p>
      </header>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">লোড হচ্ছে…</p>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {NAV_ITEMS.map((item) => {
              const visible = settings?.[item.to] !== false;
              return (
                <div key={item.to} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <Label htmlFor={`nav-${item.to}`} className="text-sm font-medium">
                      {item.label}
                    </Label>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.to}
                      {item.auth ? " · শুধু লগইন করা ব্যবহারকারীর জন্য" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {visible ? "দৃশ্যমান" : "লুকানো"}
                    </span>
                    <Switch
                      id={`nav-${item.to}`}
                      checked={visible}
                      disabled={mut.isPending}
                      onCheckedChange={(checked) =>
                        mut.mutate({ item_key: item.to, is_visible: checked })
                      }
                      aria-label={`${item.label} দেখান বা লুকান`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
