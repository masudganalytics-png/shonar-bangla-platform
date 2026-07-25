import type { CVData, CVTemplate } from "@/lib/cv-builder/types";

// All templates share the same data. Styling differs.
// The outer StyledBody wrapper applies per-template CSS via descendant selectors,
// so Section itself only needs the generic .cv-section-title class.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="cv-section">
      <h2 className="cv-section-title">{title}</h2>
      <div className="cv-section-body">{children}</div>
    </section>
  );
}



function KV({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="flex gap-2 text-[13px] leading-snug">
      <span className="min-w-[110px] font-medium text-black/70">{k}</span>
      <span className="text-black/90">{v}</span>
    </div>
  );
}

function hasAny(o: Record<string, string>) { return Object.values(o).some(v => v && v.trim()); }

function CommonBody({ data }: { data: CVData }) {
  const p = data.personal;
  const s = data.skills;
  const a = data.additional;
  return (
    <>
      {data.objective && (
        <Section title="ক্যারিয়ার লক্ষ্য">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-black/85">{data.objective}</p>
        </Section>
      )}

      {data.education.length > 0 && (
        <Section title="শিক্ষাগত যোগ্যতা">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-black/30 text-left text-black/70">
                <th className="py-1 pr-2">ডিগ্রি</th><th className="py-1 pr-2">প্রতিষ্ঠান</th>
                <th className="py-1 pr-2">বোর্ড/বিঃবিঃ</th><th className="py-1 pr-2">সাল</th><th className="py-1">ফলাফল</th>
              </tr>
            </thead>
            <tbody>
              {data.education.map(e => (
                <tr key={e.id} className="border-b border-black/10 align-top">
                  <td className="py-1.5 pr-2">{e.degree}{e.group && <div className="text-[11px] text-black/60">{e.group}</div>}</td>
                  <td className="py-1.5 pr-2">{e.institution}</td>
                  <td className="py-1.5 pr-2">{e.board}</td>
                  <td className="py-1.5 pr-2">{e.passing_year}</td>
                  <td className="py-1.5">{e.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {data.experience.length > 0 && (
        <Section title="কর্ম অভিজ্ঞতা">
          <div className="space-y-3">
            {data.experience.map(e => (
              <div key={e.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <div className="font-semibold text-[13.5px]">{e.position} <span className="font-normal text-black/70">— {e.organization}</span></div>
                  <div className="text-[12px] text-black/60">{e.duration}</div>
                </div>
                {e.responsibilities && <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-black/85">{e.responsibilities}</p>}
                {e.achievements && <p className="mt-1 whitespace-pre-wrap text-[12.5px] italic text-black/75"><span className="font-medium not-italic">অর্জন: </span>{e.achievements}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.training.length > 0 && (
        <Section title="প্রশিক্ষণ">
          <ul className="space-y-1 text-[13px]">
            {data.training.map(t => (
              <li key={t.id} className="flex flex-wrap justify-between gap-2">
                <span><span className="font-medium">{t.name}</span>{t.institute && ` — ${t.institute}`}</span>
                <span className="text-black/60">{[t.duration, t.year].filter(Boolean).join(", ")}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hasAny(s) && (
        <Section title="দক্ষতা">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <KV k="কম্পিউটার" v={s.computer} />
            <KV k="যোগাযোগ" v={s.communication} />
            <KV k="নেতৃত্ব" v={s.leadership} />
            <KV k="ভাষা" v={s.languages} />
            <KV k="ড্রাইভিং" v={s.driving_license} />
            <KV k="টাইপিং" v={s.typing_speed} />
            <KV k="টেকনিক্যাল" v={s.technical} />
          </div>
        </Section>
      )}

      <Section title="ব্যক্তিগত তথ্য">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          <KV k="পিতার নাম" v={p.father_name} />
          <KV k="মাতার নাম" v={p.mother_name} />
          <KV k="জন্ম তারিখ" v={p.dob} />
          <KV k="লিঙ্গ" v={p.gender} />
          <KV k="বৈবাহিক অবস্থা" v={p.marital_status} />
          <KV k="জাতীয়তা" v={p.nationality} />
          <KV k="ধর্ম" v={p.religion} />
          <KV k="রক্তের গ্রুপ" v={p.blood_group} />
          <KV k="NID" v={p.nid} />
          <KV k="পাসপোর্ট" v={p.passport} />
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {p.present_address && <div><div className="text-[12px] font-medium text-black/70">বর্তমান ঠিকানা</div><div className="whitespace-pre-wrap text-[12.5px]">{p.present_address}</div></div>}
          {p.permanent_address && <div><div className="text-[12px] font-medium text-black/70">স্থায়ী ঠিকানা</div><div className="whitespace-pre-wrap text-[12.5px]">{p.permanent_address}</div></div>}
        </div>
      </Section>

      {hasAny(a) && (
        <Section title="অতিরিক্ত তথ্য">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <KV k="প্রত্যাশিত বেতন" v={a.expected_salary} />
            <KV k="নোটিশ পিরিয়ড" v={a.notice_period} />
          </div>
          {a.hobbies && <div className="mt-1 text-[12.5px]"><span className="font-medium">শখ: </span>{a.hobbies}</div>}
          {a.extra_activities && <div className="mt-1 whitespace-pre-wrap text-[12.5px]"><span className="font-medium">অন্যান্য কার্যক্রম: </span>{a.extra_activities}</div>}
        </Section>
      )}

      {data.references.length > 0 && (
        <Section title="রেফারেন্স">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.references.map(r => (
              <div key={r.id} className="text-[12.5px] leading-snug">
                <div className="font-semibold">{r.name}</div>
                {r.designation && <div>{r.designation}</div>}
                {r.organization && <div className="text-black/70">{r.organization}</div>}
                {r.phone && <div>ফোন: {r.phone}</div>}
                {r.email && <div>ইমেইল: {r.email}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

// ---- Template header variants ----

function GovHeader({ data }: { data: CVData }) {
  const p = data.personal;
  return (
    <header className="border-b-2 border-black pb-3 text-center">
      <h1 className="text-2xl font-bold tracking-wide">জীবন বৃত্তান্ত</h1>
      <div className="mt-1 text-lg font-semibold">{p.full_name || "— নাম —"}</div>
      <div className="mt-1 text-[12.5px] text-black/75">
        {[p.mobile, p.email, p.present_address].filter(Boolean).join(" • ")}
      </div>
      {p.photo && <img src={p.photo} className="mx-auto mt-2 h-28 w-20 rounded border border-black/40 object-cover" />}
    </header>
  );
}

function NgoHeader({ data }: { data: CVData }) {
  const p = data.personal;
  return (
    <header className="flex items-center justify-between gap-4 border-b-4 pb-4" style={{ borderColor: "#2E7D32" }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#2E7D32" }}>{p.full_name || "— নাম —"}</h1>
        <div className="mt-1 text-[13px] text-black/80">{[p.mobile, p.email].filter(Boolean).join(" • ")}</div>
        <div className="text-[12.5px] text-black/70">{p.present_address}</div>
      </div>
      {p.photo && <img src={p.photo} className="h-28 w-20 rounded object-cover" style={{ border: "2px solid #2E7D32" }} />}
    </header>
  );
}

function AtsHeader({ data }: { data: CVData }) {
  const p = data.personal;
  return (
    <header className="pb-3">
      <h1 className="text-2xl font-bold">{p.full_name || "— NAME —"}</h1>
      <div className="mt-1 text-[13px] text-black/80">{[p.mobile, p.email, p.present_address].filter(Boolean).join(" | ")}</div>
    </header>
  );
}

function CorporateHeader({ data }: { data: CVData }) {
  const p = data.personal;
  return (
    <header className="flex items-center justify-between gap-4 rounded-md p-4" style={{ background: "#1565C0", color: "white" }}>
      <div>
        <h1 className="text-2xl font-bold">{p.full_name || "— নাম —"}</h1>
        <div className="mt-1 text-[13px] opacity-90">{[p.mobile, p.email].filter(Boolean).join(" • ")}</div>
        <div className="text-[12.5px] opacity-80">{p.present_address}</div>
      </div>
      {p.photo && <img src={p.photo} className="h-28 w-20 rounded border border-white/40 object-cover" />}
    </header>
  );
}

function ExecutiveHeader({ data }: { data: CVData }) {
  const p = data.personal;
  return (
    <header className="border-b border-black/60 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold uppercase tracking-wider">{p.full_name || "— নাম —"}</h1>
          <div className="mt-2 text-[13px] uppercase tracking-widest text-black/70">{data.experience[0]?.position || "Executive Profile"}</div>
          <div className="mt-1 text-[12.5px] text-black/80">{[p.mobile, p.email, p.present_address].filter(Boolean).join(" • ")}</div>
        </div>
        {p.photo && <img src={p.photo} className="h-28 w-20 border border-black/60 object-cover" />}
      </div>
    </header>
  );
}

const TEMPLATE_STYLES: Record<CVTemplate, { headerFont: string; sectionClass: string; wrap: string }> = {
  government: { headerFont: "font-sans", sectionClass: "cv-section-title-gov", wrap: "font-sans" },
  ngo:        { headerFont: "font-sans", sectionClass: "cv-section-title-ngo", wrap: "font-sans" },
  ats:        { headerFont: "font-sans", sectionClass: "cv-section-title-ats", wrap: "font-sans" },
  corporate:  { headerFont: "font-sans", sectionClass: "cv-section-title-corp", wrap: "font-sans" },
  executive:  { headerFont: "font-serif", sectionClass: "cv-section-title-exec", wrap: "font-serif" },
};

export function CVPreview({ data }: { data: CVData }) {
  const t = data.template;
  const styles = TEMPLATE_STYLES[t];
  const Header = ({
    government: GovHeader, ngo: NgoHeader, ats: AtsHeader, corporate: CorporateHeader, executive: ExecutiveHeader,
  } as const)[t];

  return (
    <div id="cv-print-root" className={`cv-doc cv-tpl-${t} ${styles.wrap}`} data-template={t}>
      <style>{`
        .cv-doc { color: #111; background: #fff; padding: 28px 32px; min-height: 297mm; width: 100%; font-size: 13px; line-height: 1.5; }
        .cv-section { margin-top: 14px; }
        .cv-section-title { font-size: 13px; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 6px; display: block; }
        .cv-tpl-government .cv-section-title { text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 2px; }
        .cv-tpl-ngo .cv-section-title        { color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 2px; }
        .cv-tpl-ats .cv-section-title        { text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 2px; font-size: 12.5px; }
        .cv-tpl-corporate .cv-section-title  { color: #1565C0; border-bottom: 2px solid #1565C0; padding-bottom: 2px; }
        .cv-tpl-executive .cv-section-title  { font-family: serif; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 1px solid #000; padding-bottom: 3px; }
        @page { size: A4; margin: 12mm; }
      `}</style>
      <Header data={data} />
      <CommonBody data={data} />
    </div>
  );
}

