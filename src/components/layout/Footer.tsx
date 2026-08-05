import { Link } from "@tanstack/react-router";
import { Facebook, Mail } from "lucide-react";
import logoAsset from "@/assets/khijirion-logo.png.asset.json";
import { toBanglaDigits } from "@/lib/bangla";

export function Footer() {
  const year = toBanglaDigits(new Date().getFullYear());
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <img src={logoAsset.url} alt="KHIJIRION" className="h-12 w-auto object-contain" loading="lazy" />
              <div className="leading-tight">
                <div className="text-sm font-bold tracking-[0.18em] text-gradient-gold">KHIJIRION</div>
                <div className="text-[10px] tracking-wide text-muted-foreground">Everything Local, One Place.</div>
              </div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              বিদ্যুৎ বিল, গ্যাস বিল, পানি বিল, মোবাইল রিচার্জ, প্রয়োজনীয় সরকারি ওয়েবসাইট, স্থানীয় সেবা, চাকরির খবর, টেন্ডার, জরুরি নম্বর এবং আরও অনেক কিছু—সব এক প্ল্যাটফর্মে।
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">প্রতিষ্ঠান</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/contact" className="hover:text-primary">যোগাযোগ</Link></li>
              <li><Link to="/notices" className="hover:text-primary">নোটিশ বোর্ড</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">আইনি</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary">গোপনীয়তা নীতি</Link></li>
              <li><Link to="/terms" className="hover:text-primary">শর্তাবলী</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">যোগাযোগ</h3>
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

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <span>© {year} Khijirion. সর্বস্বত্ব সংরক্ষিত।</span>
          <span className="tracking-[0.16em] text-muted-foreground/70">EVERYTHING LOCAL, ONE PLACE.</span>
        </div>
      </div>
    </footer>
  );
}
