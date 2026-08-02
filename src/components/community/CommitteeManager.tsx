import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { CommunityPositionRow } from "@/lib/community-shared";

/**
 * Owner/admin committee position manager: add, rename, delete and reorder
 * (drag & drop) the positions of one community.
 */
export function CommitteeManager({
  communityId,
  positions,
  usedPositionIds,
}: {
  communityId: string;
  positions: CommunityPositionRow[];
  usedPositionIds: Set<string>;
}) {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["club-members", communityId] });

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message || "কাজটি সম্পন্ন হয়নি");
    } finally {
      setBusy(false);
    }
  };

  const addPosition = () =>
    void run(async () => {
      const name = newName.trim();
      if (name.length < 2) throw new Error("পদের নাম লিখুন");
      const { error } = await supabase.from("community_positions").insert({
        community_id: communityId,
        name_bn: name,
        sort_order: (positions.at(-1)?.sort_order ?? 0) + 10,
      });
      if (error) throw error;
      setNewName("");
    }, "পদ যোগ হয়েছে");

  const rename = (id: string) =>
    void run(async () => {
      const name = editName.trim();
      if (name.length < 2) throw new Error("পদের নাম লিখুন");
      const { error } = await supabase.from("community_positions").update({ name_bn: name }).eq("id", id);
      if (error) throw error;
      setEditingId(null);
    }, "পদের নাম পরিবর্তন হয়েছে");

  const remove = (p: CommunityPositionRow) =>
    void run(async () => {
      if (usedPositionIds.has(p.id)) throw new Error("এই পদে সদস্য আছেন — আগে পদ পরিবর্তন করুন");
      const { error } = await supabase.from("community_positions").delete().eq("id", p.id);
      if (error) throw error;
    }, "পদ মুছে ফেলা হয়েছে");

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const list = [...positions];
    const from = list.findIndex((p) => p.id === fromId);
    const to = list.findIndex((p) => p.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved!);
    void run(async () => {
      await Promise.all(
        list.map((p, i) => supabase.from("community_positions").update({ sort_order: (i + 1) * 10 }).eq("id", p.id)),
      );
    }, "ক্রম আপডেট হয়েছে");
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = positions.findIndex((p) => p.id === id);
    const target = positions[idx + dir];
    if (!target) return;
    reorder(id, target.id);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">কমিটির পদ ব্যবস্থাপনা</h3>
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">টেনে এনে (drag) ক্রম পরিবর্তন করুন।</p>

      <div className="mt-3 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="নতুন পদের নাম"
          aria-label="নতুন পদের নাম"
        />
        <Button size="sm" onClick={addPosition} disabled={busy}>
          <Plus className="mr-1 h-4 w-4" /> যোগ
        </Button>
      </div>

      <ul className="mt-3 space-y-1.5">
        {positions.map((p, i) => (
          <li
            key={p.id}
            draggable
            onDragStart={() => setDragId(p.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) reorder(dragId, p.id);
              setDragId(null);
            }}
            className="flex items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-1.5"
          >
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
            {editingId === p.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8"
                  aria-label="পদের নাম"
                />
                <Button size="sm" className="h-8" onClick={() => rename(p.id)} disabled={busy}>
                  সংরক্ষণ
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                  বাতিল
                </Button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-sm">{p.name_bn}</span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={i === 0 || busy}
                    onClick={() => move(p.id, -1)}
                    aria-label="উপরে"
                  >
                    ↑
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={i === positions.length - 1 || busy}
                    onClick={() => move(p.id, 1)}
                    aria-label="নিচে"
                  >
                    ↓
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name_bn);
                    }}
                    aria-label="নাম পরিবর্তন"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={busy}
                    onClick={() => remove(p)}
                    aria-label="পদ মুছুন"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
