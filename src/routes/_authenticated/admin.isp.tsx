import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wifi, Package } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listIsps,
  saveIsp,
  setIspActive,
  deleteIsp,
  saveIspPackage,
  deleteIspPackage,
} from "@/lib/isp-admin.functions";
import { ISP_AREAS, ispAreaLabel, type IspPackage, type IspRecord } from "@/lib/isp-shared";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/isp")({
  component: AdminIspPage,
});

type IspForm = {
  id?: string;
  name: string;
  note: string;
  phones: string;
  is_btrc_approved: boolean;
  is_active: boolean;
  sort_order: number;
  areas: string[];
};

const EMPTY_ISP: IspForm = {
  name: "",
  note: "",
  phones: "",
  is_btrc_approved: false,
  is_active: true,
  sort_order: 100,
  areas: [],
};

function AdminIspPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "isps"], queryFn: () => listIsps() });
  const [ispForm, setIspForm] = useState<IspForm | null>(null);
  const [pkgForm, setPkgForm] = useState<
    (Partial<IspPackage> & { isp_id: string; name: string }) | null
  >(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "isps"] });

  const saveIspM = useMutation({
    mutationFn: (f: IspForm) =>
      saveIsp({
        data: {
          ...(f.id ? { id: f.id } : {}),
          name: f.name.trim(),
          note: f.note.trim(),
          phones: f.phones
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
          is_btrc_approved: f.is_btrc_approved,
          is_active: f.is_active,
          sort_order: Number(f.sort_order) || 100,
          areas: f.areas,
        },
      }),
    onSuccess: () => {
      toast.success("ISP সংরক্ষিত হয়েছে");
      setIspForm(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => setIspActive({ data: v }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteIsp({ data: { id } }),
    onSuccess: () => {
      toast.success("ISP মুছে ফেলা হয়েছে");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePkgM = useMutation({
    mutationFn: (p: Partial<IspPackage> & { isp_id: string; name: string }) =>
      saveIspPackage({
        data: {
          ...(p.id ? { id: p.id } : {}),
          isp_id: p.isp_id,
          name: p.name.trim(),
          speed_mbps: p.speed_mbps ?? null,
          price: p.price ?? null,
          note: p.note ?? "",
          is_active: p.is_active ?? true,
          sort_order: p.sort_order ?? 100,
        },
      }),
    onSuccess: () => {
      toast.success("প্যাকেজ সংরক্ষিত হয়েছে");
      setPkgForm(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePkgM = useMutation({
    mutationFn: (id: string) => deleteIspPackage({ data: { id } }),
    onSuccess: () => {
      toast.success("প্যাকেজ মুছে ফেলা হয়েছে");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isps = useMemo(() => q.data ?? [], [q.data]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">📶 ওয়াইফাই / ISP ব্যবস্থাপনা</h2>
          <p className="text-xs text-muted-foreground">
            ISP যোগ করুন, সম্পাদনা করুন, এলাকা ও প্যাকেজ নির্ধারণ করুন।
          </p>
        </div>
        <Button onClick={() => setIspForm({ ...EMPTY_ISP })}>
          <Plus className="mr-1.5 h-4 w-4" /> নতুন ISP
        </Button>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : q.isError ? (
        <Card className="p-6 text-sm text-destructive">
          লোড করা যায়নি: {String((q.error as Error).message)}
        </Card>
      ) : isps.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          কোনো ISP যোগ করা হয়নি।
        </Card>
      ) : (
        <div className="grid gap-4">
          {isps.map((isp) => (
            <IspCard
              key={isp.id}
              isp={isp}
              onEdit={() =>
                setIspForm({
                  id: isp.id,
                  name: isp.name,
                  note: isp.note,
                  phones: isp.phones.join(", "),
                  is_btrc_approved: isp.is_btrc_approved,
                  is_active: isp.is_active,
                  sort_order: isp.sort_order,
                  areas: isp.areas,
                })
              }
              onToggle={(v) => toggleM.mutate({ id: isp.id, is_active: v })}
              onDelete={() => {
                if (confirm(`"${isp.name}" মুছে ফেলবেন?`)) deleteM.mutate(isp.id);
              }}
              onAddPackage={() => setPkgForm({ isp_id: isp.id, name: "" })}
              onEditPackage={(p) => setPkgForm({ ...p })}
              onDeletePackage={(p) => {
                if (confirm(`"${p.name}" প্যাকেজ মুছে ফেলবেন?`)) deletePkgM.mutate(p.id);
              }}
            />
          ))}
        </div>
      )}

      {/* ISP form */}
      <Dialog open={!!ispForm} onOpenChange={(o) => !o && setIspForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ispForm?.id ? "ISP সম্পাদনা" : "নতুন ISP"}</DialogTitle>
          </DialogHeader>
          {ispForm && (
            <div className="grid gap-4">
              <div>
                <Label>নাম</Label>
                <Input
                  value={ispForm.name}
                  onChange={(e) => setIspForm({ ...ispForm, name: e.target.value })}
                  placeholder="যেমন: Mim Online"
                />
              </div>
              <div>
                <Label>বিবরণ / নোট</Label>
                <Input
                  value={ispForm.note}
                  onChange={(e) => setIspForm({ ...ispForm, note: e.target.value })}
                  placeholder="যেমন: লোকাল ISP"
                />
              </div>
              <div>
                <Label>মোবাইল নম্বর (কমা দিয়ে একাধিক)</Label>
                <Input
                  value={ispForm.phones}
                  onChange={(e) => setIspForm({ ...ispForm, phones: e.target.value })}
                  placeholder="01817-969696, 01846-868686"
                />
              </div>
              <div>
                <Label className="mb-2 block">এলাকা</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ISP_AREAS.map((a) => (
                    <label key={a.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={ispForm.areas.includes(a.value)}
                        onCheckedChange={(c) =>
                          setIspForm({
                            ...ispForm,
                            areas: c
                              ? [...ispForm.areas, a.value]
                              : ispForm.areas.filter((x) => x !== a.value),
                          })
                        }
                      />
                      {a.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>ক্রম (ছোট আগে)</Label>
                <Input
                  type="number"
                  value={ispForm.sort_order}
                  onChange={(e) =>
                    setIspForm({ ...ispForm, sort_order: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">BTRC অনুমোদিত</span>
                <Switch
                  checked={ispForm.is_btrc_approved}
                  onCheckedChange={(v) => setIspForm({ ...ispForm, is_btrc_approved: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">সক্রিয়</span>
                <Switch
                  checked={ispForm.is_active}
                  onCheckedChange={(v) => setIspForm({ ...ispForm, is_active: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIspForm(null)}>
              বাতিল
            </Button>
            <Button
              disabled={!ispForm?.name.trim() || saveIspM.isPending}
              onClick={() => ispForm && saveIspM.mutate(ispForm)}
            >
              সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package form */}
      <Dialog open={!!pkgForm} onOpenChange={(o) => !o && setPkgForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pkgForm?.id ? "প্যাকেজ সম্পাদনা" : "নতুন প্যাকেজ"}</DialogTitle>
          </DialogHeader>
          {pkgForm && (
            <div className="grid gap-4">
              <div>
                <Label>প্যাকেজের নাম</Label>
                <Input
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                  placeholder="যেমন: হোম বেসিক"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>স্পিড (Mbps)</Label>
                  <Input
                    type="number"
                    value={pkgForm.speed_mbps ?? ""}
                    onChange={(e) =>
                      setPkgForm({
                        ...pkgForm,
                        speed_mbps: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>মাসিক মূল্য (৳)</Label>
                  <Input
                    type="number"
                    value={pkgForm.price ?? ""}
                    onChange={(e) =>
                      setPkgForm({
                        ...pkgForm,
                        price: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>নোট</Label>
                <Input
                  value={pkgForm.note ?? ""}
                  onChange={(e) => setPkgForm({ ...pkgForm, note: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">সক্রিয়</span>
                <Switch
                  checked={pkgForm.is_active ?? true}
                  onCheckedChange={(v) => setPkgForm({ ...pkgForm, is_active: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPkgForm(null)}>
              বাতিল
            </Button>
            <Button
              disabled={!pkgForm?.name.trim() || savePkgM.isPending}
              onClick={() => pkgForm && savePkgM.mutate(pkgForm)}
            >
              সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IspCard({
  isp,
  onEdit,
  onToggle,
  onDelete,
  onAddPackage,
  onEditPackage,
  onDeletePackage,
}: {
  isp: IspRecord;
  onEdit: () => void;
  onToggle: (v: boolean) => void;
  onDelete: () => void;
  onAddPackage: () => void;
  onEditPackage: (p: IspPackage) => void;
  onDeletePackage: (p: IspPackage) => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{isp.name}</h3>
              {isp.is_btrc_approved && <Badge>BTRC</Badge>}
              <Badge variant={isp.is_active ? "secondary" : "outline"}>
                {isp.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{isp.note}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              এলাকা: {isp.areas.length ? isp.areas.map(ispAreaLabel).join(", ") : "নির্ধারিত নয়"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              নম্বর: {isp.phones.length ? isp.phones.join(", ") : "নেই"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isp.is_active} onCheckedChange={onToggle} aria-label="সক্রিয়" />
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium">
            <Package className="h-4 w-4" /> প্যাকেজ ({toBanglaDigits(isp.packages.length)})
          </p>
          <Button size="sm" variant="outline" onClick={onAddPackage}>
            <Plus className="mr-1 h-3.5 w-3.5" /> যোগ করুন
          </Button>
        </div>
        {isp.packages.length === 0 ? (
          <p className="text-xs text-muted-foreground">কোনো প্যাকেজ নেই।</p>
        ) : (
          <div className="grid gap-2">
            {isp.packages.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {p.speed_mbps !== null && `${toBanglaDigits(p.speed_mbps)} Mbps`}
                    {p.price !== null && ` • ৳${toBanglaDigits(p.price)}`}
                    {!p.is_active && " • নিষ্ক্রিয়"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onEditPackage(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDeletePackage(p)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
