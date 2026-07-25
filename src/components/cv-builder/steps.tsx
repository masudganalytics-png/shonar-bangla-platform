import { useRef } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { CVData, EducationEntry, ExperienceEntry, TrainingEntry, ReferenceEntry } from "@/lib/cv-builder/types";
import { OBJECTIVE_PRESETS, newId } from "@/lib/cv-builder/types";

type Setter = (updater: (d: CVData) => CVData) => void;
type StepProps = { data: CVData; set: Setter };

function Field({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---------------- Step 1: Personal ----------------
export function StepPersonal({ data, set }: StepProps) {
  const p = data.personal;
  const upd = (k: keyof CVData["personal"], v: string) =>
    set((d) => ({ ...d, personal: { ...d.personal, [k]: v } }));
  const fileRef = useRef<HTMLInputElement>(null);

  const onPhoto = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) return alert("ছবি ৩MB এর কম হতে হবে");
    const reader = new FileReader();
    reader.onload = () => upd("photo", String(reader.result || ""));
    reader.readAsDataURL(f);
  };

  const emailErr = p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) ? "সঠিক ইমেইল দিন" : "";
  const phoneErr = p.mobile && !/^[+0-9\s-]{10,15}$/.test(p.mobile) ? "সঠিক মোবাইল নম্বর দিন" : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-32 w-24 place-items-center overflow-hidden rounded-md border-2 border-dashed border-border bg-muted/40">
            {p.photo ? (
              <img src={p.photo} alt="ছবি" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">পাসপোর্ট সাইজ</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> ছবি আপলোড
          </Button>
          {p.photo && (
            <Button type="button" variant="ghost" size="sm" onClick={() => upd("photo", "")}>মুছুন</Button>
          )}
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Field label="পূর্ণ নাম" required>
            <Input value={p.full_name} onChange={(e) => upd("full_name", e.target.value)} placeholder="মো. রহিম উদ্দিন" maxLength={100} />
          </Field>
          <Field label="পিতার নাম" required>
            <Input value={p.father_name} onChange={(e) => upd("father_name", e.target.value)} maxLength={100} />
          </Field>
          <Field label="মাতার নাম" required>
            <Input value={p.mother_name} onChange={(e) => upd("mother_name", e.target.value)} maxLength={100} />
          </Field>
          <Field label="জন্ম তারিখ" required>
            <Input type="date" value={p.dob} onChange={(e) => upd("dob", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="লিঙ্গ">
          <Select value={p.gender} onValueChange={(v) => upd("gender", v)}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="পুরুষ">পুরুষ</SelectItem>
              <SelectItem value="মহিলা">মহিলা</SelectItem>
              <SelectItem value="অন্যান্য">অন্যান্য</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="বৈবাহিক অবস্থা">
          <Select value={p.marital_status} onValueChange={(v) => upd("marital_status", v)}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="অবিবাহিত">অবিবাহিত</SelectItem>
              <SelectItem value="বিবাহিত">বিবাহিত</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="জাতীয়তা">
          <Input value={p.nationality} onChange={(e) => upd("nationality", e.target.value)} />
        </Field>
        <Field label="ধর্ম">
          <Input value={p.religion} onChange={(e) => upd("religion", e.target.value)} />
        </Field>
        <Field label="রক্তের গ্রুপ">
          <Select value={p.blood_group} onValueChange={(v) => upd("blood_group", v)}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
            <SelectContent>
              {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="NID (ঐচ্ছিক)">
          <Input value={p.nid} onChange={(e) => upd("nid", e.target.value)} inputMode="numeric" maxLength={20} />
        </Field>
        <Field label="পাসপোর্ট (ঐচ্ছিক)">
          <Input value={p.passport} onChange={(e) => upd("passport", e.target.value)} maxLength={20} />
        </Field>
        <Field label="মোবাইল" required error={phoneErr}>
          <Input value={p.mobile} onChange={(e) => upd("mobile", e.target.value)} placeholder="01XXXXXXXXX" maxLength={15} />
        </Field>
        <Field label="ইমেইল" required error={emailErr}>
          <Input type="email" value={p.email} onChange={(e) => upd("email", e.target.value)} maxLength={100} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="বর্তমান ঠিকানা" required>
          <Textarea value={p.present_address} onChange={(e) => upd("present_address", e.target.value)} rows={3} maxLength={300} />
        </Field>
        <Field label="স্থায়ী ঠিকানা" required>
          <Textarea value={p.permanent_address} onChange={(e) => upd("permanent_address", e.target.value)} rows={3} maxLength={300} />
        </Field>
      </div>
    </div>
  );
}

// ---------------- Step 2: Objective ----------------
export function StepObjective({ data, set }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">প্রস্তুত টেমপ্লেট থেকে বেছে নিন</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {OBJECTIVE_PRESETS.map((p) => (
            <Badge
              key={p.id}
              variant="outline"
              className="cursor-pointer px-3 py-1.5 text-xs hover:bg-primary hover:text-primary-foreground"
              onClick={() => set((d) => ({ ...d, objective: p.text }))}
            >
              {p.label}
            </Badge>
          ))}
        </div>
      </div>
      <Field label="ক্যারিয়ার লক্ষ্য" required>
        <Textarea
          value={data.objective}
          onChange={(e) => set((d) => ({ ...d, objective: e.target.value }))}
          rows={6}
          maxLength={800}
          placeholder="আপনার ক্যারিয়ার লক্ষ্য লিখুন..."
        />
      </Field>
    </div>
  );
}

