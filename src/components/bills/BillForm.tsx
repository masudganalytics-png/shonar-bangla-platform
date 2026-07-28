import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ocrExtractBill } from "@/lib/ocr.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { toBanglaDigits } from "@/lib/bangla";
import {
  PROVIDERS, METER_TYPES, UNIONS, BN_MONTHS_FULL, YEAR_OPTIONS, CURRENT_YEAR,
} from "@/lib/bills-constants";
import type { Database } from "@/integrations/supabase/types";

type BillRow = Database["public"]["Tables"]["bills"]["Row"];

const schema = z.object({
  provider: z.string().min(1, "প্রোভাইডার নির্বাচন করুন"),
  meter_type: z.string().min(1, "মিটারের ধরন নির্বাচন করুন"),
  bill_month: z.number().int().min(1).max(12),
  bill_year: z.number().int().min(2000).max(2100),
  district: z.string().min(1),
  upazila: z.string().min(1),
  union_name: z.string().min(1, "ইউনিয়ন নির্বাচন করুন"),
  village: z.string().trim().min(1, "গ্রামের নাম লিখুন").max(120),
  family_members: z.number().int().min(1, "সদস্য সংখ্যা কমপক্ষে ১").max(100),
  units_consumed: z.number().min(0, "ইউনিট ০ বা তার বেশি হতে হবে").max(100000),
  amount: z.number().min(0, "বিলের পরিমাণ ০ বা তার বেশি").max(1_000_000),
  meter_no: z.string().trim().min(3, "মিটার নম্বর অন্তত ৩ অক্ষর").max(64),
  notes: z.string().max(500).optional().nullable(),
});

export type BillFormValues = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  initial?: BillRow | null;
}

