"use client";

import Link from "next/link";
import { Cloud, Laptop, Loader2, WifiOff } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import ThemeToggle from "./ThemeToggle";

export default function HeaderUserSection() {
  const { userName, isCloudSynced, isLoadingData, isOnline, pendingSyncCount, isSyncingOffline } =
    useFinance();

  const userInitial = userName
    ? userName
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
    : "ب";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {!isOnline ? (
        <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          <WifiOff size={14} className="text-amber-600" />
          <span>أوفلاين</span>
          {pendingSyncCount > 0 && (
            <span className="rounded-md bg-amber-200/60 px-1 py-0.5 text-[10px]">
              {pendingSyncCount} معلقة
            </span>
          )}
        </div>
      ) : isSyncingOffline ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800">
          <Loader2 size={14} className="animate-spin text-blue-600" />
          <span className="hidden sm:inline">جاري المزامنة...</span>
        </div>
      ) : isLoadingData ? (
        <div className="hidden items-center gap-2 rounded-xl border border-[#e5eae7] bg-[#f8faf9] px-3.5 py-2 sm:flex">
          <Loader2 size={14} className="animate-spin text-blue-600" />
          <span className="text-xs text-[#607267]">تحميل البيانات...</span>
        </div>
      ) : isCloudSynced ? (
        <div className="hidden items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 sm:flex">
          <Cloud size={15} className="text-blue-600" />
          <span className="text-xs font-semibold text-blue-800">متصل بالسحابة</span>
        </div>
      ) : (
        <Link
          href="/login"
          className="hidden items-center gap-2 rounded-xl border border-[#e5eae7] bg-[#f8faf9] px-3.5 py-2 transition hover:border-blue-500 hover:bg-white sm:flex dark:border-[#303744] dark:bg-[#1E2530] dark:hover:bg-[#29303D]"
        >
          <Laptop size={15} className="text-[#607267] dark:text-[#A0A7B4]" />
          <span className="text-xs text-[#607267] dark:text-[#A0A7B4]">
            حفظ محلي · <span className="font-semibold text-blue-600 dark:text-blue-400">تسجيل للدخول السحابي</span>
          </span>
        </Link>
      )}

      <ThemeToggle />

      <div className="grid h-9 w-9 place-items-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
        {userInitial}
      </div>
    </div>
  );
}
