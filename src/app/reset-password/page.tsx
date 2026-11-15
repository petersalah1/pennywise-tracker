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
    <div className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-4 py-12 text-[#0f1712]">
      <div className="w-full max-w-md">
        {/* Brand Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-xs">
              <Wallet size={26} strokeWidth={2.5} />
            </span>
            <div className="text-right">
              <span className="block text-xl font-bold tracking-tight text-[#0f1712]">بيني وايز</span>
              <span className="text-[11px] font-medium tracking-wider text-[#607267]">
                إدارة المصروفات الشخصية
              </span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[#e5eae7] bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f1712]">تعيين كلمة مرور جديدة</h2>
            <p className="mt-1 text-xs text-[#607267]">
              أدخل كلمة المرور الجديدة لحسابك لتتمكن من المتابعة وحفظ بياناتك سحابياً.
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
              <p className="font-semibold">المزامنة السحابية غير مفعلة</p>
              <p className="mt-1 text-[11px] leading-5 text-amber-700">
                خدمة استعادة الحساب السحابي غير متاحة حالياً.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={17} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <div className="mt-3 border-t border-rose-200 pt-2.5 text-left">
                <Link
                  href="/login?mode=forgot"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-[11px] font-semibold text-rose-800 transition hover:bg-rose-200"
                >
                  <span>طلب رابط استعادة جديد</span>
                  <ArrowRight size={13} className="rotate-180" />
                </Link>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-800">
              <CheckCircle2 size={17} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#526359]">
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
                <Lock size={15} className="absolute left-3 top-3 text-[#8c9c91]" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#526359]">
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
                <Lock size={15} className="absolute left-3 top-3 text-[#8c9c91]" />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm disabled:opacity-50"
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

          <div className="mt-6 border-t border-[#e5eae7] pt-5 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              &rarr; العودة لتسجيل الدخول
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#607267]">
          <ShieldCheck size={14} className="text-blue-600" />
          <span>تشفير كامل وحماية متقدمة لبياناتك المالية</span>
        </div>
      </div>
    </div>
  );
}
