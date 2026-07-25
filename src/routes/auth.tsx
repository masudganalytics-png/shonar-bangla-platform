import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect } from "react";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).optional().default("login"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "সাইন ইন / নিবন্ধন — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "আপনার অ্যাকাউন্টে সাইন ইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।" },
      { property: "og:title", content: "সাইন ইন — উখিয়া বিদ্যুৎ বিল" },
      { property: "og:description", content: "নিরাপদ লগইন — ইমেইল বা গুগল দিয়ে।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: search.redirect ?? "/", replace: true });
    }
  }, [isAuthenticated, loading, navigate, search.redirect]);

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
        <Tabs defaultValue={search.mode} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">সাইন ইন</TabsTrigger>
            <TabsTrigger value="register">নিবন্ধন</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <LoginForm disabled={!acknowledged} />
          </TabsContent>
          <TabsContent value="register" className="mt-6">
            <RegisterForm disabled={!acknowledged} />
          </TabsContent>
        </Tabs>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">অথবা</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton disabled={!acknowledged} />
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        সাইন ইন করে আপনি আমাদের{" "}
        <Link to="/terms" className="underline hover:text-foreground">শর্তাবলী</Link> ও{" "}
        <Link to="/privacy" className="underline hover:text-foreground">গোপনীয়তা নীতি</Link>-তে সম্মত হন।
      </p>
    </div>
  );
}

function LoginForm({ disabled }: { disabled?: boolean }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("ইমেইল ও পাসওয়ার্ড দিন");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "ভুল ইমেইল বা পাসওয়ার্ড" : error.message);
      return;
    }
    toast.success("সফলভাবে সাইন ইন হয়েছে");
    navigate({ to: "/", replace: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-login">ইমেইল</Label>
        <Input
          id="email-login"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="pass-login">পাসওয়ার্ড</Label>
          <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="pass-login"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
            aria-label="পাসওয়ার্ড দেখান"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading || disabled}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} সাইন ইন
      </Button>
    </form>
  );
}

function RegisterForm({ disabled }: { disabled?: boolean }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("পুরো নাম দিন");
    if (password.length < 8) return toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("অ্যাকাউন্ট তৈরি হয়েছে!");
    navigate({ to: "/", replace: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name-reg">পুরো নাম</Label>
        <Input id="name-reg" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="আপনার পূর্ণ নাম" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-reg">ইমেইল</Label>
        <Input id="email-reg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pass-reg">পাসওয়ার্ড</Label>
        <Input id="pass-reg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="কমপক্ষে ৮ অক্ষর" autoComplete="new-password" required minLength={8} />
      </div>
      <Button type="submit" className="w-full" disabled={loading || disabled}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} নিবন্ধন করুন
      </Button>
    </form>
  );
}

function GoogleButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("গুগল সাইন ইন ব্যর্থ হয়েছে");
      return;
    }
    if (result.redirected) return;
    window.location.href = "/";
  };
  return (
    <Button variant="outline" className="w-full" onClick={onClick} disabled={loading || disabled}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.7 6.7 2.7 12s4.1 9.5 9.3 9.5c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.6H12z"/>
        </svg>
      )}
      গুগল দিয়ে চালিয়ে যান
    </Button>
  );
}
