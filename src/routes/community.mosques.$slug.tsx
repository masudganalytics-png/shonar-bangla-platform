import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  Flag,
  Loader2,
  MapPin,
  Phone,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { getMosqueDetail, reportMosque } from "@/lib/mosque.functions";
import {
  COMMITTEE_POSITION_LABEL_BN,
  NOTICE_PRIORITY_LABEL_BN,
  PROJECT_STATUS_LABEL_BN,
  donorDisplayName,
  mosqueLocationLine,
  projectProgress,
  projectRemaining,
  type MosqueDetail,
} from "@/lib/mosque-shared";

export const Route = createFileRoute("/community/mosques/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `মসজিদ ও সমাজ — ${params.slug} | উখিয়া সেবা` },
      {
        name: "description",
        content: "মসজিদের তথ্য, মসজিদ কমিটি, ইমাম ও মুয়াজ্জিন, আয়-ব্যয়ের হিসাব, কার্যক্রম ও সমাজের সদস্যদের তালিকা।",
      },
      { property: "og:title", content: "মসজিদ ও সমাজ — উখিয়া সেবা" },
      { property: "og:description", content: "মসজিদ কমিটি ও সমাজের তথ্য দেখুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MosqueDetailPage,
});

const money = (n: number) => `${new Intl.NumberFormat("bn-BD").format(Math.round(n))} ৳`;
const dt = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" }) : "—";

