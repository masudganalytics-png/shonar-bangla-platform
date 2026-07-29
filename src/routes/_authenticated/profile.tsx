import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, MapPin, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationPicker, type PickedLocation } from "@/components/location/LocationPicker";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "প্রোফাইল — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "আপনার প্রোফাইল তথ্য দেখুন ও সম্পাদনা করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [meterNo, setMeterNo] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, address, meter_no")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
        setAddress(data?.address ?? "");
        setMeterNo(data?.meter_no ?? "");
        setLoading(false);
      });
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        meter_no: meterNo.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("প্রোফাইল আপডেট হয়েছে");
  };

  const initials = (fullName || user?.email || "ব্য").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <UserIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">প্রোফাইল</h1>
          <p className="text-sm text-muted-foreground">আপনার তথ্য হালনাগাদ করুন</p>
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={onSave} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-lg text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">লগইন ইমেইল</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">পুরো নাম</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="আপনার নাম" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">মোবাইল নম্বর</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="meter">মিটার নম্বর</Label>
                <Input id="meter" value={meterNo} onChange={(e) => setMeterNo(e.target.value)} placeholder="উদাহরণ: 05-1234-5678" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">ঠিকানা</Label>
                <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="গ্রাম, ইউনিয়ন, উপজেলা" rows={3} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