// ---------------- Generic list helpers ----------------
function ListSection<T extends { id: string }>({
  items, onAdd, onRemove, renderItem, addLabel,
}: {
  items: T[]; onAdd: () => void; onRemove: (id: string) => void;
  renderItem: (item: T, idx: number) => React.ReactNode; addLabel: string;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          কোনো এন্ট্রি নেই — নিচের বাটনে ক্লিক করুন
        </p>
      )}
      {items.map((item, idx) => (
        <Card key={item.id} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          {renderItem(item, idx)}
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={onAdd} className="w-full">
        <Plus className="mr-1.5 h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}

// ---------------- Step 3: Education ----------------
export function StepEducation({ data, set }: StepProps) {
  const upd = (id: string, k: keyof EducationEntry, v: string) =>
    set((d) => ({ ...d, education: d.education.map(e => e.id === id ? { ...e, [k]: v } : e) }));
  return (
    <ListSection
      items={data.education}
      onAdd={() => set((d) => ({ ...d, education: [...d.education, { id: newId(), degree: "", institution: "", board: "", group: "", passing_year: "", result: "" }] }))}
      onRemove={(id) => set((d) => ({ ...d, education: d.education.filter(e => e.id !== id) }))}
      addLabel="শিক্ষাগত যোগ্যতা যোগ করুন"
      renderItem={(e) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ডিগ্রি"><Input value={e.degree} onChange={(ev) => upd(e.id, "degree", ev.target.value)} placeholder="বিএসসি / এইচএসসি" /></Field>
          <Field label="প্রতিষ্ঠান"><Input value={e.institution} onChange={(ev) => upd(e.id, "institution", ev.target.value)} /></Field>
          <Field label="বোর্ড / বিশ্ববিদ্যালয়"><Input value={e.board} onChange={(ev) => upd(e.id, "board", ev.target.value)} /></Field>
          <Field label="বিভাগ / গ্রুপ"><Input value={e.group} onChange={(ev) => upd(e.id, "group", ev.target.value)} /></Field>
          <Field label="পাসের সাল"><Input value={e.passing_year} onChange={(ev) => upd(e.id, "passing_year", ev.target.value)} inputMode="numeric" maxLength={4} /></Field>
          <Field label="ফলাফল"><Input value={e.result} onChange={(ev) => upd(e.id, "result", ev.target.value)} placeholder="CGPA 3.75 / GPA 5.00" /></Field>
        </div>
      )}
    />
  );
}

// ---------------- Step 4: Experience ----------------
export function StepExperience({ data, set }: StepProps) {
  const upd = (id: string, k: keyof ExperienceEntry, v: string) =>
    set((d) => ({ ...d, experience: d.experience.map(e => e.id === id ? { ...e, [k]: v } : e) }));
  return (
    <ListSection
      items={data.experience}
      onAdd={() => set((d) => ({ ...d, experience: [...d.experience, { id: newId(), organization: "", position: "", duration: "", responsibilities: "", achievements: "" }] }))}
      onRemove={(id) => set((d) => ({ ...d, experience: d.experience.filter(e => e.id !== id) }))}
      addLabel="অভিজ্ঞতা যোগ করুন"
      renderItem={(e) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="প্রতিষ্ঠান"><Input value={e.organization} onChange={(ev) => upd(e.id, "organization", ev.target.value)} /></Field>
          <Field label="পদবী"><Input value={e.position} onChange={(ev) => upd(e.id, "position", ev.target.value)} /></Field>
          <Field label="সময়কাল"><Input value={e.duration} onChange={(ev) => upd(e.id, "duration", ev.target.value)} placeholder="জানুয়ারি ২০২২ — বর্তমান" /></Field>
          <Field label=""><span className="sr-only">spacer</span></Field>
          <div className="sm:col-span-2"><Field label="দায়িত্বসমূহ"><Textarea value={e.responsibilities} onChange={(ev) => upd(e.id, "responsibilities", ev.target.value)} rows={3} maxLength={500} /></Field></div>
          <div className="sm:col-span-2"><Field label="অর্জন"><Textarea value={e.achievements} onChange={(ev) => upd(e.id, "achievements", ev.target.value)} rows={2} maxLength={400} /></Field></div>
        </div>
      )}
    />
  );
}

// ---------------- Step 5: Training ----------------
export function StepTraining({ data, set }: StepProps) {
  const upd = (id: string, k: keyof TrainingEntry, v: string) =>
    set((d) => ({ ...d, training: d.training.map(t => t.id === id ? { ...t, [k]: v } : t) }));
  return (
    <ListSection
      items={data.training}
      onAdd={() => set((d) => ({ ...d, training: [...d.training, { id: newId(), name: "", institute: "", year: "", duration: "" }] }))}
      onRemove={(id) => set((d) => ({ ...d, training: d.training.filter(t => t.id !== id) }))}
      addLabel="প্রশিক্ষণ যোগ করুন"
      renderItem={(t) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="প্রশিক্ষণের নাম"><Input value={t.name} onChange={(e) => upd(t.id, "name", e.target.value)} /></Field>
          <Field label="ইন্সটিটিউট"><Input value={t.institute} onChange={(e) => upd(t.id, "institute", e.target.value)} /></Field>
          <Field label="বছর"><Input value={t.year} onChange={(e) => upd(t.id, "year", e.target.value)} inputMode="numeric" maxLength={4} /></Field>
          <Field label="সময়কাল"><Input value={t.duration} onChange={(e) => upd(t.id, "duration", e.target.value)} placeholder="৩ মাস" /></Field>
        </div>
      )}
    />
  );
}

