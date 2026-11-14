"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Lock, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, isConfigured } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check URL hash for Supabase error or recovery tokens
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (hash && hash.includes("error=")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const errorDesc = params.get("error_description");
      const errorCode = params.get("error_code");

      if (errorCode === "otp_expired" || errorDesc?.includes("expired")) {
        setErrorMsg(
          "انتهت صلاحية هذا الرابط أو تم استخدامه مسبقاً. يرجى طلب رابط جديد لاستعادة كلمة المرور."
        );
      } else if (errorDesc) {
        setErrorMsg(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
      }
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg("يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة المحاولة.");
      return;
    }

    setLoading(true);

    try {
      const res = await updatePassword(password);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("تم تعيين كلمة المرور الجديدة بنجاح! جاري تحويلك...");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch {
      setErrorMsg("حدث خطأ غير متوقع أثناء تحديث كلمة المرور.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b100d] px-4 py-12 text-[#f3f7f4]">
      <div className="w-full max-w-md">
        {/* Brand Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-[#07110c] shadow-lg shadow-emerald-500/20">
              <Wallet size={26} strokeWidth={2.5} />
            </span>
            <div className="text-right">
              <span className="block text-xl font-bold tracking-tight text-white">بيني وايز</span>
              <span className="text-[11px] font-medium tracking-wider text-[#738078]">
                إدارة المصروفات الشخصية
              </span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/[.08] bg-[#111914] p-6 shadow-2xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">تعيين كلمة مرور جديدة</h2>
            <p className="mt-1 text-xs text-[#829087]">
              أدخل كلمة المرور الجديدة لحسابك لتتمكن من المتابعة وحفظ بياناتك سحابياً.
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5 text-xs text-[#fcd34d]">
              <p className="font-semibold">تنبيه: السحابة قيد الإعداد</p>
              <p className="mt-1 text-[11px] leading-5 text-amber-200/80">
                لم يتم ضبط مفاتيح Supabase بعد في إعدادات البيئة.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-red-500/20 bg-red-950/30 p-3.5 text-xs text-red-300">
              <AlertCircle size={17} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-[#16271c] p-3.5 text-xs text-[#86efac]">
              <CheckCircle2 size={17} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
                كلمة المرور الجديدة
              </span>
              <div className="relative">
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field pl-9"
                />
                <Lock size={15} className="absolute left-3 top-3 text-[#627368]" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
                تأكيد كلمة المرور الجديدة
              </span>
              <div className="relative">
                <input
                  required
                  minLength={6}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field pl-9"
                />
                <Lock size={15} className="absolute left-3 top-3 text-[#627368]" />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#69d994] py-3 text-xs font-bold text-[#0a160e] transition hover:bg-[#82e6a7] disabled:opacity-50"
            >
              {loading ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <span>حفظ كلمة المرور الجديدة</span>
                  <ArrowRight size={15} className="rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/[.06] pt-5 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#82e6a7] transition hover:text-[#9ef0be]"
            >
              &rarr; العودة لتسجيل الدخول
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#69796f]">
          <ShieldCheck size={14} className="text-[#65d891]" />
          <span>تشفير كامل وحماية لبياناتك المالية عبر Supabase RLS</span>
        </div>
      </div>
    </div>
  );
}
