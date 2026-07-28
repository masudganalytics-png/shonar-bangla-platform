import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X, Droplet, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "ukhiya_blood_banner_dismissed";

export function EmergencyBloodBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
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
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const s = stats.data ?? { activeRequests: 0, totalDonors: 0, availableToday: 0 };

  return (
    <section
      className="relative border-b border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50 dark:border-red-900/40 dark:from-red-950/40 dark:via-background dark:to-red-950/30"
      aria-label="জরুরি রক্তদান"
    >
      <button
        onClick={dismiss}
        aria-label="বন্ধ করুন"
        className="absolute right-3 top-3 rounded-md p-1.5 text-red-700/70 hover:bg-red-100 hover:text-red-800 dark:text-red-300/70 dark:hover:bg-red-900/40"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-red-700 dark:text-red-400 sm:text-3xl md:text-4xl">
            <Droplet className="h-7 w-7 fill-red-600 text-red-600 sm:h-8 sm:w-8" />
            🩸 রক্ত প্রয়োজন?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            উখিয়ার যাচাইকৃত রক্তদাতাদের সাথে কয়েক মিনিটেই যোগাযোগ করুন।
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/request-blood"
              className="donate-pulse inline-flex h-12 items-center justify-center gap-2 rounded-md bg-red-600 px-6 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-colors hover:bg-red-700"
            >
              <Droplet className="h-4 w-4" /> 🩸 রক্তের অনুরোধ করুন
            </Link>
            <Link
              to="/blood-donors/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-6 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/40"
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
            <Link to="/blood-donors" className="text-xs text-red-700 underline-offset-2 hover:underline dark:text-red-300">
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
        .donate-pulse { animation: donatePulse 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .donate-pulse { animation: none; } }
      `}</style>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-red-200/60 bg-white/80 p-3 shadow-sm dark:border-red-900/40 dark:bg-background/60">
      <div className="text-xl font-extrabold text-red-700 dark:text-red-400 sm:text-2xl">
        {value.toLocaleString("bn-BD")}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</div>
    </div>
  );
}
