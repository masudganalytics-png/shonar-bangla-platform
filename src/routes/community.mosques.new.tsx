import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { submitMosque } from "@/lib/mosque.functions";
import {
  COMMITTEE_POSITIONS,
  COMMITTEE_POSITION_LABEL_BN,
  DONATION_PURPOSES,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL_BN,
  type CommitteePosition,
  type ProjectStatus,
} from "@/lib/mosque-shared";

export const Route = createFileRoute("/community/mosques/new")({
  head: () => ({
    meta: [
      { title: "মসজিদ ও সমাজের তথ্য যোগ করুন | উখিয়া সেবা" },
      {
        name: "description",
        content: "আপনার এলাকার মসজিদ, কমিটি, সমাজপতি, সমাজের সদস্য, দাতা ও উন্নয়ন কার্যক্রমের তথ্য যোগ করুন।",
      },
      { property: "og:title", content: "মসজিদ ও সমাজের তথ্য যোগ করুন" },
      { property: "og:description", content: "৭ ধাপে তথ্য জমা দিন — যাচাইয়ের পর প্রকাশিত হবে।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewMosquePage,
});

/* -------------------------------------------------------------- types */

type Visibility = "public" | "private";

type MosqueForm = {
  name: string;
  area: string;
  union_name: string;
  ward: string;
  upazila: string;
  district: string;
  established_year: string;
  imam_name: string;
  muazzin_name: string;
  phone: string;
  phone_visibility: Visibility;
  map_url: string;
  photo_url: string;
  description: string;
};

type CommitteeForm = {
  full_name: string;
  position: CommitteePosition;
  phone: string;
  phone_visibility: Visibility;
  bio: string;
};

type LeaderForm = { full_name: string; role_title: string; phone: string; phone_visibility: Visibility; description: string };
type MemberForm = { full_name: string; family_name: string; phone: string; phone_visibility: Visibility; description: string };
type DonorForm = {
  full_name: string;
  location: string;
  purpose: string;
  amount: string;
  donated_on: string;
  is_anonymous: boolean;
  amount_visibility: Visibility;
};
type ProjectForm = {
  name: string;
  description: string;
  target_amount: string;
  collected_amount: string;
  spent_amount: string;
  start_date: string;
  expected_completion_date: string;
  status: ProjectStatus;
};

type Draft = {
  mosque: MosqueForm;
  committee: CommitteeForm[];
  leaders: LeaderForm[];
  members: MemberForm[];
  donors: DonorForm[];
  projects: ProjectForm[];
};

const EMPTY_MOSQUE: MosqueForm = {
  name: "",
  area: "",
  union_name: "",
  ward: "",
  upazila: "উখিয়া",
  district: "কক্সবাজার",
  established_year: "",
  imam_name: "",
  muazzin_name: "",
  phone: "",
  phone_visibility: "public",
  map_url: "",
  photo_url: "",
  description: "",
};

const EMPTY_DRAFT: Draft = { mosque: EMPTY_MOSQUE, committee: [], leaders: [], members: [], donors: [], projects: [] };

const STEPS = [
  "মসজিদের তথ্য",
  "মসজিদ কমিটি",
  "সমাজপতি",
  "সমাজের সদস্য",
  "দাতা ও সহযোগী",
  "উন্নয়ন কার্যক্রম",
  "রিভিউ ও জমা",
];

const DRAFT_KEY = "mosque-wizard-draft-v1";

const num = (v: string): number | null => {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? null : n;
};

/* ------------------------------------------------------------ component */

function NewMosquePage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const submit = useServerFn(submitMosque);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [done, setDone] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restore / persist draft so users don't lose typed data.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraft({ ...EMPTY_DRAFT, ...(JSON.parse(raw) as Draft) });
    } catch {
      /* ignore */
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored || done) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft, restored, done]);

  useEffect(() => {
    if (done) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (draft.mosque.name.trim().length > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draft.mosque.name, done]);

  const setMosque = (patch: Partial<MosqueForm>) => setDraft((d) => ({ ...d, mosque: { ...d.mosque, ...patch } }));

  const stepError = (): string | null => {
    if (step === 0) {
      const m = draft.mosque;
      if (m.name.trim().length < 2) return "মসজিদের নাম লিখুন";
      if (!m.upazila.trim()) return "উপজেলা লিখুন";
      if (!m.district.trim()) return "জেলা লিখুন";
      const y = num(m.established_year);
      if (m.established_year && (y === null || y < 1000 || y > 2200)) return "প্রতিষ্ঠার সাল সঠিক নয়";
      return null;
    }
    if (step === 1 && draft.committee.some((c) => c.full_name.trim().length < 2)) return "কমিটির প্রত্যেক সদস্যের নাম লিখুন";
    if (step === 2 && draft.leaders.some((c) => c.full_name.trim().length < 2)) return "সমাজপতির নাম লিখুন";
    if (step === 3 && draft.members.some((c) => c.full_name.trim().length < 2)) return "সদস্যের নাম লিখুন";
    if (step === 4 && draft.donors.some((c) => c.full_name.trim().length < 2)) return "দাতার নাম লিখুন";
    if (step === 5) {
      for (const p of draft.projects) {
        if (p.name.trim().length < 2) return "প্রকল্পের নাম লিখুন";
        const t = num(p.target_amount) ?? 0;
        const c = num(p.collected_amount) ?? 0;
        const s = num(p.spent_amount) ?? 0;
        if (t < 0 || c < 0 || s < 0) return "টাকার পরিমাণ ঋণাত্মক হতে পারে না";
        if (c > 0 && s > c) return "ব্যয় সংগৃহীত অর্থের চেয়ে বেশি হতে পারে না";
      }
    }
    return null;
  };

  const save = useMutation({
    mutationFn: async () => {
      const m = draft.mosque;
      return submit({
        data: {
          mosque: {
            name: m.name.trim(),
            area: m.area.trim() || null,
            union_name: m.union_name.trim() || null,
            ward: m.ward.trim() || null,
            upazila: m.upazila.trim(),
            district: m.district.trim(),
            established_year: num(m.established_year),
            imam_name: m.imam_name.trim() || null,
            muazzin_name: m.muazzin_name.trim() || null,
            phone: m.phone.trim() || null,
            phone_visibility: m.phone_visibility,
            map_url: m.map_url.trim() || null,
            photo_url: m.photo_url.trim() || null,
            description: m.description.trim() || null,
          },
          committee: draft.committee.map((c) => ({
            full_name: c.full_name.trim(),
            position: c.position,
            phone: c.phone.trim() || null,
            phone_visibility: c.phone_visibility,
            bio: c.bio.trim() || null,
          })),
          leaders: draft.leaders.map((c) => ({
            full_name: c.full_name.trim(),
            role_title: c.role_title.trim() || null,
            phone: c.phone.trim() || null,
            phone_visibility: c.phone_visibility,
            description: c.description.trim() || null,
          })),
          members: draft.members.map((c) => ({
            full_name: c.full_name.trim(),
            family_name: c.family_name.trim() || null,
            phone: c.phone.trim() || null,
            phone_visibility: c.phone_visibility,
            description: c.description.trim() || null,
          })),
          donors: draft.donors.map((c) => ({
            full_name: c.full_name.trim(),
            location: c.location.trim() || null,
            purpose: c.purpose.trim() || null,
            amount: num(c.amount),
            donated_on: c.donated_on || null,
            is_anonymous: c.is_anonymous,
            amount_visibility: c.amount_visibility,
          })),
          projects: draft.projects.map((p) => ({
            name: p.name.trim(),
            description: p.description.trim() || null,
            target_amount: num(p.target_amount) ?? 0,
            collected_amount: num(p.collected_amount) ?? 0,
            spent_amount: num(p.spent_amount) ?? 0,
            start_date: p.start_date || null,
            expected_completion_date: p.expected_completion_date || null,
            status: p.status,
          })),
        },
      });
    },
    onSuccess: () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setDone(true);
      window.scrollTo({ top: 0 });
    },
    onError: (e: Error) => toast.error(e.message || "জমা দেওয়া যায়নি"),
  });

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">লোড হচ্ছে…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-4xl">🕌</p>
        <h1 className="mt-4 text-xl font-bold">সাইন ইন করুন</h1>
        <p className="mt-2 text-sm text-muted-foreground">মসজিদ ও সমাজের তথ্য যোগ করতে অ্যাকাউন্টে প্রবেশ করুন।</p>
        <Button asChild className="mt-4">
          <Link to="/auth" search={{ mode: "login", redirect: "/community/mosques/new" }}>
            সাইন ইন
          </Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-xl font-bold">তথ্য জমা হয়েছে</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          বর্তমান অবস্থা: <span className="font-medium text-amber-600 dark:text-amber-400">যাচাইাধীন</span>। প্রশাসক যাচাই করার পর
          প্রোফাইলটি প্রকাশিত হবে।
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/community/mosques">মসজিদ তালিকায় যান</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setStep(0);
              setDone(false);
            }}
          >
            আরেকটি যোগ করুন
          </Button>
        </div>
      </div>
    );
  }

  const err = stepError();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to="/community/mosques"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> মসজিদ ও সমাজ
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">➕ মসজিদ ও সমাজের তথ্য যোগ করুন</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ধাপ {step + 1} / {STEPS.length} — {STEPS[step]}
      </p>

      {/* Step indicator */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => (i < step ? setStep(i) : undefined)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <Card className="mt-5 p-4 sm:p-6">
        {step === 0 ? <MosqueStep value={draft.mosque} onChange={setMosque} /> : null}

        {step === 1 ? (
          <RepeaterSection
            title="👥 মসজিদ কমিটি"
            addLabel="কমিটি সদস্য যোগ করুন"
            emptyText="এখনো কমিটির তথ্য যোগ করা হয়নি।"
            items={draft.committee}
            onAdd={() =>
              setDraft((d) => ({
                ...d,
                committee: [...d.committee, { full_name: "", position: "member", phone: "", phone_visibility: "private", bio: "" }],
              }))
            }
            onRemove={(i) => setDraft((d) => ({ ...d, committee: d.committee.filter((_, x) => x !== i) }))}
            render={(item, i) => {
              const patch = (p: Partial<CommitteeForm>) =>
                setDraft((d) => ({ ...d, committee: d.committee.map((c, x) => (x === i ? { ...c, ...p } : c)) }));
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldInput label="নাম" value={item.full_name} onChange={(v) => patch({ full_name: v })} required />
                  <div>
                    <Label>পদ</Label>
                    <Select value={item.position} onValueChange={(v) => patch({ position: v as CommitteePosition })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMITTEE_POSITIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {COMMITTEE_POSITION_LABEL_BN[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <PhoneWithVisibility
                    phone={item.phone}
                    visibility={item.phone_visibility}
                    onPhone={(v) => patch({ phone: v })}
                    onVisibility={(v) => patch({ phone_visibility: v })}
                  />
                  <div className="sm:col-span-2">
                    <Label>সংক্ষিপ্ত পরিচিতি</Label>
                    <Textarea className="mt-1" rows={2} value={item.bio} onChange={(e) => patch({ bio: e.target.value })} />
                  </div>
                </div>
              );
            }}
          />
        ) : null}

        {step === 2 ? (
          <RepeaterSection
            title="🤝 সমাজপতি"
            addLabel="সমাজপতি যোগ করুন"
            emptyText="এখনো সমাজপতির তথ্য যোগ করা হয়নি।"
            items={draft.leaders}
            onAdd={() =>
              setDraft((d) => ({
                ...d,
                leaders: [...d.leaders, { full_name: "", role_title: "", phone: "", phone_visibility: "private", description: "" }],
              }))
            }
            onRemove={(i) => setDraft((d) => ({ ...d, leaders: d.leaders.filter((_, x) => x !== i) }))}
            render={(item, i) => {
              const patch = (p: Partial<LeaderForm>) =>
                setDraft((d) => ({ ...d, leaders: d.leaders.map((c, x) => (x === i ? { ...c, ...p } : c)) }));
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldInput label="নাম" value={item.full_name} onChange={(v) => patch({ full_name: v })} required />
                  <FieldInput label="দায়িত্ব/পরিচয়" value={item.role_title} onChange={(v) => patch({ role_title: v })} />
                  <PhoneWithVisibility
                    phone={item.phone}
                    visibility={item.phone_visibility}
                    onPhone={(v) => patch({ phone: v })}
                    onVisibility={(v) => patch({ phone_visibility: v })}
                  />
                  <div className="sm:col-span-2">
                    <Label>বিবরণ</Label>
                    <Textarea
                      className="mt-1"
                      rows={2}
                      value={item.description}
                      onChange={(e) => patch({ description: e.target.value })}
                    />
                  </div>
                </div>
              );
            }}
          />
        ) : null}

        {step === 3 ? (
          <RepeaterSection
            title="👤 সমাজের সদস্য"
            addLabel="সদস্য যোগ করুন"
            emptyText="এখনো সমাজের সদস্যের তথ্য যোগ করা হয়নি।"
            items={draft.members}
            onAdd={() =>
              setDraft((d) => ({
                ...d,
                members: [...d.members, { full_name: "", family_name: "", phone: "", phone_visibility: "private", description: "" }],
              }))
            }
            onRemove={(i) => setDraft((d) => ({ ...d, members: d.members.filter((_, x) => x !== i) }))}
            render={(item, i) => {
              const patch = (p: Partial<MemberForm>) =>
                setDraft((d) => ({ ...d, members: d.members.map((c, x) => (x === i ? { ...c, ...p } : c)) }));
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldInput label="নাম" value={item.full_name} onChange={(v) => patch({ full_name: v })} required />
                  <FieldInput label="পরিবার/বাড়ির নাম" value={item.family_name} onChange={(v) => patch({ family_name: v })} />
                  <PhoneWithVisibility
                    phone={item.phone}
                    visibility={item.phone_visibility}
                    onPhone={(v) => patch({ phone: v })}
                    onVisibility={(v) => patch({ phone_visibility: v })}
                  />
                  <div className="sm:col-span-2">
                    <Label>বিবরণ</Label>
                    <Textarea
                      className="mt-1"
                      rows={2}
                      value={item.description}
                      onChange={(e) => patch({ description: e.target.value })}
                    />
                  </div>
                </div>
              );
            }}
          />
        ) : null}

        {step === 4 ? (
          <RepeaterSection
            title="🤲 দাতা ও সহযোগী"
            addLabel="দাতা যোগ করুন"
            emptyText="এখনো কোনো দাতার তথ্য যোগ করা হয়নি।"
            items={draft.donors}
            onAdd={() =>
              setDraft((d) => ({
                ...d,
                donors: [
                  ...d.donors,
                  {
                    full_name: "",
                    location: "",
                    purpose: DONATION_PURPOSES[0],
                    amount: "",
                    donated_on: "",
                    is_anonymous: false,
                    amount_visibility: "public",
                  },
                ],
              }))
            }
            onRemove={(i) => setDraft((d) => ({ ...d, donors: d.donors.filter((_, x) => x !== i) }))}
            render={(item, i) => {
              const patch = (p: Partial<DonorForm>) =>
                setDraft((d) => ({ ...d, donors: d.donors.map((c, x) => (x === i ? { ...c, ...p } : c)) }));
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldInput label="নাম" value={item.full_name} onChange={(v) => patch({ full_name: v })} required />
                  <FieldInput label="দেশ/এলাকা" value={item.location} onChange={(v) => patch({ location: v })} />
                  <div>
                    <Label>সহযোগিতার উদ্দেশ্য</Label>
                    <Select value={item.purpose} onValueChange={(v) => patch({ purpose: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="উদ্দেশ্য" />
                      </SelectTrigger>
                      <SelectContent>
                        {DONATION_PURPOSES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FieldInput
                    label="অনুদানের পরিমাণ (৳)"
                    type="number"
                    value={item.amount}
                    onChange={(v) => patch({ amount: v })}
                  />
                  <FieldInput
                    label="অনুদানের তারিখ"
                    type="date"
                    value={item.donated_on}
                    onChange={(v) => patch({ donated_on: v })}
                  />
                  <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={item.is_anonymous} onCheckedChange={(v) => patch({ is_anonymous: v })} />
                      নাম গোপন রাখুন (একজন শুভাকাঙ্ক্ষী)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={item.amount_visibility === "public"}
                        onCheckedChange={(v) => patch({ amount_visibility: v ? "public" : "private" })}
                      />
                      অনুদানের পরিমাণ প্রকাশ্য
                    </label>
                  </div>
                </div>
              );
            }}
          />
        ) : null}

        {step === 5 ? (
          <RepeaterSection
            title="🏗️ উন্নয়ন কার্যক্রম"
            addLabel="প্রকল্প যোগ করুন"
            emptyText="কোনো উন্নয়ন প্রকল্প যোগ করা হয়নি।"
            items={draft.projects}
            onAdd={() =>
              setDraft((d) => ({
                ...d,
                projects: [
                  ...d.projects,
                  {
                    name: "",
                    description: "",
                    target_amount: "",
                    collected_amount: "",
                    spent_amount: "",
                    start_date: "",
                    expected_completion_date: "",
                    status: "planned",
                  },
                ],
              }))
            }
            onRemove={(i) => setDraft((d) => ({ ...d, projects: d.projects.filter((_, x) => x !== i) }))}
            render={(item, i) => {
              const patch = (p: Partial<ProjectForm>) =>
                setDraft((d) => ({ ...d, projects: d.projects.map((c, x) => (x === i ? { ...c, ...p } : c)) }));
              const target = num(item.target_amount) ?? 0;
              const collected = num(item.collected_amount) ?? 0;
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldInput label="প্রকল্পের নাম" value={item.name} onChange={(v) => patch({ name: v })} required />
                  <div>
                    <Label>অবস্থা</Label>
                    <Select value={item.status} onValueChange={(v) => patch({ status: v as ProjectStatus })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {PROJECT_STATUS_LABEL_BN[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FieldInput
                    label="লক্ষ্যমাত্রা (৳)"
                    type="number"
                    value={item.target_amount}
                    onChange={(v) => patch({ target_amount: v })}
                  />
                  <FieldInput
                    label="সংগৃহীত (৳)"
                    type="number"
                    value={item.collected_amount}
                    onChange={(v) => patch({ collected_amount: v })}
                  />
                  <FieldInput
                    label="ব্যয় (৳)"
                    type="number"
                    value={item.spent_amount}
                    onChange={(v) => patch({ spent_amount: v })}
                  />
                  <div className="grid place-content-center rounded-lg border p-2 text-xs text-muted-foreground">
                    বাকি: {Math.max(0, target - collected)} ৳ · অগ্রগতি: {target > 0 ? Math.round((collected / target) * 100) : 0}%
                  </div>
                  <FieldInput label="শুরুর তারিখ" type="date" value={item.start_date} onChange={(v) => patch({ start_date: v })} />
                  <FieldInput
                    label="সম্ভাব্য সমাপ্তি"
                    type="date"
                    value={item.expected_completion_date}
                    onChange={(v) => patch({ expected_completion_date: v })}
                  />
                  <div className="sm:col-span-2">
                    <Label>বিবরণ</Label>
                    <Textarea
                      className="mt-1"
                      rows={2}
                      value={item.description}
                      onChange={(e) => patch({ description: e.target.value })}
                    />
                  </div>
                </div>
              );
            }}
          />
        ) : null}

        {step === 6 ? (
          <div>
            <h2 className="text-base font-bold">রিভিউ ও জমা</h2>
            <div className="mt-3 space-y-2 text-sm">
              <ReviewRow label="মসজিদের নাম" value={draft.mosque.name} />
              <ReviewRow
                label="ঠিকানা"
                value={[draft.mosque.area, draft.mosque.union_name, draft.mosque.upazila, draft.mosque.district]
                  .filter(Boolean)
                  .join(", ")}
              />
              <ReviewRow label="ইমাম" value={draft.mosque.imam_name || "—"} />
              <ReviewRow label="মুয়াজ্জিন" value={draft.mosque.muazzin_name || "—"} />
              <ReviewRow label="কমিটি সদস্য" value={`${draft.committee.length} জন`} />
              <ReviewRow label="সমাজপতি" value={`${draft.leaders.length} জন`} />
              <ReviewRow label="সমাজের সদস্য" value={`${draft.members.length} জন`} />
              <ReviewRow label="দাতা" value={`${draft.donors.length} জন`} />
              <ReviewRow label="প্রকল্প" value={`${draft.projects.length} টি`} />
            </div>
            <p className="mt-4 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              জমা দেওয়ার পর প্রোফাইলের অবস্থা হবে “যাচাইাধীন”। প্রশাসক যাচাই করার পরই এটি প্রকাশ্যে দেখা যাবে। অন্যের তথ্য যোগ করার
              আগে তাঁর অনুমতি নিন।
            </p>
          </div>
        ) : null}

        {err ? <p className="mt-4 text-sm text-destructive">{err}</p> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> পূর্ববর্তী
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => {
                if (stepError()) {
                  toast.error(stepError() as string);
                  return;
                }
                setStep((s) => s + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              পরবর্তী <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              জমা দিন
            </Button>
          )}
        </div>
      </Card>

      <button
        type="button"
        className="mt-4 text-xs text-muted-foreground underline"
        onClick={() => {
          setDraft(EMPTY_DRAFT);
          setStep(0);
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch {
            /* ignore */
          }
          toast.success("ফর্ম খালি করা হয়েছে");
        }}
      >
        ফর্ম খালি করুন
      </button>

      <p className="mt-2 text-xs text-muted-foreground">
        আপনার লেখা তথ্য এই ব্রাউজারে সাময়িকভাবে সংরক্ষিত থাকে, তাই ভুলে পাতা বন্ধ হলেও হারাবে না।
      </p>

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/community/mosques" })}>
          বাতিল করুন
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- sub-parts */

function MosqueStep({ value, onChange }: { value: MosqueForm; onChange: (p: Partial<MosqueForm>) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FieldInput label="মসজিদের নাম" value={value.name} onChange={(v) => onChange({ name: v })} required />
      </div>
      <FieldInput label="গ্রাম/এলাকার নাম" value={value.area} onChange={(v) => onChange({ area: v })} />
      <FieldInput label="ইউনিয়ন" value={value.union_name} onChange={(v) => onChange({ union_name: v })} />
      <FieldInput label="ওয়ার্ড" value={value.ward} onChange={(v) => onChange({ ward: v })} />
      <FieldInput label="উপজেলা" value={value.upazila} onChange={(v) => onChange({ upazila: v })} required />
      <FieldInput label="জেলা" value={value.district} onChange={(v) => onChange({ district: v })} required />
      <FieldInput
        label="প্রতিষ্ঠার সাল"
        type="number"
        value={value.established_year}
        onChange={(v) => onChange({ established_year: v })}
      />
      <FieldInput label="ইমামের নাম" value={value.imam_name} onChange={(v) => onChange({ imam_name: v })} />
      <FieldInput label="মুয়াজ্জিনের নাম" value={value.muazzin_name} onChange={(v) => onChange({ muazzin_name: v })} />
      <PhoneWithVisibility
        label="যোগাযোগ নম্বর"
        phone={value.phone}
        visibility={value.phone_visibility}
        onPhone={(v) => onChange({ phone: v })}
        onVisibility={(v) => onChange({ phone_visibility: v })}
      />
      <FieldInput
        label="Google Maps লিংক"
        value={value.map_url}
        onChange={(v) => onChange({ map_url: v })}
        placeholder="https://maps.google.com/..."
      />
      <FieldInput
        label="মসজিদের ছবির লিংক"
        value={value.photo_url}
        onChange={(v) => onChange({ photo_url: v })}
        placeholder="https://..."
      />
      <div className="sm:col-span-2">
        <Label>বিবরণ</Label>
        <Textarea className="mt-1" rows={4} value={value.description} onChange={(e) => onChange({ description: e.target.value })} />
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input className="mt-1" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PhoneWithVisibility({
  label = "মোবাইল নম্বর",
  phone,
  visibility,
  onPhone,
  onVisibility,
}: {
  label?: string;
  phone: string;
  visibility: Visibility;
  onPhone: (v: string) => void;
  onVisibility: (v: Visibility) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" value={phone} onChange={(e) => onPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" />
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Switch checked={visibility === "public"} onCheckedChange={(v) => onVisibility(v ? "public" : "private")} />
        নম্বর সবার জন্য প্রকাশ্য
      </label>
    </div>
  );
}

function RepeaterSection<T>({
  title,
  addLabel,
  emptyText,
  items,
  onAdd,
  onRemove,
  render,
}: {
  title: string;
  addLabel: string;
  emptyText: string;
  items: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  render: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" /> {addLabel}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                <Button size="sm" variant="ghost" onClick={() => onRemove(i)} aria-label="মুছুন">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {render(item, i)}
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">এই ধাপটি ঐচ্ছিক — পরে প্রোফাইল থেকেও যোগ করা যাবে।</p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}
