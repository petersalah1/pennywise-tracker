"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, isConfigured, user } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [userName, setUserName] = useState("بيتر صلاح");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (user) {
    router.push("/");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          router.push("/");
        }
      } else {
        const res = await signUp(email, password, userName);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg("تم إنشاء الحساب بنجاح! جاري تحويلك إلى لوحة التحكم...");
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      }
    } catch {
      setErrorMsg("حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.");
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
            <h2 className="text-xl font-bold text-white">
              {mode === "login" ? "تسجيل الدخول إلى حسابك" : "إنشاء حساب سحابي جديد"}
            </h2>
            <p className="mt-1 text-xs text-[#829087]">
              {mode === "login"
                ? "احفظ بياناتك ومعاملاتك مشفرة ومتاحة على أي جهاز."
                : "سجل حسابك لتبدأ حفظ ومزامنة أموالك سحابياً بكل أمان."}
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5 text-xs text-[#fcd34d]">
              <p className="font-semibold">تنبيه: السحابة قيد الإعداد</p>
              <p className="mt-1 text-[11px] leading-5 text-amber-200/80">
                لم يتم إضافة مفاتيح Supabase بعد في ملف <code>.env.local</code>. يمكنك المتابعة واستخدام التطبيق كـ
                ضيف ببيانات محفوظة في متصفحك.
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

          {/* Mode Switch Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#0c120e] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === "login"
                  ? "bg-[#1c3526] text-[#75dfa0] shadow"
                  : "text-[#819087] hover:text-white"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg(null);
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === "register"
                  ? "bg-[#1c3526] text-[#75dfa0] shadow"
                  : "text-[#819087] hover:text-white"
              }`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">الاسم بالكامل</span>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="مثلاً: بيتر صلاح"
                    className="field pl-9"
                  />
                  <User size={15} className="absolute left-3 top-3 text-[#627368]" />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">البريد الإلكتروني</span>
              <div className="relative">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="field pl-9"
                />
                <Mail size={15} className="absolute left-3 top-3 text-[#627368]" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">كلمة المرور</span>
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

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#69d994] py-3 text-xs font-bold text-[#0a160e] transition hover:bg-[#82e6a7] disabled:opacity-50"
            >
              {loading ? (
                <span>جاري المعالجة...</span>
              ) : (
                <>
                  <span>{mode === "login" ? "دخول إلى الحساب" : "إنشاء الحساب والمزامنة"}</span>
                  <ArrowRight size={15} className="rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Continue as guest */}
          <div className="mt-6 border-t border-white/[.06] pt-5 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-[#82e6a7] transition hover:text-[#9ef0be]"
            >
              الاستمرار كضيف والمتابعة على المتصفح المحلي &larr;
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

