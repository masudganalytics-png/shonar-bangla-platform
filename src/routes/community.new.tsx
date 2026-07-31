import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  COMMUNITY_KINDS,
  GROUP_TYPES,
  GROUP_TYPE_LABEL_BN,
  KIND_LABEL_BN,
  communityPath,
  type CommunityGroupType,
  type CommunityKind,
  type CommunityRow,
} from "@/lib/community-shared";

export const Route = createFileRoute("/community/new")({
  head: () => ({
    meta: [
      { title: "নতুন কমিউনিটি, ক্লাব বা গ্রুপ তৈরি করুন | উখিয়া সেবা" },
      { name: "description", content: "উখিয়ায় নিজের সোশ্যাল ক্লাব, ব্যাচ গ্রুপ বা এলাকাভিত্তিক কমিউনিটি বিনামূল্যে তৈরি করুন।" },
      { property: "og:title", content: "নতুন কমিউনিটি তৈরি করুন" },
      { property: "og:description", content: "ক্লাব, গ্রুপ বা কমিউনিটি খুলে সদস্য যুক্ত করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewCommunityPage,
});

function NewCommunityPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [kind, setKind] = useState<CommunityKind>("club");
  const [groupType, setGroupType] = useState<CommunityGroupType>("friends");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);

  const save = useMutation({
    mutationFn: async (): Promise<CommunityRow> => {
      if (!user) throw new Error("সাইন ইন করুন");
      if (name.trim().length < 3) throw new Error("নাম কমপক্ষে ৩ অক্ষরের হতে হবে");
      const [logoUrl, coverUrl] = await Promise.all([
        logo ? uploadImageToCloudinary(logo, "community/logos") : Promise.resolve(null),
        cover ? uploadImageToCloudinary(cover, "community/covers") : Promise.resolve(null),
      ]);
      const { data, error } = await supabase
        .from("communities")
        .insert({
          kind,
          group_type: kind === "group" ? groupType : null,
          name: name.trim(),
          description: description.trim() || null,
          area: area || null,
          logo_url: logoUrl,
          cover_url: coverUrl,
          created_by: user.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as CommunityRow;
    },
    onSuccess: (row) => {
      toast.success("তৈরি হয়েছে");
      navigate({ to: "/community/c/$slug", params: { slug: communityPath(row) } });
    },
    onError: (e: Error) => toast.error(e.message || "তৈরি করা যায়নি"),
  });

  if (!loading && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">সাইন ইন প্রয়োজন</h1>
        <p className="mt-2 text-sm text-muted-foreground">কমিউনিটি তৈরি করতে সাইন ইন করুন।</p>
        <Button asChild className="mt-4">
          <Link to="/auth">সাইন ইন</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">নতুন তৈরি করুন</h1>
      <p className="mt-1 text-sm text-muted-foreground">কমিউনিটি, সোশ্যাল ক্লাব অথবা গ্রুপ</p>

      <Card className="mt-6 space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>ধরন *</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as CommunityKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMUNITY_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>{KIND_LABEL_BN[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {kind === "group" ? (
            <div className="space-y-1.5">
              <Label>গ্রুপের ধরন *</Label>
              <Select value={groupType} onValueChange={(v) => setGroupType(v as CommunityGroupType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GROUP_TYPES.map((g) => (
                    <SelectItem key={g} value={g}>{GROUP_TYPE_LABEL_BN[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">নাম *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: উখিয়া যুব ক্লাব" maxLength={120} />
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

        <div className="space-y-1.5">
          <Label htmlFor="desc">বিবরণ</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} placeholder="উদ্দেশ্য, কার্যক্রম ইত্যাদি" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="logo">লোগো (ঐচ্ছিক)</Label>
            <Input id="logo" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cover">কভার ছবি (ঐচ্ছিক)</Label>
            <Input id="cover" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" asChild>
            <Link to="/community">বাতিল</Link>
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            তৈরি করুন
          </Button>
        </div>
      </Card>
    </div>
  );
}
