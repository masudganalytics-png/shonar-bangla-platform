import { useState } from "react";
import { Heart, Share2, Flag } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { shareLink } from "@/lib/community-shared";
import { cn } from "@/lib/utils";

type Props = {
  targetType: "post" | "event";
  targetId: string;
  likeCount: number;
  shareTitle: string;
  sharePath: string;
  className?: string;
};

export function ReactionBar({ targetType, targetId, likeCount, shareTitle, sharePath, className }: Props) {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const myLike = useQuery({
    queryKey: ["community-my-reaction", targetType, targetId, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("community_likes")
        .select("id, kind")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const liked = (myLike.data ?? []).some((r) => r.kind === "like");
  const reported = (myLike.data ?? []).some((r) => r.kind === "report");

  const requireLogin = () => {
    toast.error("এই কাজটি করতে সাইন ইন করুন");
  };

  const toggleLike = async () => {
    if (!isAuthenticated || !user) return requireLogin();
    setBusy(true);
    try {
      if (liked) {
        await supabase
          .from("community_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .eq("kind", "like");
      } else {
        const { error } = await supabase
          .from("community_likes")
          .insert({ user_id: user.id, target_type: targetType, target_id: targetId, kind: "like" });
        if (error) throw error;
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["community-my-reaction", targetType, targetId, user.id] }),
        qc.invalidateQueries({ queryKey: ["community-feed"] }),
        qc.invalidateQueries({ queryKey: ["community-events"] }),
      ]);
    } catch {
      toast.error("দুঃখিত, কাজটি সম্পন্ন হয়নি");
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    try {
      const result = await shareLink(shareTitle, sharePath);
      if (result === "copied") toast.success("লিংক কপি হয়েছে");
    } catch {
      toast.error("শেয়ার করা যায়নি");
    }
  };

  const onReport = async () => {
    if (!isAuthenticated || !user) return requireLogin();
    if (reported) {
      toast.info("আপনি ইতিমধ্যে রিপোর্ট করেছেন");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("community_likes")
        .insert({ user_id: user.id, target_type: targetType, target_id: targetId, kind: "report" });
      if (error) throw error;
      toast.success("রিপোর্ট জমা হয়েছে, ধন্যবাদ");
      await qc.invalidateQueries({ queryKey: ["community-my-reaction", targetType, targetId, user.id] });
    } catch {
      toast.error("রিপোর্ট জমা হয়নি");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button variant="ghost" size="sm" disabled={busy} onClick={toggleLike} aria-label="লাইক">
        <Heart className={cn("mr-1.5 h-4 w-4", liked && "fill-red-500 text-red-500")} />
        <span className="text-xs font-medium">{likeCount > 0 ? likeCount : "লাইক"}</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onShare} aria-label="শেয়ার">
        <Share2 className="mr-1.5 h-4 w-4" />
        <span className="text-xs font-medium">শেয়ার</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={onReport}
        aria-label="রিপোর্ট"
        className="ml-auto text-muted-foreground"
      >
        <Flag className={cn("h-4 w-4", reported && "fill-amber-500 text-amber-500")} />
      </Button>
    </div>
  );
}
