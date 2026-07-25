import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Zap, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "সাইন ইন — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "মোবাইল নম্বর দিয়ে সরাসরি সাইন ইন করুন।" },
      { property: "og:title", content: "সাইন ইন — উখিয়া বিদ্যুৎ বিল" },
      { property: "og:description", content: "মোবাইল নম্বর দিয়ে সরাসরি সাইন ইন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

// Normalise BD numbers: accepts 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX
function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^01[3-9]\d{8}$/.test(digits)) return `88${digits}`;
  if (/^8801[3-9]\d{8}$/.test(digits)) return digits;
  return null;
}

function phoneCredentials(normalizedDigits: string) {
  // Deterministic synthetic credentials — phone acts as sole identity.
  return {
    email: `${normalizedDigits}@phone.ukhiya-bill.local`,
    password: `ukhiya_${normalizedDigits}_v1`,
  };
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);

  const [phoneInput, setPhoneInput] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: search.redirect ?? "/", replace: true });
    }
  }, [isAuthenticated, loading, navigate, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) return toast.error("আগে ডিসক্লেইমার-এ সম্মতি দিন");
    const normalized = normalizeBdPhone(phoneInput);
    if (!normalized) return toast.error("সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন ০১৭xxxxxxxx)");

    setSubmitting(true);
    const { email, password } = phoneCredentials(normalized);

    // Try to sign in first
    const signInRes = await supabase.auth.signInWithPassword({ email, password });

    if (signInRes.error) {
      // Not registered — create the account now, then session is auto-established
      const signUpRes = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName.trim() || `+${normalized}`,
            phone: `+${normalized}`,
          },
        },
      });
      if (signUpRes.error) {
        setSubmitting(false);
        toast.error(signUpRes.error.message || "সাইন ইন ব্যর্থ হয়েছে");
        return;
      }
      // If email confirmation is on, session will be null — sign in explicitly
      if (!signUpRes.data.session) {
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (retry.error) {
          setSubmitting(false);
          toast.error("সাইন ইন ব্যর্থ হয়েছে — Auth সেটিংসে auto-confirm চালু করুন");
          return;
        }
      }
      toast.success("অ্যাকাউন্ট তৈরি হয়েছে ও সাইন ইন হয়েছে");
    } else {
      toast.success("সফলভাবে সাইন ইন হয়েছে");
    }

    setSubmitting(false);
    navigate({ to: search.redirect ?? "/", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)]">
          <Zap className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 text-2xl font-bold">উখিয়া বিদ্যুৎ বিল</h1>
        <p className="mt-1 text-sm text-muted-foreground">স্বচ্ছ বিল, সচেতন গ্রাহক।</p>
      </div>

      <div className="mb-4 rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm">
        <p className="font-semibold text-warning">গুরুত্বপূর্ণ তথ্য</p>
        <p className="mt-2 text-foreground/90">
          উখিয়া বিদ্যুৎ বিল একটি স্বাধীন জনসেবামূলক তথ্যভিত্তিক প্ল্যাটফর্ম। এটি কোনো সরকারি প্রতিষ্ঠান,
          বাংলাদেশ পল্লী বিদ্যুৎ সমিতি (BREB), বা অন্য কোনো সরকারি সংস্থার অফিসিয়াল অ্যাপ বা ওয়েবসাইট নয়।
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          এখানে প্রদর্শিত তুলনামূলক তথ্য ব্যবহারকারীদের স্বেচ্ছায় জমা দেওয়া তথ্য ও সমষ্টিগত (aggregated)
          বিশ্লেষণের ভিত্তিতে তৈরি।
        </p>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border"
          />
          <span>আমি বুঝেছি যে এটি কোনো সরকারি অ্যাপ নয়।</span>
        </label>
      </div>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Phone className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">মোবাইল নম্বর দিয়ে সাইন ইন</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              নতুন ব্যবহারকারী হলে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট তৈরি হবে।
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">পুরো নাম <span className="text-muted-foreground">(ঐচ্ছিক)</span></Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="আপনার পূর্ণ নাম"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">মোবাইল নম্বর</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
              required
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">উদাহরণ: 01712345678</p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting || !acknowledged}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            সাইন ইন / নিবন্ধন
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        সাইন ইন করে আপনি আমাদের{" "}
        <Link to="/terms" className="underline hover:text-foreground">শর্তাবলী</Link> ও{" "}
        <Link to="/privacy" className="underline hover:text-foreground">গোপনীয়তা নীতি</Link>-তে সম্মত হন।
      </p>
    </div>
  );
}
