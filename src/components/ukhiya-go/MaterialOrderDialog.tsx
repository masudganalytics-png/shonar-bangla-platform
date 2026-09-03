import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { isValidBdPhone, normalizeUkhiyaGoPhone } from "@/lib/ukhiya-go-shared";

const WHATSAPP_NUMBER = "8801821818183";

const MATERIALS = [
  { value: "ইট", emoji: "🧱" },
  { value: "বালু", emoji: "🏖️" },
  { value: "সিমেন্ট", emoji: "🧰" },
  { value: "রড", emoji: "🔩" },
  { value: "পাথর / খোয়া", emoji: "🪨" },
  { value: "অন্যান্য", emoji: "📦" },
] as const;

type Form = {
  material: string;
  quantity: string;
  delivery_location: string;
  customer_name: string;
  phone: string;
  notes: string;
};

const EMPTY: Form = {
  material: "",
  quantity: "",
  delivery_location: "",
  customer_name: "",
  phone: "",
  notes: "",
};

export function MaterialOrderDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setForm(EMPTY);
    setDone(false);
    setSubmitting(false);
  };

  const whatsappHref = () => {
    const text = [
      "আসসালামু আলাইকুম, আমি নির্মাণ সামগ্রী অর্ডার করতে চাই।",
      `সামগ্রী: ${form.material}`,
      `পরিমাণ: ${form.quantity}`,
      `ডেলিভারি লোকেশন: ${form.delivery_location}`,
      `নাম: ${form.customer_name}`,
      `মোবাইল: ${form.phone}`,
      form.notes ? `অতিরিক্ত তথ্য: ${form.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.material) return toast.error("সামগ্রী নির্বাচন করুন।");
    if (!form.quantity.trim()) return toast.error("পরিমাণ লিখুন।");
    if (!form.delivery_location.trim()) return toast.error("ডেলিভারি লোকেশন লিখুন।");
    if (!form.customer_name.trim()) return toast.error("আপনার নাম লিখুন।");
    if (!isValidBdPhone(form.phone)) return toast.error("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।");

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("construction_material_orders").insert({
        user_id: auth.user?.id ?? null,
        material: form.material,
        quantity: form.quantity.trim().slice(0, 200),
        delivery_location: form.delivery_location.trim().slice(0, 300),
        customer_name: form.customer_name.trim().slice(0, 100),
        phone: normalizeUkhiyaGoPhone(form.phone),
        notes: form.notes.trim().slice(0, 500) || null,
      });
      if (error) throw error;
      setDone(true);
      toast.success("আপনার অর্ডার পাঠানো হয়েছে।");
    } catch {
      toast.error("অর্ডার পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🧱 নির্মাণ সামগ্রী অর্ডার করুন</DialogTitle>
          <DialogDescription>ইট • বালু • সিমেন্ট • রড — অর্ডার দিন, আমরা যোগাযোগ করব।</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-medium">আপনার অর্ডার জমা হয়েছে</p>
            <p className="text-xs text-muted-foreground">
              শীঘ্রই আমরা আপনার মোবাইল নম্বরে যোগাযোগ করব।
            </p>
            <Button
              asChild
              className="w-full bg-[#25D366] text-white hover:bg-[#128C7E]"
            >
              <a href={whatsappHref()} target="_blank" rel="noreferrer">
                WhatsApp এ পাঠান
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              বন্ধ করুন
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>কোন সামগ্রী লাগবে?</Label>
              <div className="grid grid-cols-2 gap-2">
                {MATERIALS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set("material", m.value)}
                    className={`rounded-lg border p-3 text-sm transition-colors ${
                      form.material === m.value
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="mr-1">{m.emoji}</span>
                    {m.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cmo-qty">পরিমাণ</Label>
              <Input
                id="cmo-qty"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="যেমন: ১০০০ পিস ইট / ২ ট্রাক বালু"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cmo-loc">ডেলিভারি লোকেশন</Label>
              <Input
                id="cmo-loc"
                value={form.delivery_location}
                onChange={(e) => set("delivery_location", e.target.value)}
                placeholder="যেমন: কোটবাজার, উখিয়া"
                maxLength={300}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cmo-name">আপনার নাম</Label>
              <Input
                id="cmo-name"
                value={form.customer_name}
                onChange={(e) => set("customer_name", e.target.value)}
                placeholder="নাম লিখুন"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cmo-phone">মোবাইল নম্বর</Label>
              <Input
                id="cmo-phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cmo-notes">অতিরিক্ত তথ্য (ঐচ্ছিক)</Label>
              <Textarea
                id="cmo-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="কখন দরকার, বিশেষ নির্দেশনা ইত্যাদি"
                maxLength={500}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              অর্ডার পাঠান
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
