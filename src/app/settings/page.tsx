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
    resetAllData,
    importData,
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
      transactions,
      categories,
      exportedAt: new Date().toISOString(),
      version: 2,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pennywise-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

  function handleReset() {
    if (
      window.confirm(
        "تحذير: هل أنت متأكد من رغبتك في مسح كافة البيانات والعودة للوضع الافتراضي؟ لا يمكن التراجع عن هذا الإجراء!"
      )
    ) {
      resetAllData();
      setFeedback({ text: "تمت إعادة ضبط كافة البيانات إلى الحالة الافتراضية." });
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <AppShell
      title="الإعدادات والبيانات"
      subtitle="تخصيص الحساب الشخصي وإدارة الرصيد والنسخ الاحتياطي"
    >
      <div className="mb-7">
        <p className="text-xs font-semibold tracking-wider text-[#69d994]">تفضيلاتك الشخصية</p>
        <h2 className="mt-1.5 text-2xl font-bold text-white">إعدادات المحفظة</h2>
        <p className="mt-1 text-xs text-[#829087]">
          تحكم في بياناتك الشخصية، رصيدك الافتتاحي، ونسخ بياناتك احتياطياً في أي وقت.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border p-3.5 text-xs font-medium ${
            feedback.error
              ? "border-red-500/20 bg-red-950/30 text-red-300"
              : "border-emerald-500/20 bg-[#16271c] text-[#86efac]"
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
            className="rounded-2xl border border-white/[.06] bg-[#111914] p-5 sm:p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1c3827] text-[#72d99b]">
                <User size={19} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">البيانات الشخصية والرصيد</h3>
                <p className="text-[11px] text-[#758279]">
                  الاسم المعروض والرصيد الافتتاحي قبل بدء التتبع
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
                  اسمك (الذي يظهر في الواجهة)
                </span>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="field font-medium"
                  placeholder="مثلاً: بيتر صلاح"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
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

              <p className="text-[11px] leading-5 text-[#718078]">
                يُحسب رصيدك الحالي تلقائياً بناءً على: الرصيد الافتتاحي + مجموع الدخل − مجموع
                المصروفات.
              </p>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#69d994] px-5 py-3 text-xs font-bold text-[#0a160e] transition hover:bg-[#82e6a7]"
            >
              <Save size={15} /> حفظ الإعدادات
            </button>
          </form>

          {/* Backup & Restore Section */}
          <div className="rounded-2xl border border-white/[.06] bg-[#111914] p-5 sm:p-6">
            <h3 className="text-sm font-bold text-white">النسخ الاحتياطي واستعادة البيانات</h3>
            <p className="mt-1 text-[11px] text-[#758279]">
              احتفظ بنسخة من سجلاتك المالية على حاسوبك واسترجعها متى شئت دون فقد أي بيانات.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[.08] bg-[#16231a] px-4 py-2.5 text-xs font-semibold text-[#82e6a7] transition hover:bg-[#1f3326]"
              >
                <Download size={15} /> تصدير نسخة احتياطية (JSON)
              </button>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/[.08] bg-[#141b16] px-4 py-2.5 text-xs font-semibold text-[#cad6cf] transition hover:bg-white/5">
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
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-950/40"
              >
                <RotateCcw size={15} /> إعادة ضبط المصنع
              </button>
            </div>
          </div>
        </div>

        {/* Right Info Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[.06] bg-[#111914] p-5">
            <div className="flex items-center gap-2 text-[#76d99a]">
              <ShieldCheck size={18} />
              <h3 className="text-sm font-bold text-white">الرصيد المتاح حالياً</h3>
            </div>
            <p className="mt-4 text-2xl font-bold text-white">{formatEGP(balance)}</p>
            <p className="mt-2 text-[11px] text-[#718078]">العملة: الجنيه المصري (EGP)</p>

            <div className="mt-5 space-y-2 border-t border-white/[.05] pt-4 text-[11px] text-[#7b8c81]">
              <div className="flex justify-between">
                <span>الرصيد الافتتاحي:</span>
                <span className="font-semibold text-white">{formatEGP(openingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>عدد المعاملات المسجلة:</span>
                <span className="font-semibold text-white">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>عدد التصنيفات:</span>
                <span className="font-semibold text-white">{categories.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[.06] bg-[#111914] p-5">
            <div className="flex items-center gap-2 text-[#64d78e]">
              <Wallet size={17} />
              <h4 className="text-xs font-bold text-white">الخصوصية والأمان</h4>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[#88988d]">
              كافة سجلاتك المالية تُحفظ مشفرة داخل متصفحك على هذا الجهاز فقط، ولن يتم إرسال أي
              أرقام أو مبالغ إلى أي خوادم خارجية إلا عند ربط قاعدة بيانات Supabase.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
