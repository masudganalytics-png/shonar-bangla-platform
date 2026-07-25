import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "সাইন ইন — খরচের খাতা" },
      { name: "description", content: "আপনার খরচের খাতা অ্যাকাউন্টে সাইন ইন করুন বা নতুন অ্যাকাউন্ট তৈরি করুন।" },
      { property: "og:title", content: "সাইন ইন — খরচের খাতা" },
      { property: "og:description", content: "আপনার খরচের খাতা অ্যাকাউন্টে সাইন ইন করুন।" },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().email("সঠিক ইমেইল ঠিকানা দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, "আপনার নাম লিখুন"),
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/" });
    }
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen bg-[image:var(--gradient-hero)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-primary-foreground">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm mb-3">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold">খরচের খাতা</h1>
          <p className="text-sm opacity-90 mt-1">দৈনিক খরচ হিসাব রাখুন সহজে</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">স্বাগতম</CardTitle>
            <CardDescription>সাইন ইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">সাইন ইন</TabsTrigger>
                <TabsTrigger value="signup">নিবন্ধন</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "তথ্য যাচাই ব্যর্থ");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("সাইন ইন ব্যর্থ", { description: "ইমেইল অথবা পাসওয়ার্ড ভুল।" });
      return;
    }
    toast.success("স্বাগতম!");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">ইমেইল</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="আপনার ইমেইল লিখুন"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">পাসওয়ার্ড</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="পাসওয়ার্ড দিন"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        সাইন ইন করুন
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "তথ্য যাচাই ব্যর্থ");
      return;
    }
    setBusy(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        toast.error("এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। সাইন ইন করুন।");
      } else {
        toast.error("নিবন্ধন ব্যর্থ", { description: error.message });
      }
      return;
    }
    toast.success("অ্যাকাউন্ট তৈরি হয়েছে! এখন সাইন ইন করা হচ্ছে…");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">পূর্ণ নাম</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="যেমন: রফিকুল ইসলাম"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">ইমেইল</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="আপনার ইমেইল লিখুন"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">পাসওয়ার্ড</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="কমপক্ষে ৬ অক্ষরের"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        অ্যাকাউন্ট তৈরি করুন
      </Button>
    </form>
  );
}