const DEFAULTS: BillFormValues = {
  provider: "REB",
  meter_type: "postpaid",
  bill_month: new Date().getMonth() + 1,
  bill_year: CURRENT_YEAR,
  district: "Cox's Bazar",
  upazila: "Ukhiya",
  union_name: "",
  village: "",
  family_members: 4,
  units_consumed: 0,
  amount: 0,
  meter_no: "",
  notes: "",
};

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function BillForm({ mode, initial }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const runOcr = useServerFn(ocrExtractBill);

  const [values, setValues] = useState<BillFormValues>(() => {
    if (initial) {
      return {
        provider: initial.provider ?? "REB",
        meter_type: initial.meter_type ?? "postpaid",
        bill_month: initial.bill_month ?? new Date().getMonth() + 1,
        bill_year: initial.bill_year ?? CURRENT_YEAR,
        district: initial.district ?? "Cox's Bazar",
        upazila: initial.upazila ?? "Ukhiya",
        union_name: initial.union_name ?? "",
        village: initial.village ?? "",
        family_members: initial.family_members ?? 4,
        units_consumed: Number(initial.units_consumed) || 0,
        amount: Number(initial.amount) || 0,
        meter_no: initial.meter_no ?? "",
        notes: initial.notes ?? "",
      };
    }
    return DEFAULTS;
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BillFormValues, string>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.bill_image_url ?? null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load a signed preview for existing image (legacy Supabase Storage paths only).
    // Cloudinary URLs are used directly.
    let cancelled = false;
    if (initial?.bill_image_url && !imageFile) {
      const url = initial.bill_image_url;
      if (/^https?:\/\//i.test(url) && !url.includes("/bill-images/")) {
        // Cloudinary or external HTTPS URL — display as-is.
        setPreviewUrl(url);
        setExistingImagePath(null);
      } else {
        const marker = "/bill-images/";
        const idx = url.indexOf(marker);
        const path = idx >= 0 ? url.slice(idx + marker.length).split("?")[0] : url;
        if (path) {
          setExistingImagePath(path);
          supabase.storage.from("bill-images").createSignedUrl(path, 60 * 60).then(({ data }) => {
            if (!cancelled && data?.signedUrl) setPreviewUrl(data.signedUrl);
          });
        }
      }
    }
    return () => { cancelled = true; };
  }, [initial?.bill_image_url, imageFile]);

  const set = <K extends keyof BillFormValues>(key: K, val: BillFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("ছবির আকার ৮ MB এর কম হতে হবে");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ছবি ফাইল অনুমোদিত");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleOcr = async () => {
    if (!imageFile && !previewUrl) {
      toast.error("প্রথমে বিলের ছবি আপলোড করুন");
      return;
    }
    setOcrLoading(true);
    try {
      let dataUrl: string;
      if (imageFile) {
        dataUrl = await toDataUrl(imageFile);
      } else {
        // fetch signed url -> blob -> data url
        const res = await fetch(previewUrl!);
        const blob = await res.blob();
        dataUrl = await toDataUrl(new File([blob], "bill.jpg", { type: blob.type }));
      }
      const result = await runOcr({ data: { image_data_url: dataUrl } });
      const patch: Partial<BillFormValues> = {};
      if (result.month) patch.bill_month = result.month;
      if (result.year) patch.bill_year = result.year;
      if (result.units != null) patch.units_consumed = result.units;
      if (result.bill_amount != null) patch.amount = result.bill_amount;
      if (result.meter_number) patch.meter_no = result.meter_number;
      setValues((v) => ({ ...v, ...patch }));
      const filled = Object.keys(patch).length;
      if (filled === 0) toast.warning("কোনো তথ্য পড়া যায়নি — অনুগ্রহ করে ম্যানুয়ালি পূরণ করুন");
      else toast.success(`${toBanglaDigits(filled)} টি ফিল্ড স্বয়ংক্রিয়ভাবে পূরণ হয়েছে`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OCR ব্যর্থ হয়েছে";
      toast.error(msg);
    } finally {
      setOcrLoading(false);
    }
  };

  const dueDateFor = (year: number, month: number) => {
    // Default: last day of the billing month
    const d = new Date(year, month, 0);
    return d.toISOString().slice(0, 10);
  };
  const billingMonthFor = (year: number, month: number) =>
    `${year}-${String(month).padStart(2, "0")}-01`;

  const monthLabel = useMemo(() => BN_MONTHS_FULL[values.bill_month - 1], [values.bill_month]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("সাইন ইন প্রয়োজন");
      return;
    }
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof BillFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("অনুগ্রহ করে ফর্মের ভুলগুলো ঠিক করুন");
      return;
    }

    setSubmitting(true);
    try {
      // Duplicate check (client-side friendly message; DB unique index is the source of truth)
      const dupQuery = supabase
        .from("bills")
        .select("id")
        .eq("user_id", user.id)
        .eq("meter_no", parsed.data.meter_no)
        .eq("bill_year", parsed.data.bill_year)
        .eq("bill_month", parsed.data.bill_month)
        .limit(1);
      const { data: dupRows, error: dupErr } = await dupQuery;
      if (dupErr) throw dupErr;
      const isDuplicate = (dupRows ?? []).some((r) => r.id !== initial?.id);
      if (isDuplicate) {
        setErrors((e) => ({ ...e, meter_no: "এই মিটার ও মাসের জন্য বিল আগে থেকেই আছে" }));
        toast.error("ডুপ্লিকেট বিল — এই মিটার ও মাসের জন্য ইতিমধ্যে জমা দেওয়া হয়েছে");
        setSubmitting(false);
        return;
      }

      // Upload image (if new) — Cloudinary
      let bill_image_url: string | null = initial?.bill_image_url ?? null;
      let newImageUploaded = false;
      if (imageFile) {
        const { uploadImageToCloudinary } = await import("@/lib/cloudinary");
        bill_image_url = await uploadImageToCloudinary(imageFile, `ukhiya-seba/bills/${user.id}`);
        newImageUploaded = true;
      }

      const payload = {
        user_id: user.id,
        provider: parsed.data.provider,
        meter_type: parsed.data.meter_type,
        bill_month: parsed.data.bill_month,
        bill_year: parsed.data.bill_year,
        billing_month: billingMonthFor(parsed.data.bill_year, parsed.data.bill_month),
        due_date: dueDateFor(parsed.data.bill_year, parsed.data.bill_month),
        district: parsed.data.district,
        upazila: parsed.data.upazila,
        union_name: parsed.data.union_name,
        village: parsed.data.village,
        family_members: parsed.data.family_members,
        units_consumed: parsed.data.units_consumed,
        amount: parsed.data.amount,
        meter_no: parsed.data.meter_no,
        notes: parsed.data.notes || null,
        bill_image_url,
      };

      if (mode === "create") {
        const { error } = await supabase.from("bills").insert(payload);
        if (error) {
          if ((error as { code?: string }).code === "23505") {
            toast.error("ডুপ্লিকেট বিল — এই মিটার ও মাসের জন্য ইতিমধ্যে জমা দেওয়া হয়েছে");
            setErrors((e) => ({ ...e, meter_no: "এই মিটার ও মাসের জন্য বিল আগে থেকেই আছে" }));
            setSubmitting(false);
            return;
          }
          throw error;
        }
        toast.success("বিল সফলভাবে জমা হয়েছে");
      } else if (initial) {
        const { error } = await supabase.from("bills").update(payload).eq("id", initial.id);
        if (error) throw error;
        // Remove previous legacy Supabase Storage image if replaced (no-op for Cloudinary).
        if (newImageUploaded && existingImagePath) {
          await supabase.storage.from("bill-images").remove([existingImagePath]).catch(() => {});
        }
        toast.success("বিল আপডেট হয়েছে");
      }
      navigate({ to: "/bills" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "সংরক্ষণ ব্যর্থ";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (k: keyof BillFormValues) =>
    errors[k] ? <p className="mt-1 text-xs text-destructive">{errors[k]}</p> : null;

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      {/* Left: image + OCR */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">বিলের ছবি</CardTitle>
            <CardDescription>ছবি আপলোড করে "স্বয়ংক্রিয় পাঠ" চাপুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                <img src={previewUrl} alt="বিলের ছবি" className="max-h-80 w-full object-contain" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
                  aria-label="ছবি মুছুন"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:border-primary hover:bg-accent/40"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">ছবি বাছাই করুন</span>
                <span className="text-xs">সর্বোচ্চ ৮ MB • JPG / PNG</span>
              </button>
            )}

            <div className="grid grid-cols-1 gap-2">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> {previewUrl ? "পরিবর্তন" : "আপলোড"}
              </Button>
              {/* OCR feature hidden in MVP — handler retained for future enable */}
              {false && (
                <Button type="button" onClick={handleOcr} disabled={ocrLoading || !previewUrl}>
                  {ocrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  স্বয়ংক্রিয় পাঠ
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              বিলের ছবি সংরক্ষণ করুন। নিচের ফর্মে ম্যানুয়ালি তথ্য পূরণ করুন।
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Right: form */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">বিলের তথ্য</CardTitle>
            <CardDescription>মাস: {monthLabel} {toBanglaDigits(values.bill_year)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>প্রোভাইডার</Label>
              <Select value={values.provider} onValueChange={(v) => set("provider", v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("provider")}
            </div>
            <div>
              <Label>মিটারের ধরন</Label>
              <Select value={values.meter_type} onValueChange={(v) => set("meter_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METER_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("meter_type")}
            </div>
            <div>
              <Label>মাস</Label>
              <Select
                value={String(values.bill_month)}
                onValueChange={(v) => set("bill_month", Number(v))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BN_MONTHS_FULL.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("bill_month")}
            </div>
            <div>
              <Label>বছর</Label>
              <Select
                value={String(values.bill_year)}
                onValueChange={(v) => set("bill_year", Number(v))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{toBanglaDigits(y)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("bill_year")}
            </div>
            <div>
              <Label>মিটার নম্বর</Label>
              <Input
                value={values.meter_no}
                onChange={(e) => set("meter_no", e.target.value)}
                placeholder="যেমন: 12345678"
                inputMode="text"
              />
              {fieldError("meter_no")}
            </div>
            <div>
              <Label>পরিবারের সদস্য</Label>
              <Input
                type="number"
                min={1}
                value={values.family_members}
                onChange={(e) => set("family_members", Number(e.target.value))}
              />
              {fieldError("family_members")}
            </div>
            <div>
              <Label>মাসিক ইউনিট (kWh)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={values.units_consumed}
                onChange={(e) => set("units_consumed", Number(e.target.value))}
              />
              {fieldError("units_consumed")}
            </div>
            <div>
              <Label>বিলের পরিমাণ (৳)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={values.amount}
                onChange={(e) => set("amount", Number(e.target.value))}
              />
              {fieldError("amount")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ঠিকানা</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>জেলা</Label>
              <Input value={values.district} disabled />
            </div>
            <div>
              <Label>উপজেলা</Label>
              <Input value={values.upazila} disabled />
            </div>
            <div>
              <Label>ইউনিয়ন</Label>
              <Select value={values.union_name} onValueChange={(v) => set("union_name", v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {UNIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("union_name")}
            </div>
            <div>
              <Label>গ্রাম</Label>
              <Input
                value={values.village}
                onChange={(e) => set("village", e.target.value)}
                placeholder="গ্রামের নাম"
              />
              {fieldError("village")}
            </div>
            <div className="sm:col-span-2">
              <Label>মন্তব্য (ঐচ্ছিক)</Label>
              <Textarea
                rows={3}
                value={values.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="বিল সম্পর্কে অতিরিক্ত তথ্য..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/bills" })}>
            বাতিল
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "বিল জমা দিন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
        </div>
      </div>
    </form>
  );
}
