import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  BADGE_ICON,
  BADGE_LABEL_BN,
  COMMUNITY_BADGES,
  MEMBER_STATUS_LABEL_BN,
  PHONE_VISIBILITY_LABEL_BN,
  type CommunityBadge,
  type CommunityMemberDetail,
  type CommunityMemberStatus,
  type CommunityPhoneVisibility,
  type CommunityPositionRow,
  type CommunityPublicProfile,
} from "@/lib/community-shared";

const NO_POSITION = "__none__";

/**
 * Owner/admin panel for a single member: position, custom title, badges,
 * role, status, phone privacy and removal.
 */
export function MemberManageDialog({
  open,
  onOpenChange,
  communityId,
  member,
  profile,
  positions,
  badges,
  isOwner,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  communityId: string;
  member: CommunityMemberDetail | null;
  profile?: CommunityPublicProfile;
  positions: CommunityPositionRow[];
  badges: CommunityBadge[];
  isOwner: boolean;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [customTitle, setCustomTitle] = useState(member?.custom_title ?? "");

  if (!member) return null;

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["club-members", communityId] });
    await qc.invalidateQueries({ queryKey: ["community-detail-content", communityId] });
    await qc.invalidateQueries({ queryKey: ["club-phones", communityId] });
  };

  const patch = async (values: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("community_members")
        .update(values)
        .eq("community_id", communityId)
        .eq("user_id", member.user_id);
      if (error) throw error;
      await refresh();
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message || "কাজটি সম্পন্ন হয়নি");
    } finally {
      setBusy(false);
    }
  };

  const toggleBadge = async (badge: CommunityBadge) => {
    setBusy(true);
    try {
      if (badges.includes(badge)) {
        const { error } = await supabase
          .from("community_member_badges")
          .delete()
          .eq("community_id", communityId)
          .eq("user_id", member.user_id)
          .eq("badge", badge);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("community_member_badges")
          .insert({ community_id: communityId, user_id: member.user_id, badge });
        if (error) throw error;
      }
      await refresh();
    } catch (e) {
      toast.error((e as Error).message || "ব্যাজ আপডেট হয়নি");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async () => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", member.user_id);
      if (error) throw error;
      await refresh();
      toast.success("সদস্য সরানো হয়েছে");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "সরানো যায়নি");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{profile?.full_name || "সদস্য"} — ব্যবস্থাপনা</DialogTitle>
          <DialogDescription>পদ, ব্যাজ, ভূমিকা ও গোপনীয়তা সেটিং পরিবর্তন করুন।</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>কমিটির পদ</Label>
            <Select
              value={member.position_id ?? NO_POSITION}
              onValueChange={(v) => void patch({ position_id: v === NO_POSITION ? null : v }, "পদ আপডেট হয়েছে")}
            >
              <SelectTrigger><SelectValue placeholder="পদ নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_POSITION}>পদ নেই</SelectItem>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name_bn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custom-title">কাস্টম টাইটেল (ঐচ্ছিক)</Label>
            <div className="flex gap-2">
              <Input
                id="custom-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="যেমন: প্রধান উপদেষ্টা"
              />
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void patch({ custom_title: customTitle.trim() || null }, "টাইটেল সংরক্ষিত")}
              >
                সংরক্ষণ
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>ব্যাজ</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMUNITY_BADGES.map((b) => (
                <button key={b} type="button" disabled={busy} onClick={() => void toggleBadge(b)}>
                  <Badge variant={badges.includes(b) ? "default" : "outline"} className="cursor-pointer text-[11px]">
                    {BADGE_ICON[b]} {BADGE_LABEL_BN[b]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>অবস্থা</Label>
              <Select
                value={member.status}
                onValueChange={(v) => void patch({ status: v as CommunityMemberStatus }, "অবস্থা আপডেট হয়েছে")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{MEMBER_STATUS_LABEL_BN.active}</SelectItem>
                  <SelectItem value="inactive">{MEMBER_STATUS_LABEL_BN.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>মোবাইল নম্বর কে দেখবে</Label>
              <Select
                value={member.phone_visibility}
                onValueChange={(v) =>
                  void patch({ phone_visibility: v as CommunityPhoneVisibility }, "গোপনীয়তা আপডেট হয়েছে")
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PHONE_VISIBILITY_LABEL_BN) as CommunityPhoneVisibility[]).map((k) => (
                    <SelectItem key={k} value={k}>{PHONE_VISIBILITY_LABEL_BN[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isOwner && member.role !== "owner" ? (
            <div className="space-y-1.5">
              <Label>ভূমিকা</Label>
              <div className="flex gap-2">
                {member.role === "member" ? (
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => void patch({ role: "admin" }, "অ্যাডমিন করা হয়েছে")}>
                    ⬆️ অ্যাডমিন করুন
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => void patch({ role: "member" }, "সদস্য করা হয়েছে")}>
                    ⬇️ অ্যাডমিন সরান
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {member.role !== "owner" ? (
            <Button variant="destructive" size="sm" disabled={busy} onClick={() => void removeMember()}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} 🚫 সদস্য সরান
            </Button>
          ) : <span />}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>বন্ধ করুন</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
