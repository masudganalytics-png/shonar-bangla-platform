import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, ShieldCheck, Shield, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { listUsers, setUserRole, exportUsersCsv } from "@/lib/admin.functions";
import { downloadCsv } from "@/lib/download";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const setRoleFn = useServerFn(setUserRole);
  const exportFn = useServerFn(exportUsersCsv);

  const q = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listUsers(),
    staleTime: 30_000,
  });

  const mut = useMutation({
    mutationFn: (v: { user_id: string; role: "user" | "admin" }) => setRoleFn({ data: v }),
    onSuccess: () => {
      toast.success("রোল আপডেট হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (q.data ?? []).filter((u) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return [u.full_name, u.email, u.phone, u.meter_no].some((f) => (f ?? "").toLowerCase().includes(s));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="নাম / ইমেইল / মিটার খুঁজুন…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={async () => {
            const r = await exportFn();
            downloadCsv(r.filename, r.content);
          }}>
            <Download className="mr-2 h-4 w-4" /> CSV এক্সপোর্ট
          </Button>
        </div>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : q.isError ? (
        <Card className="p-6 text-sm text-destructive">লোড করা যায়নি।</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">নাম</th>
                <th className="p-3 text-left">ইমেইল</th>
                <th className="p-3 text-left">ফোন</th>
                <th className="p-3 text-left">মিটার</th>
                <th className="p-3 text-left">যোগদান</th>
                <th className="p-3 text-left">রোল</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{u.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                  <td className="p-3">{u.phone || "—"}</td>
                  <td className="p-3">{u.meter_no || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatBanglaDate(u.created_at)}</td>
                  <td className="p-3">
                    {u.role === "admin"
                      ? <Badge className="bg-primary text-primary-foreground">অ্যাডমিন</Badge>
                      : <Badge variant="outline">ব্যবহারকারী</Badge>}
                  </td>
                  <td className="p-3 text-right">
                    {u.role === "admin" ? (
                      <Button size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate({ user_id: u.id, role: "user" })}>
                        <Shield className="mr-1 h-3 w-3" /> অপসারণ
                      </Button>
                    ) : (
                      <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate({ user_id: u.id, role: "admin" })}>
                        {mut.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
                        অ্যাডমিন করুন
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">কোনো ব্যবহারকারী পাওয়া যায়নি।</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
