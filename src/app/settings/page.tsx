"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Wallet,
  Save,
  ShieldCheck,
  User,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
  Cloud,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";

export default function SettingsPage() {
  const {
    userName,
    updateUserName,
    openingBalance,
    updateOpeningBalance,
    balance,
    transactions,
    categories,
    wallets,
    resetAllData,
    importData,
    syncLocalToCloud,
    isCloudSynced,
    isLoadingData,
    isOnline,
    pendingSyncCount,
    isSyncingOffline,
    flushSyncQueue,
  } = useFinance();

  const [nameInput, setNameInput] = useState(userName);
  const [balanceInput, setBalanceInput] = useState(String(openingBalance));
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameInput(userName);
  }, [userName]);

  useEffect(() => {
    setBalanceInput(String(openingBalance));
  }, [openingBalance]);

  function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    const cleanName = nameInput.trim();
    const cleanBalance = Number(balanceInput);

    if (!cleanName) {
      setFeedback({ text: "يرجى إدخال اسم صحيح", error: true });
      return;
    }

    if (!Number.isFinite(cleanBalance) || cleanBalance < 0) {
      setFeedback({ text: "يرجى إدخال رصيد افتتاحي صحيح (0 أو أكبر)", error: true });
      return;
    }

    updateUserName(cleanName);
    updateOpeningBalance(cleanBalance);
    setFeedback({ text: "تم حفظ الإعدادات بنجاح!" });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleExportBackup() {
    const backupData = {
      userName,
      openingBalance,
      wallets,
      transactions,
      categories,
      exportedAt: new Date().toISOString(),
      version: 3,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mahfazty-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({ text: "تم تصدير ملف النسخة الاحتياطية بنجاح!" });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = importData(parsed);
        if (ok) {
          setFeedback({ text: "تم استيراد النسخة الاحتياطية بنجاح!" });
        } else {
          setFeedback({ text: "ملف النسخة الاحتياطية غير متوافق!", error: true });
        }
      } catch {
        setFeedback({ text: "حدث خطأ أثناء قراءة الملف، تأكد أنه ملف JSON صالح", error: true });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setFeedback(null), 3500);
      }
    };
    reader.readAsText(file);
  }

  const [syncing, setSyncing] = useState(false);

  async function handleSyncToCloud() {
    if (!isOnline) {
      setFeedback({
        text: "أنت غير متصل بالإنترنت حالياً؛ سيتم رفع التعديلات تلقائياً بمجرد استعادة الاتصال.",
        error: true,
      });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }
    setSyncing(true);
    try {
      await flushSyncQueue();
      await syncLocalToCloud();
      setFeedback({ text: "تمت مزامنة كافة البيانات والعمليات المعلقة مع السحابة بنجاح!" });
      setTimeout(() => setFeedback(null), 3500);
    } catch {
      setFeedback({ text: "حدث خطأ أثناء المزامنة، يرجى المحاولة مرة أخرى.", error: true });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setSyncing(false);
    }
  }

  async function handleReset() {
    if (
      window.confirm(
        "تحذير: هل أنت متأكد من رغبتك في مسح كافة البيانات والعودة للوضع الافتراضي؟ لا يمكن التراجع عن هذا الإجراء!"
      )
    ) {
      await resetAllData();
      setFeedback({ text: "تمت إعادة ضبط كافة البيانات إلى الحالة الافتراضية بنجاح." });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <AppShell title="الإعدادات">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1712] dark:text-[#f0f4f2]">إعدادات المحفظة</h2>
      </div>

      {feedback && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border p-3.5 text-xs font-medium ${
            feedback.error
              ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
              : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400"
          }`}
        >
          {feedback.error ? <AlertTriangle size={16} /> : <Check size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Form: Profile & Opening Balance */}
        <div className="space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-[#e5eae7] bg-white p-5 sm:p-6 shadow-xs dark:border-[#222933] dark:bg-[#151921]"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                <User size={19} />
              </span>
              <h3 className="text-sm font-bold text-[#0f1712] dark:text-[#f0f4f2]">البيانات الشخصية والرصيد</h3>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#526359]">
                  اسمك (الذي يظهر في الواجهة)
                </span>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="field font-medium"
                  placeholder="اكتب اسمك هنا"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#526359]">
                  الرصيد الافتتاحي المبدئي (ج.م)
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="field text-lg font-bold"
                  placeholder="0"
                />
              </label>

              <p className="text-[11px] leading-5 text-[#607267]">
                يُحسب رصيدك الحالي تلقائياً بناءً على: الرصيد الافتتاحي + مجموع الدخل − مجموع
                المصروفات.
              </p>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm"
            >
              <Save size={15} /> حفظ الإعدادات
            </button>
          </form>

          {/* Backup & Restore Section */}
          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 sm:p-6 shadow-xs dark:border-[#222933] dark:bg-[#151921]">
            <h3 className="text-sm font-bold text-[#0f1712] dark:text-[#f0f4f2]">النسخ الاحتياطي واستعادة البيانات</h3>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-100"
              >
                <Download size={15} /> تصدير نسخة احتياطية (JSON)
              </button>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-100">
                <Upload size={15} /> استيراد نسخة احتياطية
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-100"
              >
                <RotateCcw size={15} /> إعادة ضبط المصنع
              </button>

              {isCloudSynced && (
                <button
                  type="button"
                  onClick={handleSyncToCloud}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "جارٍ المزامنة..." : "مزامنة البيانات مع السحابة"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Info Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs dark:border-[#222933] dark:bg-[#151921]">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ShieldCheck size={18} />
              <h3 className="text-sm font-bold text-[#0f1712] dark:text-[#f0f4f2]">الرصيد المتاح حالياً</h3>
            </div>
            <p className="mt-4 text-2xl font-bold text-[#0f1712] dark:text-[#f0f4f2]">{formatEGP(balance)}</p>
            <p className="mt-2 text-[11px] text-[#607267] dark:text-[#8b9aa7]">العملة: الجنيه المصري (EGP)</p>

            <div className="mt-5 space-y-2 border-t border-[#f1f5f3] pt-4 text-[11px] text-[#607267] dark:border-[#222933] dark:text-[#8b9aa7]">
              <div className="flex justify-between">
                <span>الرصيد الافتتاحي:</span>
                <span className="font-semibold text-[#0f1712] dark:text-[#f0f4f2]">{formatEGP(openingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>عدد المعاملات المسجلة:</span>
                <span className="font-semibold text-[#0f1712] dark:text-[#f0f4f2]">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>عدد التصنيفات:</span>
                <span className="font-semibold text-[#0f1712] dark:text-[#f0f4f2]">{categories.length}</span>
              </div>
            </div>
          </div>

          {/* Offline & Sync Status Card */}
          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs dark:border-[#222933] dark:bg-[#151921]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi size={17} className="text-blue-600 dark:text-blue-400" />
                ) : (
                  <WifiOff size={17} className="text-amber-600 dark:text-amber-400" />
                )}
                <h4 className="text-xs font-bold text-[#0f1712] dark:text-[#f0f4f2]">حالة الاتصال والمزامنة (Offline)</h4>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  isOnline
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {isOnline ? "متصل أونلاين" : "غير متصل (أوفلاين)"}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-[11px] text-[#607267]">
              <div className="flex justify-between">
                <span>التشغيل بدون إنترنت:</span>
                <span className="font-semibold text-blue-700">مفعّل (يعمل تلقائياً)</span>
              </div>
              <div className="flex justify-between">
                <span>العمليات المعلقة للمزامنة:</span>
                <span
                  className={`font-semibold ${
                    pendingSyncCount > 0 ? "text-amber-700" : "text-[#0f1712]"
                  }`}
                >
                  {pendingSyncCount > 0 ? `${pendingSyncCount} معلقة` : "جميع البيانات متزامنة"}
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-[#607267]">
              يمكنك استخدام التطبيق وتسجيل أي معاملات أو تعديلات حتى أثناء انقطاع الإنترنت؛ يتم
              حفظها فورياً على جهازك وتُرفع تلقائياً عند عودة الاتصال.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-blue-600">
              <Wallet size={17} />
              <h4 className="text-xs font-bold text-[#0f1712]">الخصوصية والأمان</h4>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[#607267]">
              كافة سجلاتك المالية تُحفظ مشفرة داخل متصفحك على هذا الجهاز فقط، ولن يتم إرسال أي
              أرقام أو مبالغ إلى أي خوادم خارجية إلا عند تفعيل المزامنة السحابية بحسابك.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
