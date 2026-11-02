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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

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

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

