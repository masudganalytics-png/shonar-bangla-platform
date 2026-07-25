import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, Check, Copy, Download, Eye, FileDown, FilePlus2,
  FileText, Printer, Save, Trash2, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import type { CVData, CVTemplate } from "@/lib/cv-builder/types";
import { TEMPLATES } from "@/lib/cv-builder/types";
import {
  duplicateCV, deleteCV, getActiveId, listCVs, loadActiveOrCreate,
  setActiveId, upsertCV,
} from "@/lib/cv-builder/storage";
import {
  StepPersonal, StepObjective, StepEducation, StepExperience,
  StepTraining, StepSkills, StepReferences, StepAdditional,
} from "@/components/cv-builder/steps";
import { CVPreview } from "@/components/cv-builder/preview";
import { emptyCV } from "@/lib/cv-builder/types";

export const Route = createFileRoute("/cv-builder")({
  head: () => ({
    meta: [
      { title: "প্রফেশনাল সিভি তৈরি করুন — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "সরকারি, এনজিও, ব্যাংক ও প্রাইভেট চাকরির জন্য প্রফেশনাল সিভি তৈরি ও ডাউনলোড করুন। অফলাইন, ATS-friendly, PDF এক্সপোর্ট।" },
      { property: "og:title", content: "প্রফেশনাল সিভি তৈরি করুন" },
      { property: "og:description", content: "সরকারি • এনজিও • ব্যাংক • প্রাইভেট চাকরির জন্য পেশাদার CV Builder।" },
    ],
  }),
  component: CVBuilderPage,
});

const STEPS = [
  { key: "personal",   label: "ব্যক্তিগত",  Comp: StepPersonal },
  { key: "objective",  label: "লক্ষ্য",     Comp: StepObjective },
  { key: "education",  label: "শিক্ষা",     Comp: StepEducation },
  { key: "experience", label: "অভিজ্ঞতা",   Comp: StepExperience },
  { key: "training",   label: "প্রশিক্ষণ",  Comp: StepTraining },
  { key: "skills",     label: "দক্ষতা",     Comp: StepSkills },
  { key: "references", label: "রেফারেন্স",  Comp: StepReferences },
  { key: "additional", label: "অন্যান্য",   Comp: StepAdditional },
] as const;

function CVBuilderPage() {
  const [data, setData] = useState<CVData | null>(null);
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  // load on mount (client-only)
  useEffect(() => {
    const cv = loadActiveOrCreate();
    setData(cv);
    setSavedAt(cv.updated_at);
  }, []);

  // autosave (debounced)
  useEffect(() => {
    if (!data || !dirty) return;
    const t = setTimeout(() => {
      upsertCV(data);
      setSavedAt(Date.now());
      setDirty(false);
    }, 700);
    return () => clearTimeout(t);
  }, [data, dirty]);

  // warn on leave when dirty
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = useCallback((updater: (d: CVData) => CVData) => {
    setData((prev) => (prev ? updater(prev) : prev));
    setDirty(true);
  }, []);

  const progress = useMemo(() => {
    if (!data) return 0;
    const p = data.personal;
    const filled = [
      p.full_name, p.father_name, p.mother_name, p.dob, p.mobile, p.email,
      p.present_address, p.permanent_address,
      data.objective,
      data.education.length > 0 ? "y" : "",
      data.experience.length > 0 || data.training.length > 0 ? "y" : "",
      data.skills.computer || data.skills.communication || data.skills.languages ? "y" : "",
    ].filter(Boolean).length;
    return Math.round((filled / 12) * 100);
  }, [data]);

  if (!data) return <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">লোড হচ্ছে…</div>;

  const StepComp = STEPS[step].Comp;

  const handleSaveNow = () => { upsertCV(data); setSavedAt(Date.now()); setDirty(false); toast.success("সংরক্ষিত হয়েছে"); };

  const handleNew = () => {
    if (dirty) upsertCV(data);
    const fresh = emptyCV();
    upsertCV(fresh);
    setActiveId(fresh.id);
    setData(fresh);
    setStep(0);
    toast.success("নতুন সিভি তৈরি হয়েছে");
  };

  const handleDuplicate = () => {
    upsertCV(data);
    const copy = duplicateCV(data.id);
    if (copy) { setActiveId(copy.id); setData(copy); toast.success("সিভি ডুপ্লিকেট হয়েছে"); }
  };

  const handleDelete = () => {
    if (!confirm("এই সিভি মুছে ফেলতে চান?")) return;
    deleteCV(data.id);
    const next = loadActiveOrCreate();
    setData(next);
    setStep(0);
    toast.success("সিভি মুছে ফেলা হয়েছে");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${data.name || "cv"}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed?.personal) throw new Error("invalid");
        const cv: CVData = { ...parsed, id: Math.random().toString(36).slice(2, 10), updated_at: Date.now() };
        upsertCV(cv); setActiveId(cv.id); setData(cv); setStep(0);
        toast.success("সিভি আমদানি হয়েছে");
      } catch { toast.error("অবৈধ JSON ফাইল"); }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    if (dirty) upsertCV(data);
    window.print();
  };

  const requiredMissing = !data.personal.full_name || !data.personal.mobile || !data.personal.email;

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Print styles: hide everything except the preview during print */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cv-print-root, #cv-print-root * { visibility: visible !important; }
          #cv-print-root { position: absolute; inset: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold sm:text-xl">প্রফেশনাল সিভি তৈরি করুন</h1>
            <p className="text-xs text-muted-foreground">সরকারি • এনজিও • ব্যাংক • প্রাইভেট চাকরির জন্য</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {dirty ? "সংরক্ষণ করা হচ্ছে…" : savedAt ? `সংরক্ষিত ${new Date(savedAt).toLocaleTimeString("bn-BD")}` : ""}
          </span>
          <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
            <Save className="mr-1.5 h-4 w-4" /> ব্যবস্থাপনা
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={requiredMissing} title={requiredMissing ? "নাম/মোবাইল/ইমেইল আবশ্যক" : ""}>
            <Download className="mr-1.5 h-4 w-4" /> PDF ডাউনলোড
          </Button>
        </div>
      </div>

      {/* CV name + template + progress */}
      <Card className="no-print mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <Label className="text-xs">সিভির নাম</Label>
            <Input value={data.name} onChange={(e) => set((d) => ({ ...d, name: e.target.value }))} maxLength={60} />
          </div>
          <div>
            <Label className="text-xs">টেমপ্লেট</Label>
            <Select value={data.template} onValueChange={(v) => set((d) => ({ ...d, template: v as CVTemplate }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.label} — <span className="text-xs text-muted-foreground">{t.desc}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">সম্পূর্ণতা</div>
            <div className="text-lg font-semibold">{progress}%</div>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={progress} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT — wizard */}
        <div className="no-print space-y-4">
          {/* Step tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(i)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  i === step ? "bg-primary text-primary-foreground" :
                  i < step ? "bg-secondary/20 text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <span className="mr-1 opacity-70">{i + 1}.</span>{s.label}
              </button>
            ))}
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">ধাপ {step + 1} / {STEPS.length}</div>
                <h2 className="text-base font-semibold">{STEPS[step].label}</h2>
              </div>
              <div className="flex gap-2 lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm"><Eye className="mr-1.5 h-4 w-4" /> প্রিভিউ</Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[92vh] overflow-y-auto p-0">
                    <SheetHeader className="border-b p-3">
                      <SheetTitle>লাইভ প্রিভিউ</SheetTitle>
                    </SheetHeader>
                    <div className="p-2"><CVPreview data={data} /></div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <StepComp data={data} set={set} />

            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> পূর্ববর্তী
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveNow}>
                <Save className="mr-1.5 h-4 w-4" /> সংরক্ষণ
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)}>
                  পরবর্তী <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handlePrint} disabled={requiredMissing}>
                  <Printer className="mr-1.5 h-4 w-4" /> প্রিন্ট / PDF
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT — preview (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>লাইভ প্রিভিউ (A4)</span>
              <Badge variant="outline">{TEMPLATES.find(t => t.id === data.template)?.label}</Badge>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-auto rounded-md border border-border bg-white shadow-sm">
              <CVPreview data={data} />
            </div>
          </div>
        </div>
      </div>

      {/* Management dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>সিভি ব্যবস্থাপনা</DialogTitle>
            <DialogDescription>সব ডেটা আপনার ডিভাইসেই সংরক্ষিত থাকে (অফলাইন)।</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleNew}><FilePlus2 className="mr-1.5 h-4 w-4" /> নতুন সিভি</Button>
            <Button variant="outline" onClick={handleDuplicate}><Copy className="mr-1.5 h-4 w-4" /> ডুপ্লিকেট</Button>
            <Button variant="outline" onClick={handleExportJSON}><FileDown className="mr-1.5 h-4 w-4" /> JSON এক্সপোর্ট</Button>
            <Button variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-1.5 h-4 w-4" /> JSON আমদানি</Button>
            <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => handleImportJSON(e.target.files?.[0])} />
            <Button variant="destructive" onClick={handleDelete} className="col-span-2"><Trash2 className="mr-1.5 h-4 w-4" /> এই সিভি মুছুন</Button>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">সংরক্ষিত সিভি সমূহ</div>
            <div className="max-h-56 overflow-y-auto rounded-md border">
              <SavedList currentId={data.id} onSelect={(id) => {
                const found = listCVs().find(c => c.id === id);
                if (found) { setActiveId(id); setData(found); setStep(0); setManageOpen(false); }
              }} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}><X className="mr-1.5 h-4 w-4" /> বন্ধ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="no-print mt-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">← হোমে ফিরে যান</Link>
      </div>
    </div>
  );
}

function SavedList({ currentId, onSelect }: { currentId: string; onSelect: (id: string) => void }) {
  const [items, setItems] = useState<CVData[]>([]);
  useEffect(() => { setItems(listCVs()); }, []);
  if (items.length === 0) return <div className="p-3 text-center text-sm text-muted-foreground">কোনো সিভি নেই</div>;
  return (
    <ul className="divide-y">
      {items.map(cv => (
        <li key={cv.id}>
          <button type="button" onClick={() => onSelect(cv.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-accent">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{cv.name}</div>
              <div className="text-[11px] text-muted-foreground">{cv.personal.full_name || "—"} • {new Date(cv.updated_at).toLocaleString("bn-BD")}</div>
            </div>
            {cv.id === currentId && <Check className="h-4 w-4 text-primary" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

// suppress unused import warning for getActiveId (kept for future use)
void getActiveId;
