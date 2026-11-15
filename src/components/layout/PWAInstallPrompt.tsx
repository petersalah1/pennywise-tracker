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
      <div className="relative overflow-hidden rounded-2xl border border-[#e5eae7] bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-xs">
              <Smartphone size={20} />
            </span>
            <div>
              <p className="text-xs font-bold text-[#0f1712]">تثبيت تطبيق بيني وايز على هاتفك</p>
              <p className="mt-0.5 text-[11px] text-[#607267]">
                افتحه بشاشة كاملة وسريعة كـ تطبيق هاتف حقيقي
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-[#8c9c91] hover:bg-[#f3f6f4] hover:text-[#0f1712]"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* iOS Step-by-Step Instructions */}
        {showIOSGuide ? (
          <div className="mt-3 rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-3 text-xs leading-5 text-[#526359]">
            <p className="font-semibold text-emerald-700">خطوات التثبيت على الآيفون:</p>
            <div className="mt-1.5 space-y-1 text-[11px]">
              <p className="flex items-center gap-1.5">
                1. اضغط على زر المشاركة <Share size={13} className="text-emerald-600" /> أسفل الشاشة في Safari.
              </p>
              <p className="flex items-center gap-1.5">
                2. مرر للأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>{" "}
                <PlusSquare size={13} className="text-emerald-600" />.
              </p>
              <p>3. اضغط «إضافة» بالأعلى، وسيظهر تطبيقك على الشاشة فوراً!</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-xs"
            >
              <Download size={14} />
              <span>تثبيت التطبيق الآن</span>
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl border border-[#e5eae7] px-3 py-2.5 text-xs font-medium text-[#607267] hover:bg-[#f3f6f4]"
            >
              لاحقاً
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

