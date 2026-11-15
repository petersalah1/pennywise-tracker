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
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <WifiOff size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-900">أنت تعمل بدون اتصال (Offline)</p>
              <p className="mt-0.5 text-[11px] text-amber-800">
                بياناتك وتعديلاتك محفوظة محلياً، وستتم المزامنة تلقائياً عند عودة الإنترنت.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 && (
              <span className="shrink-0 rounded-lg bg-amber-200/70 px-2 py-1 text-[11px] font-bold text-amber-900">
                {pendingSyncCount} معلقة
              </span>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1 text-amber-700 hover:bg-amber-100"
              aria-label="إخفاء التنبيه"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              {isSyncingOffline ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-900">
                {isSyncingOffline
                  ? "تمت استعادة الاتصال! جاري مزامنة البيانات السحابية..."
                  : "تمت استعادة الاتصال بالإنترنت ومزامنة كافة التعديلات"}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-800">
                {isSyncingOffline
                  ? "يتم رفع المعاملات والتعديلات المعلقة الآن..."
                  : "حسابك الآن متطابق تماماً مع السحابة."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowRestored(false)}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="إغلاق"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
