import { useState } from "react";
import { AiSearchBox } from "@/components/home/AiSearchBox";
import { AskMasudBox } from "@/components/home/AskMasudBox";
import { cn } from "@/lib/utils";

type Mode = "khijirion" | "askmasud";

/** Mode switch; both chats stay mounted so each keeps its own separate history. */
export function HomeAiChat() {
  const [mode, setMode] = useState<Mode>("khijirion");
  const tab = (m: Mode, label: string, active: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={cn(
        "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
        mode === m ? active : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
  return (
    <div>
      <div className="mx-auto mt-5 max-w-2xl px-4 sm:px-6">
        <div role="tablist" aria-label="চ্যাট মোড" className="flex gap-1 rounded-full border border-border bg-card p-1">
          {tab("khijirion", "🏘️ KHIJIRION AI", "bg-primary text-primary-foreground")}
          {tab("askmasud", "🤖 AskMasud", "bg-success text-success-foreground")}
        </div>
      </div>
      <div hidden={mode !== "khijirion"} className="[&>section]:mt-3">
        <AiSearchBox />
      </div>
      <div hidden={mode !== "askmasud"} className="mx-auto mt-3 max-w-2xl px-4 sm:px-6">
        <AskMasudBox />
      </div>
    </div>
  );
}
