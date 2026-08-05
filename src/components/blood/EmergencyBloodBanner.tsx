import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X, Droplet, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "khijirion_blood_banner_dismissed_until";
const DISMISS_MS = 24 * 60 * 60 * 1000;

export function EmergencyBloodBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      setDismissed(Number.isFinite(until) && until > Date.now());
    } catch {
      setDismissed(false);
    }
  }, []);

  const stats = useQuery({
    queryKey: ["blood-banner-stats"],
    queryFn: async () => {
      const [reqs, donors, available] = await Promise.all([
        supabase
          .from("blood_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved"),
        supabase
          .from("blood_donors")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("is_active", true),
        supabase
          .from("blood_donors")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("is_active", true)
          .eq("available", true),
      ]);
      return {
        activeRequests: reqs.count ?? 0,
        totalDonors: donors.count ?? 0,
        availableToday: available.count ?? 0,
      };
    },
    staleTime: 60_000,
  });

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const s = stats.data ?? { activeRequests: 0, totalDonors: 0, availableToday: 0 };

  return (
    <section
      className="blood-banner relative border-b border-destructive/25 bg-[radial-gradient(120%_120%_at_50%_0%,color-mix(in_oklab,var(--brand-red)_14%,transparent)_0%,transparent_70%)]"
      aria-label="জরুরি রক্তদান"
    >
      <button
        onClick={dismiss}
        aria-label="বন্ধ করুন"
        className="absolute right-3 top-3 rounded-full border border-destructive/25 p-1.5 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-destructive sm:text-3xl md:text-4xl">
            <Droplet className="h-7 w-7 fill-destructive text-destructive sm:h-8 sm:w-8" />
            🩸 রক্ত প্রয়োজন?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            উখিয়ার যাচাইকৃত রক্তদাতাদের সাথে কয়েক মিনিটেই যোগাযোগ করুন।
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/request-blood"
              className="donate-pulse inline-flex h-12 items-center justify-center gap-2 rounded-full bg-destructive px-7 text-sm font-semibold text-destructive-foreground transition-transform hover:-translate-y-0.5"
            >
              <Droplet className="h-4 w-4" /> 🩸 রক্তের অনুরোধ করুন
            </Link>
            <Link
              to="/blood-donors/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-destructive/35 bg-card/60 px-7 text-sm font-semibold text-destructive backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-destructive/10"
            >
              <Heart className="h-4 w-4" /> ❤️ রক্তদাতা হিসেবে যুক্ত হোন
            </Link>
          </div>

          <div className="mt-6 grid w-full max-w-3xl grid-cols-3 gap-2 sm:gap-4">
            <StatCard label="জরুরি অনুরোধ" value={s.activeRequests} />
            <StatCard label="নিবন্ধিত দাতা" value={s.totalDonors} />
            <StatCard label="আজ প্রস্তুত" value={s.availableToday} />
          </div>

          <div className="mt-3">
            <Link to="/blood-donors" className="text-xs text-destructive underline-offset-4 hover:underline">
              সব দাতা দেখুন →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes donatePulse {
          0%, 100% { box-shadow: 0 10px 25px -5px rgba(220,38,38,.35), 0 0 0 0 rgba(220,38,38,.55); }
          50% { box-shadow: 0 10px 25px -5px rgba(220,38,38,.45), 0 0 0 10px rgba(220,38,38,0); }
        }
        .donate-pulse { animation: donatePulse 2.4s ease-in-out infinite; }
        @keyframes bannerIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .blood-banner { animation: bannerIn .45s cubic-bezier(.22,1,.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .blood-banner { animation: none; } }
        @media (prefers-reduced-motion: reduce) { .donate-pulse { animation: none; } }
      `}</style>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-card/70 p-3 shadow-[var(--shadow-sm)] backdrop-blur">
      <div className="text-xl font-extrabold text-destructive sm:text-2xl">
        {value.toLocaleString("bn-BD")}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</div>
    </div>
  );
}
