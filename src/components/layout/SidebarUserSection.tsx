"use client";

import Link from "next/link";
import { LogIn, LogOut, Cloud, WifiOff } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { useAuth } from "@/context/AuthContext";

export default function SidebarUserSection() {
  const { userName, isCloudSynced, isOnline } = useFinance();
  const { user, signOut } = useAuth();

  const userInitial = userName
    ? userName
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
    : "ب";

  return (
    <div className="flex items-center gap-3 px-1">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
        {userInitial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#0f1712]">{userName}</p>
        <p className="flex items-center gap-1 text-[10px] text-[#607267]">
          {!isOnline ? (
            <span className="flex items-center gap-1 text-amber-600">
              <WifiOff size={10} />
              <span>غير متصل (أوفلاين)</span>
            </span>
          ) : isCloudSynced ? (
            <>
              <Cloud size={10} className="text-blue-600 dark:text-blue-400" />
              <span className="truncate">{user?.email}</span>
            </>
          ) : (
            <span>محفظة محلية (ضيف)</span>
          )}
        </p>
      </div>

      {user ? (
        <button
          onClick={() => signOut()}
          title="تسجيل الخروج"
          className="rounded-lg border border-[#e2e8e5] bg-white p-1.5 text-rose-500 shadow-2xs transition hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:border-[#303744] dark:bg-[#1E2530] dark:text-rose-400 dark:hover:bg-rose-500/15 dark:hover:border-rose-500/30"
        >
          <LogOut size={14} />
        </button>
      ) : (
        <Link
          href="/login"
          title="تسجيل الدخول / حفظ سحابي"
          className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-blue-600 shadow-2xs transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25"
        >
          <LogIn size={15} />
        </Link>
      )}
    </div>
  );
}
