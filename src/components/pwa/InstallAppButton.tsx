import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALLED_KEY = "pwa:installed";

// Capture the event as early as possible — it may fire before this component mounts.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(e: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l(deferredPrompt));
  });
  window.addEventListener("appinstalled", () => {
    try {
      localStorage.setItem(INSTALLED_KEY, "1");
    } catch {
      /* ignore */
    }
    deferredPrompt = null;
    listeners.forEach((l) => l(null));
  });
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayMode = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(displayMode || iosStandalone);
}

export function InstallAppButton({
  className,
  variant = "outline",
  size = "sm",
  label = "অ্যাপ ইনস্টল করুন",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  label?: string;
}) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(deferredPrompt);
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      if (localStorage.getItem(INSTALLED_KEY) === "1") return true;
    } catch {
      /* ignore */
    }
    return isStandalone();
  });

  useEffect(() => {
    const listener = (e: BeforeInstallPromptEvent | null) => {
      setPrompt(e);
      if (!e) setHidden(true);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (hidden || !prompt) return null;

  const handleClick = async () => {
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        try {
          localStorage.setItem(INSTALLED_KEY, "1");
        } catch {
          /* ignore */
        }
      }
    } finally {
      setPrompt(null);
      deferredPrompt = null;
      setHidden(true);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("gap-2", className)}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
