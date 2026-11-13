"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle2, X } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

export default function OfflineNotice() {
  const { isOnline, pendingSyncCount, isSyncingOffline } = useFinance();
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline) {
      // Transitioned from offline to online
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // If online and not in restored state, don't show anything
  if (isOnline && !showRestored) return null;

  // If user dismissed current offline session banner
  if (!isOnline && dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-3 duration-300">
      {!isOnline ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-[#17140b] p-3.5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-400">
              <WifiOff size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-300">أنت تعمل بدون اتصال (Offline)</p>
              <p className="mt-0.5 text-[11px] text-amber-200/80">
                بياناتك وتعديلاتك محفوظة محلياً، وستتم المزامنة تلقائياً عند عودة الإنترنت.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 && (
              <span className="shrink-0 rounded-lg bg-amber-500/20 px-2 py-1 text-[11px] font-bold text-amber-300">
                {pendingSyncCount} معلقة
              </span>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1 text-amber-400/70 hover:bg-white/5 hover:text-white"
              aria-label="إخفاء التنبيه"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-[#0d1a12] p-3.5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-[#65d891]">
              {isSyncingOffline ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#86efac]">
                {isSyncingOffline
                  ? "تمت استعادة الاتصال! جاري مزامنة البيانات السحابية..."
                  : "تمت استعادة الاتصال بالإنترنت ومزامنة كافة التعديلات"}
              </p>
              <p className="mt-0.5 text-[11px] text-[#93c7a3]">
                {isSyncingOffline
                  ? "يتم رفع المعاملات والتعديلات المعلقة الآن..."
                  : "حسابك الآن متطابق تماماً مع السحابة."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowRestored(false)}
            className="rounded-lg p-1 text-[#86efac]/70 hover:bg-white/5 hover:text-white"
            aria-label="إغلاق"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
