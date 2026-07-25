import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Zap, Phone, ShieldCheck } from "lucide-react";
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
      { name: "description", content: "মোবাইল নম্বর দিয়ে সাইন ইন করুন — সহজ ও নিরাপদ OTP ভিত্তিক লগইন।" },
      { property: "og:title", content: "সাইন ইন — উখিয়া বিদ্যুৎ বিল" },
      { property: "og:description", content: "মোবাইল নম্বর দিয়ে OTP-ভিত্তিক সাইন ইন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

// Normalise BD numbers: accepts 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX
function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^01[3-9]\d{8}$/.test(digits)) return `+88${digits}`;
  if (/^8801[3-9]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^\+?8801[3-9]\d{8}$/.test(input.trim())) return input.trim().startsWith("+") ? input.trim() : `+${digits}`;
  return null;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: search.redirect ?? "/", replace: true });
    }
  }, [isAuthenticated, loading, navigate, search.redirect]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!acknowledged) return toast.error("আগে ডিসক্লেইমার-এ সম্মতি দিন");
    const normalized = normalizeBdPhone(phoneInput);
    if (!normalized) return toast.error("সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন ০১৭xxxxxxxx)");
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { channel: "sms", data: fullName.trim() ? { full_name: fullName.trim() } : undefined },
    });
    setSending(false);
    if (error) {
      toast.error(error.message || "OTP পাঠাতে সমস্যা হয়েছে");
      return;
    }
    setNormalizedPhone(normalized);
    setStep("otp");
    setResendIn(45);
    toast.success("আপনার মোবাইলে OTP পাঠানো হয়েছে");
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) return toast.error("সঠিক OTP কোড দিন");
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otp.trim(),
      type: "sms",
    });
    setVerifying(false);
    if (error) {
      toast.error(error.message || "OTP যাচাই ব্যর্থ হয়েছে");
      return;
    }
    toast.success("সফলভাবে সাইন ইন হয়েছে");
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
        {step === "phone" ? (
          <form onSubmit={sendOtp} className="space-y-4">
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
              />
              <p className="text-xs text-muted-foreground">উদাহরণ: 01712345678 বা +8801712345678</p>
            </div>

            <Button type="submit" className="w-full" disabled={sending || !acknowledged}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              OTP পাঠান
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-secondary/10 text-secondary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">OTP যাচাই করুন</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {normalizedPhone} নম্বরে পাঠানো ৬-সংখ্যার কোড লিখুন
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">OTP কোড</Label>
              <Input
                id="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="text-center text-lg tracking-widest"
                autoFocus
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              যাচাই করুন ও সাইন ইন
            </Button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setStep("phone"); setOtp(""); }}
                className="text-muted-foreground hover:text-foreground underline"
              >
                নম্বর পরিবর্তন করুন
              </button>
              <button
                type="button"
                disabled={resendIn > 0 || sending}
                onClick={() => sendOtp()}
                className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendIn > 0 ? `আবার পাঠান (${resendIn}s)` : "আবার OTP পাঠান"}
              </button>
            </div>
          </form>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        সাইন ইন করে আপনি আমাদের{" "}
        <Link to="/terms" className="underline hover:text-foreground">শর্তাবলী</Link> ও{" "}
        <Link to="/privacy" className="underline hover:text-foreground">গোপনীয়তা নীতি</Link>-তে সম্মত হন।
      </p>
    </div>
  );
}