function MosqueDetailPage() {
  const { slug } = Route.useParams();
  const fetchDetail = useServerFn(getMosqueDetail);

  const q = useQuery({
    queryKey: ["mosque-detail", slug],
    queryFn: (): Promise<MosqueDetail | null> => fetchDetail({ data: { slug } }),
  });

  if (q.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!q.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-4xl">🕌</p>
        <h1 className="mt-4 text-xl font-bold">প্রোফাইলটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          এটি এখনো যাচাই হয়নি অথবা মুছে ফেলা হয়েছে।
        </p>
        <Button asChild className="mt-4">
          <Link to="/community/mosques">তালিকায় ফিরে যান</Link>
        </Button>
      </div>
    );
  }

  const d = q.data;
  const m = d.mosque;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/community/mosques"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> মসজিদ ও সমাজ
      </Link>

      {/* Header */}
      <Card className="mt-3 overflow-hidden">
        {m.photo_url ? (
          <img src={m.photo_url} alt={`${m.name} — মসজিদের ছবি`} className="h-44 w-full object-cover sm:h-56" />
        ) : (
          <div className="grid h-32 w-full place-items-center bg-primary/10 text-5xl sm:h-40">🕌</div>
        )}
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">🕌 {m.name}</h1>
              <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {mosqueLocationLine(m)}
              </p>
            </div>
            {m.status === "verified" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="h-4 w-4" /> Verified
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                🟡 যাচাইাধীন
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {m.phone ? (
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${m.phone}`}>
                  <Phone className="mr-2 h-4 w-4" /> {m.phone}
                </a>
              </Button>
            ) : null}
            {m.map_url ? (
              <Button asChild size="sm" variant="outline">
                <a href={m.map_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> ম্যাপে দেখুন
                </a>
              </Button>
            ) : null}
            <ReportDialog mosqueId={m.id} />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="overview">ওভারভিউ</TabsTrigger>
            <TabsTrigger value="committee">কমিটি</TabsTrigger>
            <TabsTrigger value="imam">ইমাম ও মুয়াজ্জিন</TabsTrigger>
            <TabsTrigger value="fund">আয়-ব্যয়</TabsTrigger>
            <TabsTrigger value="activities">কার্যক্রম</TabsTrigger>
            <TabsTrigger value="members">সমাজের সদস্য</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">🕌 মসজিদের তথ্য</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="গ্রাম/এলাকা" value={m.area} />
              <Field label="ইউনিয়ন" value={m.union_name} />
              <Field label="ওয়ার্ড" value={m.ward} />
              <Field label="উপজেলা" value={m.upazila} />
              <Field label="জেলা" value={m.district} />
              <Field label="প্রতিষ্ঠার সাল" value={m.established_year ? String(m.established_year) : null} />
            </dl>
            {m.description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{m.description}</p>
            ) : null}
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">🏗️ উন্নয়ন কার্যক্রম</h2>
            {d.projects.length === 0 ? (
              <Empty text="কোনো উন্নয়ন প্রকল্প পাওয়া যায়নি।" />
            ) : (
              <div className="mt-3 space-y-3">
                {d.projects.map((p) => (
                  <div key={p.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{PROJECT_STATUS_LABEL_BN[p.status]}</span>
                    </div>
                    {p.description ? <p className="mt-1 text-sm text-muted-foreground">{p.description}</p> : null}
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${projectProgress(p)}%` }} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                      <span>লক্ষ্য: {money(Number(p.target_amount))}</span>
                      <span>সংগৃহীত: {money(Number(p.collected_amount))}</span>
                      <span>ব্যয়: {money(Number(p.spent_amount))}</span>
                      <span>বাকি: {money(projectRemaining(p))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">🤲 দাতা ও সহযোগী</h2>
            {d.donors.length === 0 ? (
              <Empty text="এখনো কোনো দাতার তথ্য যোগ করা হয়নি।" />
            ) : (
              <ul className="mt-3 divide-y">
                {d.donors.map((don) => (
                  <li key={don.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="font-medium">{donorDisplayName(don)}</span>
                    <span className="text-xs text-muted-foreground">
                      {don.purpose ?? "—"} · {don.amount !== null ? money(Number(don.amount)) : "গোপন"} · {dt(don.donated_on)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">📢 নোটিশ ও ঘোষণা</h2>
            {d.notices.length === 0 ? (
              <Empty text="এখনো কোনো নোটিশ যোগ করা হয়নি।" />
            ) : (
              <div className="mt-3 space-y-3">
                {d.notices.map((n) => (
                  <div key={n.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{n.title}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{NOTICE_PRIORITY_LABEL_BN[n.priority]}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{dt(n.notice_date)}</p>
                    {n.description ? <p className="mt-2 text-sm text-muted-foreground">{n.description}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Committee */}
        <TabsContent value="committee" className="mt-4">
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">👥 মসজিদ কমিটি</h2>
            {d.committee.length === 0 ? (
              <Empty text="এই মসজিদের কমিটির তথ্য এখনো যোগ করা হয়নি।" />
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {d.committee.map((c) => (
                  <PersonCard
                    key={c.id}
                    name={c.full_name}
                    photo={c.photo_url}
                    role={c.custom_title || COMMITTEE_POSITION_LABEL_BN[c.position]}
                    phone={c.phone}
                    note={c.bio}
                  />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Imam & Muazzin */}
        <TabsContent value="imam" className="mt-4">
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">🕌 ইমাম ও মুয়াজ্জিন</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">ইমাম</p>
                <p className="mt-1 font-semibold">{m.imam_name || "তথ্য যোগ করা হয়নি"}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">মুয়াজ্জিন</p>
                <p className="mt-1 font-semibold">{m.muazzin_name || "তথ্য যোগ করা হয়নি"}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              যোগাযোগ নম্বর কেবল তখনই দেখানো হয় যখন কর্তৃপক্ষ তা প্রকাশ্য করেছেন।
            </p>
          </Card>
        </TabsContent>

        {/* Monthly fund / finance */}
        <TabsContent value="fund" className="mt-4">
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">💰 আয়-ব্যয়ের হিসাব</h2>
            {!d.finance.visible ? (
              <Empty text="এই মসজিদের আর্থিক হিসাব প্রকাশ্য নয়।" />
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Stat label="মোট আয়" value={money(d.finance.income)} />
                <Stat label="মোট ব্যয়" value={money(d.finance.expense)} />
                <Stat label="বর্তমান ব্যালেন্স" value={money(d.finance.balance)} />
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Activities */}
        <TabsContent value="activities" className="mt-4">
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">📅 সামাজিক ও মসজিদ কার্যক্রম</h2>
            {d.activities.length === 0 ? (
              <Empty text="এখনো কোনো কার্যক্রম যোগ করা হয়নি।" />
            ) : (
              <div className="mt-3 space-y-3">
                {d.activities.map((a) => (
                  <div key={a.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{a.name}</h3>
                      <span className="text-xs text-muted-foreground">{dt(a.activity_date)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[a.location, a.organizer].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {a.description ? <p className="mt-2 text-sm text-muted-foreground">{a.description}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Society leaders & members */}
        <TabsContent value="members" className="mt-4 space-y-4">
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">🤝 সমাজপতি</h2>
            {d.leaders.length === 0 ? (
              <Empty text="এখনো সমাজপতির তথ্য যোগ করা হয়নি।" />
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {d.leaders.map((l) => (
                  <PersonCard
                    key={l.id}
                    name={l.full_name}
                    photo={l.photo_url}
                    role={l.role_title}
                    phone={l.phone}
                    note={l.description}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold">👤 সমাজের সদস্য</h2>
            {d.members.length === 0 ? (
              <Empty text="এখনো সমাজের সদস্যের তথ্য যোগ করা হয়নি।" />
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {d.members.map((s) => (
                  <PersonCard
                    key={s.id}
                    name={s.full_name}
                    photo={s.photo_url}
                    role={s.family_name}
                    phone={s.phone}
                    note={s.description}
                  />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mt-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function PersonCard({
  name,
  photo,
  role,
  phone,
  note,
}: {
  name: string;
  photo: string | null;
  role: string | null;
  phone: string | null;
  note: string | null;
}) {
  return (
    <div className="flex gap-3 rounded-xl border p-3">
      {photo ? (
        <img src={photo} alt={name} loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold">
          {name.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold">{name}</p>
        {role ? <p className="text-xs text-muted-foreground">{role}</p> : null}
        {phone ? (
          <a href={`tel:${phone}`} className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
            <Phone className="h-3 w-3" /> {phone}
          </a>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">নম্বর গোপন</p>
        )}
        {note ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note}</p> : null}
      </div>
    </div>
  );
}

function ReportDialog({ mosqueId }: { mosqueId: string }) {
  const { isAuthenticated } = useAuth();
  const report = useServerFn(reportMosque);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const submit = useMutation({
    mutationFn: () => report({ data: { mosqueId, reason: reason.trim() } }),
    onSuccess: () => {
      toast.success("আপনার রিপোর্ট জমা হয়েছে");
      setReason("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || "রিপোর্ট জমা দেওয়া যায়নি"),
  });

  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" variant="ghost">
        <Link to="/auth" search={{ mode: "login" }}>
          <Flag className="mr-2 h-4 w-4" /> ভুল তথ্য রিপোর্ট
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Flag className="mr-2 h-4 w-4" /> ভুল তথ্য রিপোর্ট
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ভুল বা অনুপযুক্ত তথ্য রিপোর্ট করুন</DialogTitle>
          <DialogDescription>কী ভুল আছে সংক্ষেপে লিখুন। প্রশাসক বিষয়টি যাচাই করবেন।</DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="যেমন: কমিটির সদস্যের তথ্য সঠিক নয়"
          rows={4}
        />
        <DialogFooter>
          <Button
            onClick={() => submit.mutate()}
            disabled={reason.trim().length < 5 || submit.isPending}
          >
            {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            জমা দিন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
