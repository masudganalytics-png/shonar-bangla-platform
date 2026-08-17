import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminCreateGovtWorker } from "@/lib/govt.functions";
import {
  GOVT_BIO_MAX,
  GOVT_DEPARTMENTS,
  GOVT_DISTRICT_FILTERS,
  GOVT_TIPS_MAX,
  UKHIYA_AREAS,
  normalizeGovtPhone,
  type GovtPhoneVisibility,
} from "@/lib/govt-shared";

type FormState = {
  full_name: string;
  photo_url: string;
  designation: string;
  organization: string;
  department: string;
  job_category: string;
  current_workplace: string;
  current_district: string;
  current_upazila: string;
  ukhiya_area: string;
  joining_year: string;
  bio: string;
  tips_for_younger: string;
  phone: string;
  whatsapp: string;
  official_email: string;
  phone_visibility: GovtPhoneVisibility;
  publish: boolean;
};

const EMPTY: FormState = {
  full_name: "",
  photo_url: "",
  designation: "",
  organization: "",
  department: GOVT_DEPARTMENTS[0],
  job_category: "",
  current_workplace: "",
  current_district: GOVT_DISTRICT_FILTERS[0],
  current_upazila: "",
  ukhiya_area: UKHIYA_AREAS[0],
  joining_year: "",
  bio: "",
  tips_for_younger: "",
  phone: "",
  whatsapp: "",
  official_email: "",
  phone_visibility: "members",
  publish: true,
};

const orNull = (v: string) => (v.trim() ? v.trim() : null);

export function AdminGovtCreateDialog({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(adminCreateGovtWorker);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () =>
      create({
        data: {
          full_name: form.full_name.trim(),
          photo_url: orNull(form.photo_url),
          designation: form.designation.trim(),
          organization: form.organization.trim(),
          department: form.department,
          job_category: orNull(form.job_category),
          current_workplace: orNull(form.current_workplace),
          current_district: form.current_district,
          current_upazila: orNull(form.current_upazila),
          ukhiya_area: form.ukhiya_area,
          joining_year: form.joining_year.trim() ? Number(form.joining_year) : null,
          bio: orNull(form.bio),
          tips_for_younger: orNull(form.tips_for_younger),
          phone: form.phone.trim() ? normalizeGovtPhone(form.phone) : null,
          whatsapp: form.whatsapp.trim() ? normalizeGovtPhone(form.whatsapp) : null,
          official_email: orNull(form.official_email),
          phone_visibility: form.phone_visibility,
          status: form.publish ? ("approved" as const) : ("pending" as const),
          is_verified: form.publish,
          admin_note: null,
        },
      }),
    onSuccess: () => {
      toast.success("প্রোফাইল যোগ করা হয়েছে");
      setForm(EMPTY);
      setOpen(false);
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.full_name.trim().length < 2) return toast.error("পূর্ণ নাম লিখুন");
    if (form.designation.trim().length < 2) return toast.error("পদবি লিখুন");
    if (form.organization.trim().length < 2) return toast.error("প্রতিষ্ঠানের নাম লিখুন");
    mut.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          নতুন প্রোফাইল যোগ করুন
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>নতুন সরকারি চাকরিজীবী যোগ করুন</DialogTitle>
          <DialogDescription>
            ব্যবহারকারীর অ্যাকাউন্ট ছাড়াই অ্যাডমিন হিসেবে সরাসরি প্রোফাইল যুক্ত করুন।
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>পূর্ণ নাম *</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label>ছবির লিংক</Label>
              <Input value={form.photo_url} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>পদবি *</Label>
              <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>প্রতিষ্ঠান *</Label>
              <Input value={form.organization} onChange={(e) => set("organization", e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label>দপ্তর *</Label>
              <Select value={form.department} onValueChange={(v) => set("department", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOVT_DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>চাকরির ধরন</Label>
              <Input value={form.job_category} onChange={(e) => set("job_category", e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label>বর্তমান কর্মস্থল</Label>
              <Input value={form.current_workplace} onChange={(e) => set("current_workplace", e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label>কর্মস্থলের জেলা *</Label>
              <Select value={form.current_district} onValueChange={(v) => set("current_district", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOVT_DISTRICT_FILTERS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>উপজেলা</Label>
              <Input value={form.current_upazila} onChange={(e) => set("current_upazila", e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label>উখিয়ার এলাকা *</Label>
              <Select value={form.ukhiya_area} onValueChange={(v) => set("ukhiya_area", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UKHIYA_AREAS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>চাকরিতে যোগদানের সাল</Label>
              <Input
                inputMode="numeric"
                value={form.joining_year}
                onChange={(e) => set("joining_year", e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ফোন</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>হোয়াটসঅ্যাপ</Label>
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>দাপ্তরিক ইমেইল</Label>
              <Input type="email" value={form.official_email} onChange={(e) => set("official_email", e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label>নম্বর দেখাবে</Label>
              <Select value={form.phone_visibility} onValueChange={(v) => set("phone_visibility", v as GovtPhoneVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">সবাই</SelectItem>
                  <SelectItem value="members">শুধু লগইন করা সদস্য</SelectItem>
                  <SelectItem value="hidden">কেউ নয়</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>সংক্ষিপ্ত পরিচিতি</Label>
            <Textarea rows={3} maxLength={GOVT_BIO_MAX} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>নবীনদের জন্য পরামর্শ</Label>
            <Textarea
              rows={3}
              maxLength={GOVT_TIPS_MAX}
              value={form.tips_for_younger}
              onChange={(e) => set("tips_for_younger", e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.publish} onCheckedChange={(v) => set("publish", v === true)} />
            সঙ্গে সঙ্গে অনুমোদন ও যাচাই করে প্রকাশ করুন
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
