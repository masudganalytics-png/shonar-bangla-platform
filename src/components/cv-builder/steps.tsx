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
    if (f.size > 3 * 1024 * 1024) return alert("Photo must be under 3MB");
    const reader = new FileReader();
    reader.onload = () => upd("photo", String(reader.result || ""));
    reader.readAsDataURL(f);
  };

  const emailErr = p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) ? "Enter a valid email" : "";
  const phoneErr = p.mobile && !/^[+0-9\s-]{10,15}$/.test(p.mobile) ? "Enter a valid mobile number" : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-32 w-24 place-items-center overflow-hidden rounded-md border-2 border-dashed border-border bg-muted/40">
            {p.photo ? (
              <img src={p.photo} alt="Photo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">Passport size</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Photo
          </Button>
          {p.photo && (
            <Button type="button" variant="ghost" size="sm" onClick={() => upd("photo", "")}>Remove</Button>
          )}
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Field label="Full Name" required>
            <Input value={p.full_name} onChange={(e) => upd("full_name", e.target.value)} placeholder="Md. Rahim Uddin" maxLength={100} />
          </Field>
          <Field label="Father's Name" required>
            <Input value={p.father_name} onChange={(e) => upd("father_name", e.target.value)} maxLength={100} />
          </Field>
          <Field label="Mother's Name" required>
            <Input value={p.mother_name} onChange={(e) => upd("mother_name", e.target.value)} maxLength={100} />
          </Field>
          <Field label="Date of Birth" required>
            <Input type="date" value={p.dob} onChange={(e) => upd("dob", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Gender">
          <Select value={p.gender} onValueChange={(v) => upd("gender", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Marital Status">
          <Select value={p.marital_status} onValueChange={(v) => upd("marital_status", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Married">Married</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Nationality">
          <Input value={p.nationality} onChange={(e) => upd("nationality", e.target.value)} />
        </Field>
        <Field label="Religion">
          <Input value={p.religion} onChange={(e) => upd("religion", e.target.value)} />
        </Field>
        <Field label="Blood Group">
          <Select value={p.blood_group} onValueChange={(v) => upd("blood_group", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="NID (optional)">
          <Input value={p.nid} onChange={(e) => upd("nid", e.target.value)} inputMode="numeric" maxLength={20} />
        </Field>
        <Field label="Passport (optional)">
          <Input value={p.passport} onChange={(e) => upd("passport", e.target.value)} maxLength={20} />
        </Field>
        <Field label="Mobile" required error={phoneErr}>
          <Input value={p.mobile} onChange={(e) => upd("mobile", e.target.value)} placeholder="01XXXXXXXXX" maxLength={15} />
        </Field>
        <Field label="Email" required error={emailErr}>
          <Input type="email" value={p.email} onChange={(e) => upd("email", e.target.value)} maxLength={100} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Present Address" required>
          <Textarea value={p.present_address} onChange={(e) => upd("present_address", e.target.value)} rows={3} maxLength={300} />
        </Field>
        <Field label="Permanent Address" required>
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
        <Label className="text-sm">Pick from ready-made templates</Label>
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
      <Field label="Career Objective" required>
        <Textarea
          value={data.objective}
          onChange={(e) => set((d) => ({ ...d, objective: e.target.value }))}
          rows={6}
          maxLength={800}
          placeholder="Write your career objective..."
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
          No entries yet — click the button below
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
      addLabel="Add Education"
      renderItem={(e) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Degree"><Input value={e.degree} onChange={(ev) => upd(e.id, "degree", ev.target.value)} placeholder="BSc / HSC" /></Field>
          <Field label="Institution"><Input value={e.institution} onChange={(ev) => upd(e.id, "institution", ev.target.value)} /></Field>
          <Field label="Board / University"><Input value={e.board} onChange={(ev) => upd(e.id, "board", ev.target.value)} /></Field>
          <Field label="Group / Major"><Input value={e.group} onChange={(ev) => upd(e.id, "group", ev.target.value)} /></Field>
          <Field label="Passing Year"><Input value={e.passing_year} onChange={(ev) => upd(e.id, "passing_year", ev.target.value)} inputMode="numeric" maxLength={4} /></Field>
          <Field label="Result"><Input value={e.result} onChange={(ev) => upd(e.id, "result", ev.target.value)} placeholder="CGPA 3.75 / GPA 5.00" /></Field>
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
      addLabel="Add Experience"
      renderItem={(e) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Organization"><Input value={e.organization} onChange={(ev) => upd(e.id, "organization", ev.target.value)} /></Field>
          <Field label="Position"><Input value={e.position} onChange={(ev) => upd(e.id, "position", ev.target.value)} /></Field>
          <Field label="Duration"><Input value={e.duration} onChange={(ev) => upd(e.id, "duration", ev.target.value)} placeholder="January 2022 — Present" /></Field>
          <Field label=""><span className="sr-only">spacer</span></Field>
          <div className="sm:col-span-2"><Field label="Responsibilities"><Textarea value={e.responsibilities} onChange={(ev) => upd(e.id, "responsibilities", ev.target.value)} rows={3} maxLength={500} /></Field></div>
          <div className="sm:col-span-2"><Field label="Achievements"><Textarea value={e.achievements} onChange={(ev) => upd(e.id, "achievements", ev.target.value)} rows={2} maxLength={400} /></Field></div>
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
      addLabel="Add Training"
      renderItem={(t) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Training Name"><Input value={t.name} onChange={(e) => upd(t.id, "name", e.target.value)} /></Field>
          <Field label="Institute"><Input value={t.institute} onChange={(e) => upd(t.id, "institute", e.target.value)} /></Field>
          <Field label="Year"><Input value={t.year} onChange={(e) => upd(t.id, "year", e.target.value)} inputMode="numeric" maxLength={4} /></Field>
          <Field label="Duration"><Input value={t.duration} onChange={(e) => upd(t.id, "duration", e.target.value)} placeholder="3 months" /></Field>
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
      <Field label="Computer Skills"><Textarea value={s.computer} onChange={(e) => upd("computer", e.target.value)} rows={2} placeholder="MS Word, Excel, PowerPoint..." /></Field>
      <Field label="Communication"><Textarea value={s.communication} onChange={(e) => upd("communication", e.target.value)} rows={2} /></Field>
      <Field label="Leadership"><Textarea value={s.leadership} onChange={(e) => upd("leadership", e.target.value)} rows={2} /></Field>
      <Field label="Languages"><Input value={s.languages} onChange={(e) => upd("languages", e.target.value)} placeholder="Bangla, English" /></Field>
      <Field label="Driving License"><Input value={s.driving_license} onChange={(e) => upd("driving_license", e.target.value)} placeholder="Yes / No" /></Field>
      <Field label="Typing Speed"><Input value={s.typing_speed} onChange={(e) => upd("typing_speed", e.target.value)} placeholder="English 35 WPM" /></Field>
      <div className="sm:col-span-2"><Field label="Technical Skills"><Textarea value={s.technical} onChange={(e) => upd("technical", e.target.value)} rows={3} /></Field></div>
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
      addLabel="Add Reference"
      renderItem={(r) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><Input value={r.name} onChange={(e) => upd(r.id, "name", e.target.value)} /></Field>
          <Field label="Designation"><Input value={r.designation} onChange={(e) => upd(r.id, "designation", e.target.value)} /></Field>
          <Field label="Organization"><Input value={r.organization} onChange={(e) => upd(r.id, "organization", e.target.value)} /></Field>
          <Field label="Phone"><Input value={r.phone} onChange={(e) => upd(r.id, "phone", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Email"><Input type="email" value={r.email} onChange={(e) => upd(r.id, "email", e.target.value)} /></Field></div>
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
      <Field label="Expected Salary"><Input value={a.expected_salary} onChange={(e) => upd("expected_salary", e.target.value)} placeholder="Negotiable" /></Field>
      <Field label="Notice Period"><Input value={a.notice_period} onChange={(e) => upd("notice_period", e.target.value)} placeholder="1 month" /></Field>
      <div className="sm:col-span-2"><Field label="Hobbies"><Textarea value={a.hobbies} onChange={(e) => upd("hobbies", e.target.value)} rows={2} /></Field></div>
      <div className="sm:col-span-2"><Field label="Other Activities"><Textarea value={a.extra_activities} onChange={(e) => upd("extra_activities", e.target.value)} rows={3} /></Field></div>
    </div>
  );
}
