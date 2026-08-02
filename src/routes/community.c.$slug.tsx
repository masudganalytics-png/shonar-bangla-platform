import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, ImagePlus, Loader2, MapPin, Send, Share2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PostCard } from "@/components/community/PostCard";
import { EventCard } from "@/components/community/EventCard";
import { useCommunityProfiles } from "@/components/community/use-community-profiles";
import { useClubMembers, useClubPhones } from "@/components/community/use-club-members";
import { MemberDirectory } from "@/components/community/MemberDirectory";
import { AdvisorSection, CommitteeList } from "@/components/community/ClubSections";
import { CommitteeManager } from "@/components/community/CommitteeManager";
import { MemberManageDialog } from "@/components/community/MemberManageDialog";
import {
  GROUP_TYPE_LABEL_BN,
  KIND_LABEL_BN,
  formatDateBn,
  shareLink,
  type CommunityBadge,
  type CommunityEventRow,
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
  const { user, isAuthenticated, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [manageUserId, setManageUserId] = useState<string | null>(null);

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
      const [posts, events] = await Promise.all([
        supabase.from("community_posts").select("*").eq("community_id", community!.id).eq("is_hidden", false).order("created_at", { ascending: false }),
        supabase.from("community_events").select("*").eq("community_id", community!.id).eq("is_hidden", false).order("event_date", { ascending: true }),
      ]);
      return {
        posts: (posts.data ?? []) as CommunityPostRow[],
        events: (events.data ?? []) as CommunityEventRow[],
      };
    },
  });

  const membersQ = useClubMembers(community?.id);
  const phonesQ = useClubPhones(community?.id);
  const clubData = membersQ.data ?? { members: [], positions: [], badges: [] };

  const profiles = useCommunityProfiles([
    ...(contentQ.data?.posts ?? []).map((p) => p.author_id),
    ...(contentQ.data?.events ?? []).map((e) => e.organizer_id),
    ...clubData.members.map((m) => m.user_id),
  ]);

  const myMembership = clubData.members.find((m) => m.user_id === user?.id);
  const isMember = !!myMembership;
  const isOwner = myMembership?.role === "owner" || community?.created_by === user?.id || isAdmin;
  const canManage = isOwner || myMembership?.role === "admin";

  const badgesOf = useMemo(() => {
    const m = new Map<string, CommunityBadge[]>();
    for (const b of clubData.badges) m.set(b.user_id, [...(m.get(b.user_id) ?? []), b.badge]);
    return m;
  }, [clubData.badges]);

  const usedPositionIds = useMemo(
    () => new Set(clubData.members.map((m) => m.position_id).filter((x): x is string => !!x)),
    [clubData.members],
  );

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
      await qc.invalidateQueries({ queryKey: ["club-members", community.id] });
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

  const phones = phonesQ.data ?? {};
  const manageMember = clubData.members.find((m) => m.user_id === manageUserId) ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Card className="overflow-hidden">
        <div className="relative h-36 bg-gradient-to-br from-primary/20 to-emerald-500/20 sm:h-52">
          {community.cover_url ? (
            <img src={community.cover_url} alt={community.name} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="px-4 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="-mt-12 h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-lg sm:-mt-16 sm:h-28 sm:w-28">
              {community.logo_url ? (
                <img src={community.logo_url} alt={community.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-primary/10 text-3xl font-bold text-primary sm:text-4xl">
                  {community.name.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="truncate text-2xl font-bold sm:text-3xl">{community.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">{KIND_LABEL_BN[community.kind]}</Badge>
                {community.group_type ? (
                  <Badge variant="outline" className="text-[10px]">{GROUP_TYPE_LABEL_BN[community.group_type]}</Badge>
                ) : null}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {community.area ? (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {community.area}</span>
                ) : null}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {community.member_count} সদস্য</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> প্রতিষ্ঠা: {formatDateBn(community.created_at)}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 sm:pb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void shareLink(community.name, `/community/c/${slug}`).then((r) => r === "copied" && toast.success("লিংক কপি হয়েছে"))}
              >
                <Share2 className="mr-1.5 h-4 w-4" /> শেয়ার
              </Button>
              <Button size="sm" disabled={busy} onClick={toggleJoin} variant={isMember ? "outline" : "default"}>
                {isMember ? "সদস্যপদ ছাড়ুন" : "যোগ দিন"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="about" className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="about">পরিচিতি</TabsTrigger>
          <TabsTrigger value="committee">কমিটি</TabsTrigger>
          <TabsTrigger value="advisors">উপদেষ্টা</TabsTrigger>
          <TabsTrigger value="members">সদস্য</TabsTrigger>
          <TabsTrigger value="posts">পোস্ট</TabsTrigger>
          <TabsTrigger value="events">অনুষ্ঠান</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4">
          <Card className="p-5">
            {community.description ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{community.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">কোনো পরিচিতি যোগ করা হয়নি।</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="committee" className="mt-4 space-y-4">
          {canManage ? (
            <CommitteeManager communityId={community.id} positions={clubData.positions} usedPositionIds={usedPositionIds} />
          ) : null}
          {membersQ.isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <CommitteeList
              data={clubData}
              profiles={profiles}
              phones={phones}
              canManage={!!canManage}
              onManage={setManageUserId}
            />
          )}
        </TabsContent>

        <TabsContent value="advisors" className="mt-4">
          {membersQ.isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <AdvisorSection
              data={clubData}
              profiles={profiles}
              phones={phones}
              canManage={!!canManage}
              onManage={setManageUserId}
            />
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          {membersQ.isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <MemberDirectory
              communityId={community.id}
              data={clubData}
              profiles={profiles}
              phones={phones}
              canManage={!!canManage}
              onManage={setManageUserId}
            />
          )}
        </TabsContent>

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
      </Tabs>

      <MemberManageDialog
        open={!!manageMember}
        onOpenChange={(v) => !v && setManageUserId(null)}
        communityId={community.id}
        member={manageMember}
        {...(manageUserId && profiles.get(manageUserId) ? { profile: profiles.get(manageUserId) } : {})}
        positions={clubData.positions}
        badges={manageUserId ? badgesOf.get(manageUserId) ?? [] : []}
        isOwner={!!isOwner}
      />
    </div>
  );
}
