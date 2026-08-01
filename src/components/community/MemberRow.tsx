import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, ShieldCheck, ShieldMinus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMemberPhone } from "@/lib/community.functions";
import {
  MEMBER_ROLE_LABEL_BN,
  type CommunityMemberRole,
  type CommunityPublicProfile,
} from "@/lib/community-shared";

/**
 * One member row. Manager controls (promote / demote / remove) and the private
 * phone reveal are shown only when `canManage` is true; the phone itself is
 * re-authorised server-side by `can_view_member_phone`.
 */
export function MemberRow({
  userId,
  role,
  profile,
  canManage,
  onChangeRole,
  onRemove,
}: {
  userId: string;
  role: CommunityMemberRole;
  profile?: CommunityPublicProfile;
  canManage: boolean;
  onChangeRole: (userId: string, role: CommunityMemberRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [busy, setBusy] = useState(false);

  const revealPhone = async () => {
    setLoadingPhone(true);
    try {
      const res = (await getMemberPhone({ data: { userId } })) as { phone: string | null; allowed: boolean };
      if (!res.allowed) {
        toast.error("মোবাইল নম্বর দেখার অনুমতি নেই");
        return;
      }
      if (!res.phone) {
        toast.info("এই সদস্য কোনো মোবাইল নম্বর দেননি");
        return;
      }
      setPhone(res.phone);
    } catch {
      toast.error("নম্বর আনা যায়নি");
    } finally {
      setLoadingPhone(false);
    }
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch {
      toast.error("কাজটি সম্পন্ন হয়নি");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/community/u/$userId"
          params={{ userId }}
          className="flex min-w-0 items-center gap-2 text-sm hover:text-primary"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (profile?.full_name || "ব").slice(0, 1)
            )}
          </span>
          <span className="truncate">{profile?.full_name || "ব্যবহারকারী"}</span>
        </Link>
        <Badge variant={role === "member" ? "outline" : "secondary"} className="shrink-0 text-[10px]">
          {MEMBER_ROLE_LABEL_BN[role]}
        </Badge>
      </div>

      {canManage ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {phone ? (
            <a href={`tel:${phone}`} className="text-xs font-medium text-primary underline">
              {phone}
            </a>
          ) : (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={loadingPhone} onClick={revealPhone}>
              <Phone className="mr-1 h-3.5 w-3.5" /> নম্বর দেখুন
            </Button>
          )}
          {role === "member" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={busy}
              onClick={() => void run(() => onChangeRole(userId, "admin"))}
            >
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> অ্যাডমিন করুন
            </Button>
          ) : null}
          {role === "admin" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={busy}
              onClick={() => void run(() => onChangeRole(userId, "member"))}
            >
              <ShieldMinus className="mr-1 h-3.5 w-3.5" /> সদস্য করুন
            </Button>
          ) : null}
          {role !== "owner" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => void run(() => onRemove(userId))}
            >
              <UserMinus className="mr-1 h-3.5 w-3.5" /> সরান
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
