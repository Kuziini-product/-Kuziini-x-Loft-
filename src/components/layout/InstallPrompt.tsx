"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    setIsStandalone(!!standalone);

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem("kuziini_install_dismissed");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    // iOS detection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIos) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("kuziini_install_dismissed", String(Date.now()));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom duration-500">
      <div className="bg-[#1a1a1a] border border-[#C9AB81]/30 rounded-xl p-4 shadow-2xl shadow-black/60 max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/40 hover:text-white/80 p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-[#C9AB81]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Instalează Kuziini</p>
            <p className="text-white/50 text-xs">Acces rapid de pe ecranul principal</p>
          </div>
        </div>

        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="mt-3 w-full bg-[#C9AB81] text-[#0A0A0A] py-2.5 font-bold text-xs tracking-[0.1em] uppercase rounded-lg"
          >
            Instalează aplicația
          </button>
        ) : isIos ? (
          <div className="mt-3 bg-white/5 rounded-lg p-3">
            <p className="text-white/70 text-xs text-center">
              Apasă <span className="inline-block mx-0.5 text-[#C9AB81]">⬆</span> Share apoi{" "}
              <span className="text-[#C9AB81] font-semibold">&quot;Add to Home Screen&quot;</span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
