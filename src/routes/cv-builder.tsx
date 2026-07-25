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
  duplicateCV, deleteCV, listCVs, loadActiveOrCreate,
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
      { title: "Professional CV Builder — Ukhiya Electricity Bill" },
      { name: "description", content: "Build and download an ATS-friendly A4 CV for government, NGO, bank and private jobs. Offline, no login, free." },
      { property: "og:title", content: "Professional CV Builder" },
      { property: "og:description", content: "Government • NGO • Bank • Private Jobs — free offline CV Builder with A4 PDF export." },
    ],
  }),
  component: CVBuilderPage,
});

const STEPS = [
  { key: "personal",   label: "Personal",     Comp: StepPersonal },
  { key: "objective",  label: "Objective",    Comp: StepObjective },
  { key: "education",  label: "Education",    Comp: StepEducation },
  { key: "experience", label: "Experience",   Comp: StepExperience },
  { key: "training",   label: "Training",     Comp: StepTraining },
  { key: "skills",     label: "Skills",       Comp: StepSkills },
  { key: "references", label: "References",   Comp: StepReferences },
  { key: "additional", label: "Additional",   Comp: StepAdditional },
] as const;

function CVBuilderPage() {
  const [data, setData] = useState<CVData | null>(null);
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cv = loadActiveOrCreate();
    setData(cv);
    setSavedAt(cv.updated_at);
  }, []);

  useEffect(() => {
    if (!data || !dirty) return;
    const t = setTimeout(() => {
      upsertCV(data);
      setSavedAt(Date.now());
      setDirty(false);
    }, 700);
    return () => clearTimeout(t);
  }, [data, dirty]);

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

  if (!data) return <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">Loading…</div>;

  const StepComp = STEPS[step].Comp;

  const handleSaveNow = () => { upsertCV(data); setSavedAt(Date.now()); setDirty(false); toast.success("Saved locally"); };

  const handleNew = () => {
    if (dirty) upsertCV(data);
    const fresh = emptyCV();
    upsertCV(fresh);
    setActiveId(fresh.id);
    setData(fresh);
    setStep(0);
    toast.success("New CV created");
  };

  const handleDuplicate = () => {
    upsertCV(data);
    const copy = duplicateCV(data.id);
    if (copy) { setActiveId(copy.id); setData(copy); toast.success("CV duplicated"); }
  };

  const handleDelete = () => {
    if (!confirm("Delete this CV?")) return;
    deleteCV(data.id);
    const next = loadActiveOrCreate();
    setData(next);
    setStep(0);
    toast.success("CV deleted");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${data.name || "cv"}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Local backup downloaded");
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
        toast.success("CV imported");
      } catch { toast.error("Invalid JSON file"); }
    };
    reader.readAsText(file);
  };

  const handleDownloadPDF = async () => {
    if (dirty) upsertCV(data);
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      window.print();
      toast.success("Choose 'Save as PDF' in the print dialog");
    } catch (err) {
      console.error(err);
      toast.error("Could not open print dialog");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (dirty) upsertCV(data);
    setTimeout(() => window.print(), 60);
  };

  const requiredMissing = !data.personal.full_name || !data.personal.mobile || !data.personal.email;

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      <style>{`
        @media screen and (max-width: 1023px) {
          .cv-print-offscreen { position: fixed; left: -10000px; top: 0; width: 210mm; pointer-events: none; }
        }
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .cv-print-offscreen { position: static !important; left: auto !important; width: auto !important; }
          #cv-print-root, #cv-print-root * { visibility: visible !important; }
          #cv-print-root { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold sm:text-xl">Professional CV Builder</h1>
            <p className="text-xs text-muted-foreground">Government • NGO • Bank • Private Jobs</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {dirty ? "Saving…" : savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : ""}
          </span>
          <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
            <Save className="mr-1.5 h-4 w-4" /> Manage
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={requiredMissing}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          <Button size="sm" onClick={handleDownloadPDF} disabled={requiredMissing || exporting} title={requiredMissing ? "Name / Mobile / Email required" : ""}>
            <Download className="mr-1.5 h-4 w-4" /> {exporting ? "Exporting…" : "Download A4 PDF"}
          </Button>
        </div>
      </div>

      <Card className="no-print mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <Label className="text-xs">CV name</Label>
            <Input value={data.name} onChange={(e) => set((d) => ({ ...d, name: e.target.value }))} maxLength={60} />
          </div>
          <div>
            <Label className="text-xs">Template</Label>
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
            <div className="text-xs text-muted-foreground">Completion</div>
            <div className="text-lg font-semibold">{progress}%</div>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={progress} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="no-print space-y-4">
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
                <div className="text-xs text-muted-foreground">Step {step + 1} / {STEPS.length}</div>
                <h2 className="text-base font-semibold">{STEPS[step].label}</h2>
              </div>
              <div className="flex gap-2 lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm"><Eye className="mr-1.5 h-4 w-4" /> Preview</Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[92vh] overflow-y-auto p-0">
                    <SheetHeader className="border-b p-3">
                      <SheetTitle>Live Preview</SheetTitle>
                    </SheetHeader>
                    <div className="p-2"><CVPreview data={data} /></div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <StepComp data={data} set={set} />

            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveNow}>
                <Save className="mr-1.5 h-4 w-4" /> Save
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleDownloadPDF} disabled={requiredMissing || exporting}>
                  <Download className="mr-1.5 h-4 w-4" /> Download PDF
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:block">
          <div className="lg:sticky lg:top-20">
            <div className="no-print mb-2 hidden items-center justify-between text-xs text-muted-foreground lg:flex">
              <span>Live preview (A4)</span>
              <Badge variant="outline">{TEMPLATES.find(t => t.id === data.template)?.label}</Badge>
            </div>
            <div className="cv-print-offscreen lg:max-h-[calc(100vh-8rem)] lg:overflow-auto lg:rounded-md lg:border lg:border-border lg:bg-white lg:shadow-sm">
              <CVPreview data={data} />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>CV Management</DialogTitle>
            <DialogDescription>All data stays on your device (offline).</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleNew}><FilePlus2 className="mr-1.5 h-4 w-4" /> New CV</Button>
            <Button variant="outline" onClick={handleDuplicate}><Copy className="mr-1.5 h-4 w-4" /> Duplicate</Button>
            <Button variant="outline" onClick={handleExportJSON}><FileDown className="mr-1.5 h-4 w-4" /> Export JSON (local backup)</Button>
            <Button variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-1.5 h-4 w-4" /> Import JSON</Button>
            <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => handleImportJSON(e.target.files?.[0])} />
            <Button variant="destructive" onClick={handleDelete} className="col-span-2"><Trash2 className="mr-1.5 h-4 w-4" /> Delete this CV</Button>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Saved CVs</div>
            <div className="max-h-56 overflow-y-auto rounded-md border">
              <SavedList currentId={data.id} onSelect={(id) => {
                const found = listCVs().find(c => c.id === id);
                if (found) { setActiveId(id); setData(found); setStep(0); setManageOpen(false); }
              }} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}><X className="mr-1.5 h-4 w-4" /> Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="no-print mt-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}

function SavedList({ currentId, onSelect }: { currentId: string; onSelect: (id: string) => void }) {
  const [items, setItems] = useState<CVData[]>([]);
  useEffect(() => { setItems(listCVs()); }, []);
  if (items.length === 0) return <div className="p-3 text-center text-sm text-muted-foreground">No saved CVs</div>;
  return (
    <ul className="divide-y">
      {items.map(cv => (
        <li key={cv.id}>
          <button type="button" onClick={() => onSelect(cv.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-accent">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{cv.name}</div>
              <div className="text-[11px] text-muted-foreground">{cv.personal.full_name || "—"} • {new Date(cv.updated_at).toLocaleString()}</div>
            </div>
            {cv.id === currentId && <Check className="h-4 w-4 text-primary" />}
          </button>
        </li>
      ))}
    </ul>
  );
}
