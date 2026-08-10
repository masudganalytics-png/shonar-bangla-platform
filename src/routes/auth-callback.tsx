import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthBrandSplash } from "@/components/auth/AuthBrandSplash";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  redirect: z.string().optional(),
  error_description: z.string().optional(),
});

export const Route = createFileRoute("/auth-callback")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "সাইন ইন হচ্ছে — KHIJIRION" },
      { name: "description", content: "আপনার KHIJIRION অ্যাকাউন্টে সাইন ইন সম্পন্ন হচ্ছে।" },
      { property: "og:title", content: "সাইন ইন হচ্ছে — KHIJIRION" },
      { property: "og:description", content: "আপনার KHIJIRION অ্যাকাউন্টে সাইন ইন সম্পন্ন হচ্ছে।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function AuthCallbackPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(search.error_description ?? null);

  useEffect(() => {
    let cancelled = false;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashError = hash.get("error_description");
    if (hashError) {
      setError(hashError);
      return;
    }
    // Recovery links must land on the password form, not the app.
    if (hash.get("type") === "recovery") {
      navigate({ to: "/reset-password", replace: true });
      return;
    }

    const finish = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        navigate({ to: safePath(search.redirect), replace: true });
      } else {
        setError("সেশন তৈরি করা যায়নি। আবার সাইন ইন করার চেষ্টা করুন।");
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: safePath(search.redirect), replace: true });
    });

    const timer = setTimeout(() => void finish(), 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [navigate, search.redirect]);

  if (error) {
    return (
      <AuthBrandSplash
        loading={false}
        message="সাইন ইন সম্পন্ন হয়নি"
        hint={error}
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/auth">আবার চেষ্টা করুন</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">হোমে যান</Link>
          </Button>
        </div>
      </AuthBrandSplash>
    );
  }

  return (
    <AuthBrandSplash
      message="সাইন ইন সম্পন্ন হচ্ছে…"
      hint="একটু অপেক্ষা করুন, আপনাকে নিরাপদে নিয়ে যাওয়া হচ্ছে।"
    />
  );
}
