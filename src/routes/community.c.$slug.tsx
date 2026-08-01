import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus, Loader2, MapPin, Send, Share2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { MemberRow } from "@/components/community/MemberRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PostCard } from "@/components/community/PostCard";
import { EventCard } from "@/components/community/EventCard";
import { useCommunityProfiles } from "@/components/community/use-community-profiles";
import {
  GROUP_TYPE_LABEL_BN,
  KIND_LABEL_BN,
  shareLink,
  type CommunityEventRow,
  type CommunityMemberRole,
  type CommunityPostRow,
  type CommunityRow,
} from "@/lib/community-shared";

export const Route = createFileRoute("/community/c/$slug")({
  head: () => ({
    meta: [
      { title: "কমিউনিটি প্রোফাইল — উখিয়া সেবা" },
      { name: "description", content: "উখিয়ার স্থানীয় কমিউনিটি, ক্লাব বা গ্রুপের পোস্ট, অনুষ্ঠান ও সদস্য তথ্য দেখুন।" },
      { property: "og:title", content: "কমিউনিটি প্রোফাইল — উখিয়া সেবা" },
      { property: "og:description", content: "ক্লাব ও গ্রুপের পোস্ট এবং অনুষ্ঠান।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityDetail,
});

function CommunityDetail() {
  const { slug } = useParams({ from: "/community/c/$slug" });
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const cQ = useQuery({
    queryKey: ["community-detail", slug],
    queryFn: async () => {
      const { data } = await supabase.from("communities").select("*").eq("slug", slug).maybeSingle();
      if (data) return data as CommunityRow;
      const { data: byId, error } = await supabase.from("communities").select("*").eq("id", slug).maybeSingle();
      if (error) throw error;
      return byId as CommunityRow | null;
    },
  });

  const community = cQ.data ?? null;

  const contentQ = useQuery({
    queryKey: ["community-detail-content", community?.id],
    enabled: !!community?.id,
    queryFn: async () => {
      const [posts, events, members] = await Promise.all([
        supabase.from("community_posts").select("*").eq("community_id", community!.id).eq("is_hidden", false).order("created_at", { ascending: false }),
        supabase.from("community_events").select("*").eq("community_id", community!.id).eq("is_hidden", false).order("event_date", { ascending: true }),
        supabase.from("community_members").select("user_id, role").eq("community_id", community!.id).order("role", { ascending: true }),
      ]);
      return {
        posts: (posts.data ?? []) as CommunityPostRow[],
        events: (events.data ?? []) as CommunityEventRow[],
        members: (members.data ?? []) as { user_id: string; role: string }[],
      };
    },
  });

  const profiles = useCommunityProfiles([
    ...(contentQ.data?.posts ?? []).map((p) => p.author_id),
    ...(contentQ.data?.events ?? []).map((e) => e.organizer_id),
    ...(contentQ.data?.members ?? []).map((m) => m.user_id),
  ]);

  const members = contentQ.data?.members ?? [];
  const myMembership = members.find((m) => m.user_id === user?.id);
  const isMember = !!myMembership;
  const canManage = myMembership?.role === "owner" || myMembership?.role === "admin";

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user || !community) throw new Error("সাইন ইন করুন");
      const text = content.trim();
      if (text.length < 2) throw new Error("কিছু লিখুন");
      if (text.length > 3000) throw new Error("পোস্ট অনেক বড় হয়ে গেছে");
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadImageToCloudinary(file, "community/posts");
      const { error } = await supabase.from("community_posts").insert({
        author_id: user.id,
        community_id: community.id,
        content: text,
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setContent("");
      setFile(null);
      toast.success("পোস্ট প্রকাশিত হয়েছে");
      await qc.invalidateQueries({ queryKey: ["community-detail-content", community?.id] });
    },
    onError: (e: Error) => toast.error(e.message || "পোস্ট করা যায়নি"),
  });

  const changeRole = async (userId: string, role: CommunityMemberRole) => {
    if (!community) return;
    const { error } = await supabase
      .from("community_members")
      .update({ role })
      .eq("community_id", community.id)
      .eq("user_id", userId);
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["community-detail-content", community.id] });
    toast.success("ভূমিকা আপডেট হয়েছে");
  };

  const removeMember = async (userId: string) => {
    if (!community) return;
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", community.id)
      .eq("user_id", userId);
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["community-detail-content", community.id] });
    toast.success("সদস্য সরানো হয়েছে");
  };

  const toggleJoin = async () => {
    if (!isAuthenticated || !user) {
      toast.error("যোগ দিতে সাইন ইন করুন");
      return;
    }
    if (!community) return;
    setBusy(true);
    try {
      if (isMember) {
        await supabase.from("community_members").delete().eq("community_id", community.id).eq("user_id", user.id);
      } else {
        const { error } = await supabase
          .from("community_members")
          .insert({ community_id: community.id, user_id: user.id, role: "member" });
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["community-detail-content", community.id] });
      toast.success(isMember ? "আপনি বেরিয়ে গেছেন" : "যোগ দেওয়া হয়েছে");
    } catch {
      toast.error("কাজটি সম্পন্ন হয়নি");
    } finally {
      setBusy(false);
    }
  };

  if (cQ.isLoading) return <div className="mx-auto max-w-4xl px-4 py-8"><Skeleton className="h-64" /></div>;
  if (!community)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">পাওয়া যায়নি</h1>
        <Button asChild className="mt-4"><Link to="/community">কমিউনিটিতে ফিরে যান</Link></Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Card className="overflow-hidden">
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-emerald-500/20">
          {community.cover_url ? <img src={community.cover_url} alt={community.name} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="-mt-12 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-card shadow">
              {community.logo_url ? (
                <img src={community.logo_url} alt={community.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-primary/10 text-2xl font-bold text-primary">{community.name.slice(0, 1)}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px]">{KIND_LABEL_BN[community.kind]}</Badge>
                {community.group_type ? <Badge variant="outline" className="text-[10px]">{GROUP_TYPE_LABEL_BN[community.group_type]}</Badge> : null}
              </div>
              <h1 className="mt-1.5 text-2xl font-bold">{community.name}</h1>
              <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {community.area ? <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {community.area}</span> : null}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {community.member_count} সদস্য</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void shareLink(community.name, `/community/c/${slug}`).then((r) => r === "copied" && toast.success("লিংক কপি হয়েছে"))}>
                <Share2 className="mr-1.5 h-4 w-4" /> শেয়ার
              </Button>
              <Button size="sm" disabled={busy} onClick={toggleJoin} variant={isMember ? "outline" : "default"}>
                {isMember ? "সদস্যপদ ছাড়ুন" : "যোগ দিন"}
              </Button>
            </div>
          </div>
          {community.description ? <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{community.description}</p> : null}
        </div>
      </Card>

      <Tabs defaultValue="posts" className="mt-6">
        <TabsList>
          <TabsTrigger value="posts">পোস্ট</TabsTrigger>
          <TabsTrigger value="events">অনুষ্ঠান</TabsTrigger>
          <TabsTrigger value="members">সদস্য</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {isMember ? (
            <Card className="p-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="এই কমিউনিটিতে কিছু লিখুন…"
                rows={3}
                aria-label="নতুন পোস্ট"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <ImagePlus className="h-4 w-4" />
                  {file ? file.name.slice(0, 20) : "ছবি যোগ করুন"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="flex gap-2">
                  {file ? (
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                      <X className="mr-1 h-4 w-4" /> ছবি বাদ
                    </Button>
                  ) : null}
                  <Button size="sm" disabled={createPost.isPending} onClick={() => createPost.mutate()}>
                    {createPost.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 h-4 w-4" />
                    )}
                    পোস্ট করুন
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 text-center text-sm text-muted-foreground">
              পোস্ট করতে এই কমিউনিটিতে যোগ দিন।
            </Card>
          )}
          {(contentQ.data?.posts ?? []).length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">এখনো কোনো পোস্ট নেই।</Card>
          ) : (
            (contentQ.data?.posts ?? []).map((p) => <PostCard key={p.id} p={p} author={profiles.get(p.author_id)} />)
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-4 grid gap-3 sm:grid-cols-2">
          {(contentQ.data?.events ?? []).length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground sm:col-span-2">কোনো অনুষ্ঠান নেই।</Card>
          ) : (
            (contentQ.data?.events ?? []).map((e) => <EventCard key={e.id} e={e} organizer={profiles.get(e.organizer_id)} />)
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4 grid gap-2 sm:grid-cols-2">
          {members.map((m) => (
            <MemberRow
              key={m.user_id}
              userId={m.user_id}
              role={m.role as CommunityMemberRole}
              profile={profiles.get(m.user_id)}
              canManage={!!canManage && m.user_id !== user?.id}
              onChangeRole={changeRole}
              onRemove={removeMember}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
