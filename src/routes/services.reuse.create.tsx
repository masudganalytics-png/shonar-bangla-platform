import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { createReuseListing } from "@/lib/reuse.functions";
import {
  REUSE_AREAS,
  REUSE_CATEGORIES,
  REUSE_CONDITIONS,
  REUSE_TAGLINE,
  type ReuseListingType,
} from "@/lib/reuse-shared";

export const Route = createFileRoute("/services/reuse/create")({
  head: () => ({
    meta: [
      { title: "নতুন বিজ্ঞাপন দিন — KHIJIRION Reuse" },
      { name: "description", content: "আপনার ব্যবহৃত পণ্য বিক্রি বা দানের জন্য বিজ্ঞাপন দিন।" },
      { property: "og:title", content: "নতুন বিজ্ঞাপন দিন — KHIJIRION Reuse" },
      { property: "og:description", content: "ব্যবহৃত পণ্য বিক্রি করুন বা দান করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReuseCreate,
});

function ReuseCreate() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [listingType, setListingType] = useState<ReuseListingType>("sale");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(REUSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<string>(REUSE_CONDITIONS[0]);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState<string>(REUSE_AREAS[0]);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">লোড হচ্ছে…</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold">লগইন প্রয়োজন</h1>
        <p className="mt-2 text-sm text-muted-foreground">বিজ্ঞাপন দিতে অনুগ্রহ করে লগইন করুন।</p>
        <Button asChild className="mt-5">
          <Link to="/auth">লগইন করুন</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-xl font-bold">বিজ্ঞাপন জমা হয়েছে</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          প্রশাসকের অনুমোদনের পর এটি প্রকাশিত হবে। বর্তমান অবস্থা — অপেক্ষমাণ।
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button asChild>
            <Link to="/services/reuse/my-listings">আমার বিজ্ঞাপন</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/services/reuse">তালিকায় ফিরে যান</Link>
          </Button>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return toast.error("পণ্যের নাম লিখুন");
    if (location.trim().length < 2) return toast.error("অবস্থান লিখুন");
    const numericPrice = listingType === "sale" ? Number(price) : null;
    if (listingType === "sale" && (!price.trim() || Number.isNaN(numericPrice) || (numericPrice ?? 0) < 0)) {
      return toast.error("সঠিক দাম লিখুন");
    }

    setSaving(true);
    try {
      await createReuseListing({
        data: {
          listing_type: listingType,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          category,
          condition,
          price: numericPrice,
          location: location.trim(),
          area: area || null,
          phone: phone.trim() ? phone.trim() : null,
          whatsapp: whatsapp.trim() ? whatsapp.trim() : null,
          image_url: imageUrl.trim() ? imageUrl.trim() : null,
        },
      });
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" onClick={() => navigate}>
        <Link to="/services/reuse">
          <ArrowLeft className="mr-2 h-4 w-4" /> সব পণ্য
        </Link>
      </Button>

      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">নতুন বিজ্ঞাপন</h1>
        <p className="mt-1 text-sm text-muted-foreground">{REUSE_TAGLINE}</p>
      </header>

      <Card className="border-border/60 bg-card/70 backdrop-blur-xl">
        <CardContent className="p-5">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label>ধরন</Label>
              <Select value={listingType} onValueChange={(v) => setListingType(v as ReuseListingType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">🏷️ বিক্রি</SelectItem>
                  <SelectItem value="donation">🤝 দান</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>পণ্যের নাম</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="যেমন: পুরনো ল্যাপটপ" />
            </div>

            <div className="space-y-1.5">
              <Label>ক্যাটাগরি</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REUSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>পণ্যের অবস্থা</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REUSE_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {listingType === "sale" && (
              <div className="space-y-1.5">
                <Label>দাম (টাকা)</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="numeric"
                  placeholder="যেমন: ৫০০০"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>অবস্থান</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="যেমন: উখিয়া সদর" />
            </div>

            <div className="space-y-1.5">
              <Label>এলাকা</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REUSE_AREAS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>ফোন নম্বর</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="01XXXXXXXXX" />
            </div>

            <div className="space-y-1.5">
              <Label>হোয়াটসঅ্যাপ (ঐচ্ছিক)</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} placeholder="01XXXXXXXXX" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>ছবির লিংক (ঐচ্ছিক)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>বিবরণ</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={2000} />
            </div>

            <p className="text-xs text-muted-foreground sm:col-span-2">
              আপনার ফোন/হোয়াটসঅ্যাপ নম্বর প্রকাশ্যে দেখানো হয় না — শুধু লগইন করা ব্যবহারকারী অনুমোদিত বিজ্ঞাপনে
              যোগাযোগের তথ্য দেখতে পারেন।
            </p>

            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} জমা দিন
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