// ---------------- Step 6: Skills ----------------
export function StepSkills({ data, set }: StepProps) {
  const s = data.skills;
  const upd = (k: keyof CVData["skills"], v: string) => set((d) => ({ ...d, skills: { ...d.skills, [k]: v } }));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="কম্পিউটার দক্ষতা"><Textarea value={s.computer} onChange={(e) => upd("computer", e.target.value)} rows={2} placeholder="MS Word, Excel, PowerPoint..." /></Field>
      <Field label="যোগাযোগ দক্ষতা"><Textarea value={s.communication} onChange={(e) => upd("communication", e.target.value)} rows={2} /></Field>
      <Field label="নেতৃত্ব"><Textarea value={s.leadership} onChange={(e) => upd("leadership", e.target.value)} rows={2} /></Field>
      <Field label="ভাষা"><Input value={s.languages} onChange={(e) => upd("languages", e.target.value)} placeholder="বাংলা, ইংরেজি" /></Field>
      <Field label="ড্রাইভিং লাইসেন্স"><Input value={s.driving_license} onChange={(e) => upd("driving_license", e.target.value)} placeholder="আছে / নেই" /></Field>
      <Field label="টাইপিং স্পিড"><Input value={s.typing_speed} onChange={(e) => upd("typing_speed", e.target.value)} placeholder="বাংলা ২৫ / ইংরেজি ৩৫ WPM" /></Field>
      <div className="sm:col-span-2"><Field label="টেকনিক্যাল দক্ষতা"><Textarea value={s.technical} onChange={(e) => upd("technical", e.target.value)} rows={3} /></Field></div>
    </div>
  );
}

// ---------------- Step 7: References ----------------
export function StepReferences({ data, set }: StepProps) {
  const upd = (id: string, k: keyof ReferenceEntry, v: string) =>
    set((d) => ({ ...d, references: d.references.map(r => r.id === id ? { ...r, [k]: v } : r) }));
  return (
    <ListSection
      items={data.references}
      onAdd={() => set((d) => ({ ...d, references: [...d.references, { id: newId(), name: "", designation: "", organization: "", phone: "", email: "" }] }))}
      onRemove={(id) => set((d) => ({ ...d, references: d.references.filter(r => r.id !== id) }))}
      addLabel="রেফারেন্স যোগ করুন"
      renderItem={(r) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="নাম"><Input value={r.name} onChange={(e) => upd(r.id, "name", e.target.value)} /></Field>
          <Field label="পদবী"><Input value={r.designation} onChange={(e) => upd(r.id, "designation", e.target.value)} /></Field>
          <Field label="প্রতিষ্ঠান"><Input value={r.organization} onChange={(e) => upd(r.id, "organization", e.target.value)} /></Field>
          <Field label="ফোন"><Input value={r.phone} onChange={(e) => upd(r.id, "phone", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="ইমেইল"><Input type="email" value={r.email} onChange={(e) => upd(r.id, "email", e.target.value)} /></Field></div>
        </div>
      )}
    />
  );
}

// ---------------- Step 8: Additional ----------------
export function StepAdditional({ data, set }: StepProps) {
  const a = data.additional;
  const upd = (k: keyof CVData["additional"], v: string) => set((d) => ({ ...d, additional: { ...d.additional, [k]: v } }));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="প্রত্যাশিত বেতন"><Input value={a.expected_salary} onChange={(e) => upd("expected_salary", e.target.value)} placeholder="আলোচনা সাপেক্ষে" /></Field>
      <Field label="নোটিশ পিরিয়ড"><Input value={a.notice_period} onChange={(e) => upd("notice_period", e.target.value)} placeholder="১ মাস" /></Field>
      <div className="sm:col-span-2"><Field label="শখ"><Textarea value={a.hobbies} onChange={(e) => upd("hobbies", e.target.value)} rows={2} /></Field></div>
      <div className="sm:col-span-2"><Field label="অন্যান্য কার্যক্রম"><Textarea value={a.extra_activities} onChange={(e) => upd("extra_activities", e.target.value)} rows={3} /></Field></div>
    </div>
  );
}
