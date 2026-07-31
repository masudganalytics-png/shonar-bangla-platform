import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { PostCard } from "@/components/community/PostCard";
import { EventCard } from "@/components/community/EventCard";
import { useCommunityProfiles } from "@/components/community/use-community-profiles";
import type { CommunityEventRow, CommunityPostRow, CommunityRow, FeedItem } from "@/lib/community-shared";

export const Route = createFileRoute("/community/feed")({
  head: () => ({
    meta: [
      { title: "কমিউনিটি ফিড — উখিয়া সেবা" },
      {
        name: "description",
        content: "উখিয়ার কমিউনিটি, ক্লাব ও গ্রুপের সব পোস্ট এবং পাবলিক অনুষ্ঠান একসাথে, সর্বশেষ আগে।",
      },
      { property: "og:title", content: "কমিউনিটি ফিড — উখিয়া সেবা" },
      { property: "og:description", content: "স্থানীয় কমিউনিটির সর্বশেষ পোস্ট ও অনুষ্ঠান।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityFeed,
});

function CommunityFeed() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [communityId, setCommunityId] = useState<string>("none");

  const feedQ = useQuery({
    queryKey: ["community-feed"],
    queryFn: async () => {
      const [posts, events, communities] = await Promise.all([
        supabase
          .from("community_posts")
          .select("*")
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("community_events")
          .select("*")
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("communities").select("*").eq("is_active", true),
      ]);
      if (posts.error) throw posts.error;
      if (events.error) throw events.error;
      return {
        posts: (posts.data ?? []) as CommunityPostRow[],
        events: (events.data ?? []) as CommunityEventRow[],
        communities: (communities.data ?? []) as CommunityRow[],
      };
    },
  });

  const myCommunitiesQ = useQuery({
    queryKey: ["community-mine", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("community_members").select("community_id").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.community_id);
    },
  });

  const items: FeedItem[] = useMemo(() => {
    const d = feedQ.data;
    if (!d) return [];
    const merged: FeedItem[] = [
      ...d.posts.map((p) => ({ type: "post" as const, id: p.id, created_at: p.created_at, post: p })),
      ...d.events.map((e) => ({ type: "event" as const, id: e.id, created_at: e.created_at, event: e })),
    ];
    return merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [feedQ.data]);

  const profiles = useCommunityProfiles(
    items.map((i) => (i.type === "post" ? i.post.author_id : i.event.organizer_id)),
  );

  const communityById = useMemo(() => {
    const m = new Map<string, CommunityRow>();
    for (const c of feedQ.data?.communities ?? []) m.set(c.id, c);
    return m;
  }, [feedQ.data]);

  const myCommunities = (feedQ.data?.communities ?? []).filter((c) =>
    (myCommunitiesQ.data ?? []).includes(c.id),
  );

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("সাইন ইন করুন");
      const text = content.trim();
      if (text.length < 2) throw new Error("কিছু লিখুন");
      if (text.length > 3000) throw new Error("পোস্ট অনেক বড় হয়ে গেছে");
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadImageToCloudinary(file, "community/posts");
      const { error } = await supabase.from("community_posts").insert({
        author_id: user.id,
        content: text,
        image_url: imageUrl,
        community_id: communityId === "none" ? null : communityId,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setContent("");
      setFile(null);
      toast.success("পোস্ট প্রকাশিত হয়েছে");
      await qc.invalidateQueries({ queryKey: ["community-feed"] });
    },
    onError: (e: Error) => toast.error(e.message || "পোস্ট করা যায়নি"),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📰 কমিউনিটি ফিড</h1>
          <p className="text-sm text-muted-foreground">সব পোস্ট ও অনুষ্ঠান — সর্বশেষ আগে</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/community">ফিরে যান</Link>
        </Button>
      </div>

      {isAuthenticated ? (
        <Card className="mt-6 p-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="আপনার এলাকার খবর, ঘোষণা বা অভিজ্ঞতা লিখুন..."
            rows={3}
            maxLength={3000}
          />
          {file ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border p-2 text-xs">
              <span className="flex-1 truncate">{file.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <ImagePlus className="mr-1.5 h-4 w-4" /> ছবি
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Button>

            {myCommunities.length > 0 ? (
              <Select value={communityId} onValueChange={setCommunityId}>
                <SelectTrigger className="h-9 w-auto min-w-[10rem] text-xs">
                  <SelectValue placeholder="কোথায় পোস্ট করবেন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">সাধারণ কমিউনিটি</SelectItem>
                  {myCommunities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <Button
              size="sm"
              className="ml-auto"
              disabled={createPost.isPending || content.trim().length < 2}
              onClick={() => createPost.mutate()}
            >
              {createPost.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              পোস্ট করুন
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
          <p className="flex-1 text-sm text-muted-foreground">পোস্ট করতে, লাইক দিতে বা যোগ দিতে সাইন ইন করুন।</p>
          <Button asChild size="sm">
            <Link to="/auth">সাইন ইন</Link>
          </Button>
        </Card>
      )}

      <div className="mt-6 space-y-4">
        {feedQ.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">এখনো কোনো পোস্ট নেই।</Card>
        ) : (
          items.map((item) =>
            item.type === "post" ? (
              <PostCard
                key={item.id}
                p={item.post}
                author={profiles.get(item.post.author_id)}
                community={item.post.community_id ? communityById.get(item.post.community_id) : undefined}
              />
            ) : (
              <EventCard key={item.id} e={item.event} organizer={profiles.get(item.event.organizer_id)} />
            ),
          )
        )}
      </div>
    </div>
  );
}
