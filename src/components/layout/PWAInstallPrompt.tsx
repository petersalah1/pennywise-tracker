"use client";

import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone (installed app) mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Check dismissal history
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      // dismissed within last 7 days
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    if (isAppleDevice) {
      // Delay showing on iOS so it doesn't startle the user
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt on Chrome/Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", String(Date.now()));
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#121c15] p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400 text-[#07110c] shadow-lg shadow-emerald-400/20">
              <Smartphone size={20} />
            </span>
            <div>
              <p className="text-xs font-bold text-white">تثبيت تطبيق بيني وايز على هاتفك</p>
              <p className="mt-0.5 text-[11px] text-[#869b8e]">
                افتحه بشاشة كاملة وسريعة كـ تطبيق هاتف حقيقي
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-[#788a7e] hover:bg-white/5 hover:text-white"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* iOS Step-by-Step Instructions */}
        {showIOSGuide ? (
          <div className="mt-3 rounded-xl border border-white/[.06] bg-[#0c120e] p-3 text-xs leading-5 text-[#b9c9be]">
            <p className="font-semibold text-emerald-400">خطوات التثبيت على الآيفون:</p>
            <div className="mt-1.5 space-y-1 text-[11px]">
              <p className="flex items-center gap-1.5">
                1. اضغط على زر المشاركة <Share size={13} className="text-[#65d891]" /> أسفل الشاشة في Safari.
              </p>
              <p className="flex items-center gap-1.5">
                2. مرر للأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>{" "}
                <PlusSquare size={13} className="text-[#65d891]" />.
              </p>
              <p>3. اضغط «إضافة» بالأعلى، وسيظهر تطبيقك على الشاشة فوراً!</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#65d891] py-2.5 text-xs font-bold text-[#0b170f] transition hover:bg-[#7ce5a4]"
            >
              <Download size={14} />
              <span>تثبيت التطبيق الآن</span>
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl border border-white/10 px-3 py-2.5 text-xs font-medium text-[#8ea093] hover:bg-white/5"
            >
              لاحقاً
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

