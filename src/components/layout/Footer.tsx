import { Link } from "@tanstack/react-router";
import { Facebook, Mail, Zap } from "lucide-react";
import { toBanglaDigits } from "@/lib/bangla";

export function Footer() {
  const year = toBanglaDigits(new Date().getFullYear());
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Zap className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold">উখিয়া বিদ্যুৎ বিল</div>
                <div className="text-[10px] text-muted-foreground">স্বচ্ছ বিল, সচেতন গ্রাহক</div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              উখিয়া উপজেলার বিদ্যুৎ গ্রাহকদের জন্য ডিজিটাল বিল ব্যবস্থাপনা প্ল্যাটফর্ম।
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">প্রতিষ্ঠান</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/contact" className="hover:text-primary">যোগাযোগ</Link></li>
              <li><Link to="/notices" className="hover:text-primary">নোটিশ বোর্ড</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">আইনি</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary">গোপনীয়তা নীতি</Link></li>
              <li><Link to="/terms" className="hover:text-primary">শর্তাবলী</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">যোগাযোগ</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 hover:text-primary"
                >
                  <Facebook className="h-4 w-4" /> ফেসবুক পেজ
                </a>
              </li>
              <li>
                <a href="mailto:info@ukhiya-bidyut.gov.bd" className="inline-flex items-center gap-2 hover:text-primary">
                  <Mail className="h-4 w-4" /> ইমেইল করুন
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {year} উখিয়া বিদ্যুৎ বিল। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
