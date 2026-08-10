import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { parsePhoneNumberFromString, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { PhoneField, DEFAULT_COUNTRY } from "@/components/auth/PhoneField";
import { AuthBrandSplash } from "@/components/auth/AuthBrandSplash";
import { authRedirectUrl } from "@/lib/auth-redirect";
import logoAsset from "@/assets/khijirion-logo.png.asset.json";



const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["login", "register"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "সাইন ইন — KHIJIRION" },
      { name: "description", content: "মোবাইল নম্বর বা Google দিয়ে KHIJIRION-এ সাইন ইন করুন।" },
      { property: "og:title", content: "সাইন ইন — KHIJIRION" },
      { property: "og:description", content: "মোবাইল নম্বর বা Google দিয়ে KHIJIRION-এ সাইন ইন।" },

      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

// Normalise any international number to E.164 digits (no "+"), e.g. 8801712345678.
// Accepts national format for the selected country (01XXXXXXXXX), +8801712345678 and 8801712345678.
function normalizePhone(input: string, country: CountryCode): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  for (const candidate of [trimmed, `+${digits}`]) {
    const parsed = parsePhoneNumberFromString(candidate, country);
    if (parsed?.isValid()) return parsed.number.replace("+", "");
  }
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
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);

  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: search.redirect ?? "/", replace: true });
    }
  }, [isAuthenticated, loading, navigate, search.redirect]);

  if (loading || isAuthenticated) {
    return (
      <AuthBrandSplash
        message={isAuthenticated ? "সাইন ইন সম্পন্ন হচ্ছে…" : "লোড হচ্ছে…"}
        hint="একটু অপেক্ষা করুন।"
      />
    );
  }


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) return toast.error("আগে ডিসক্লেইমার-এ সম্মতি দিন");
    const normalized = normalizePhone(phoneInput, country);
    if (!normalized) return toast.error("সঠিক মোবাইল নম্বর দিন (নির্বাচিত দেশ অনুযায়ী)");


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
          emailRedirectTo: authRedirectUrl("/auth-callback"),
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
        <img
          src={logoAsset.url}
          alt="KHIJIRION"
          className="mx-auto h-20 w-20 object-contain"
          width={80}
          height={80}
        />
        <h1 className="mt-4 text-2xl font-bold">KHIJIRION</h1>
        <p className="mt-1 text-sm text-muted-foreground">উখিয়ার সব প্রয়োজনীয় সেবা, এক জায়গায়।</p>
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
        <div className="mb-4 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            disabled={!acknowledged || submitting}
            onClick={async () => {
              if (!acknowledged) return toast.error("আগে ডিসক্লেইমার-এ সম্মতি দিন");
              const res = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: authRedirectUrl("/auth-callback"),
              });
              if (res.error) toast.error(res.error.message || "Google সাইন ইন ব্যর্থ");
            }}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google দিয়ে সাইন ইন
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">অথবা</span>
            </div>
          </div>
        </div>
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
            <PhoneField
              id="phone"
              country={country}
              onCountryChange={setCountry}
              value={phoneInput}
              onValueChange={setPhoneInput}
            />
            <p className="text-xs text-muted-foreground">
              {country === "BD"
                ? "উদাহরণ: 01712345678"
                : `উদাহরণ: +${getCountryCallingCode(country)} XXXXXXXXX`}
            </p>

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
