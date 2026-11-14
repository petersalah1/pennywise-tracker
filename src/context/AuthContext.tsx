"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string; success?: boolean }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (event === "PASSWORD_RECOVERY") {
        if (typeof window !== "undefined" && !window.location.pathname.includes("/reset-password")) {
          window.location.href = "/reset-password";
        }
      }
    });

    // Check if user landed on home or other page with recovery or error hash
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      if (
        hash &&
        (hash.includes("type=recovery") ||
          hash.includes("error_code=otp_expired") ||
          hash.includes("error_description=")) &&
        !pathname.includes("/reset-password") &&
        !pathname.includes("/login")
      ) {
        window.location.href = `/reset-password${hash}`;
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!supabase) {
      return { error: "لم يتم ضبط متغيرات Supabase بعد في ملف .env.local" };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
        }
        return { error: error.message };
      }

      return {};
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تسجيل الدخول";
      return { error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userName?: string
  ): Promise<{ error?: string }> => {
    if (!supabase) {
      return { error: "لم يتم ضبط متغيرات Supabase بعد في ملف .env.local" };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            user_name: userName?.trim() || "بيتر صلاح",
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { error: "هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول مباشرة." };
        }
        return { error: error.message };
      }

      if (data.user && !data.session) {
        return {
          error: "تم إنشاء الحساب بنجاح! تم إرسال رسالة تأكيد إلى بريدك الإلكتروني لتفعيل الحساب.",
        };
      }

      return {};
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إنشاء الحساب";
      return { error: msg };
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<{ error?: string; success?: boolean }> => {
    if (!supabase) {
      return { error: "لم يتم ضبط إعدادات السحابة (Supabase) بعد." };
    }

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://pennywise-tracker1.vercel.app";

      const redirectUrl = `${origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("over_email_send_rate_limit")
        ) {
          return {
            error:
              "تم تجاوز الحد المسموح لإرسال الرسائل مؤقتاً (Rate Limit). تم إرسال عدة رسائل متتالية؛ يرجى الانتظار 3 إلى 5 دقائق ثم المحاولة مرة واحدة فقط.",
          };
        }
        return { error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الرابط";
      return { error: msg };
    }
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<{ error?: string; success?: boolean }> => {
    if (!supabase) {
      return { error: "لم يتم ضبط إعدادات السحابة (Supabase) بعد." };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء تحديث كلمة المرور";
      return { error: msg };
    }
  };

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

