import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import {
  COMMUNITY_AREAS,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_ICON,
  EVENT_CATEGORY_LABEL_BN,
  VISIBILITY_LABEL_BN,
  type CommunityEventCategory,
  type CommunityRow,
  type CommunityVisibility,
} from "@/lib/community-shared";

export const Route = createFileRoute("/community/events/new")({
  head: () => ({
    meta: [
      { title: "নতুন অনুষ্ঠান যোগ করুন — কমিউনিটি | উখিয়া সেবা" },
      { name: "description", content: "আপনার ওয়ালিমা, আকিকা, মিলাদ, ইফতার বা খেলার অনুষ্ঠান বিনামূল্যে প্রকাশ করুন।" },
      { property: "og:title", content: "নতুন অনুষ্ঠান যোগ করুন" },
      { property: "og:description", content: "উখিয়া সেবার কমিউনিটিতে আপনার অনুষ্ঠান জানান।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewEventPage,
});

function NewEventPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<CommunityEventCategory>("social");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [visibility, setVisibility] = useState<CommunityVisibility>("public");
  const [communityId, setCommunityId] = useState("none");
  const [file, setFile] = useState<File | null>(null);

  const myCommunitiesQ = useQuery({
    queryKey: ["community-mine-full", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<CommunityRow[]> => {
      const { data: rows } = await supabase.from("community_members").select("community_id").eq("user_id", user!.id);
      const ids = (rows ?? []).map((r) => r.community_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("communities").select("*").in("id", ids);
      return (data ?? []) as CommunityRow[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("সাইন ইন করুন");
      if (title.trim().length < 3) throw new Error("অনুষ্ঠানের নাম লিখুন");
      if (!date) throw new Error("তারিখ নির্বাচন করুন");
      let coverUrl: string | null = null;
      if (file) coverUrl = await uploadImageToCloudinary(file, "community/events");
      const { error } = await supabase.from("community_events").insert({
        organizer_id: user.id,
        community_id: communityId === "none" ? null : communityId,
        title: title.trim(),
        category,
        area: area || null,
        description: description.trim() || null,
        event_date: date,
        event_time: time || null,
        cover_url: coverUrl,
        visibility,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("অনুষ্ঠান প্রকাশিত হয়েছে");
      navigate({ to: "/community/events" });
    },
    onError: (e: Error) => toast.error(e.message || "সংরক্ষণ করা যায়নি"),
  });

  if (!loading && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">সাইন ইন প্রয়োজন</h1>
        <p className="mt-2 text-sm text-muted-foreground">অনুষ্ঠান প্রকাশ করতে অ্যাকাউন্টে সাইন ইন করুন।</p>
        <Button asChild className="mt-4">
          <Link to="/auth">সাইন ইন</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">🍛 নতুন অনুষ্ঠান</h1>
      <p className="mt-1 text-sm text-muted-foreground">আপনার আয়োজনের তথ্য দিন — এলাকাবাসী জানতে পারবে।</p>

      <Card className="mt-6 space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">অনুষ্ঠানের নাম *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: রহিম ভাইয়ের ওয়ালিমা" maxLength={120} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>ক্যাটাগরি *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CommunityEventCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {EVENT_CATEGORY_ICON[c]} {EVENT_CATEGORY_LABEL_BN[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>এলাকা</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger><SelectValue placeholder="এলাকা নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {COMMUNITY_AREAS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">বিবরণ</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="অনুষ্ঠানের বিস্তারিত, ঠিকানা ইত্যাদি" maxLength={2000} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">তারিখ *</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time">সময়</Label>
            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cover">কভার ছবি (ঐচ্ছিক)</Label>
          <Input id="cover" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>কে দেখতে পাবে</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as CommunityVisibility)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{VISIBILITY_LABEL_BN.public}</SelectItem>
                <SelectItem value="members">{VISIBILITY_LABEL_BN.members}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>কমিউনিটি / ক্লাব (ঐচ্ছিক)</Label>
            <Select value={communityId} onValueChange={setCommunityId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">কোনোটি নয়</SelectItem>
                {(myCommunitiesQ.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" asChild>
            <Link to="/community/events">বাতিল</Link>
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            প্রকাশ করুন
          </Button>
        </div>
      </Card>
    </div>
  );
}
