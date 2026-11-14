"use client";

import Link from "next/link";
import { Cloud, Laptop, Loader2, WifiOff } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

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
        <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300">
          <WifiOff size={14} className="text-amber-400" />
          <span>أوفلاين</span>
          {pendingSyncCount > 0 && (
            <span className="rounded-md bg-amber-500/20 px-1 py-0.5 text-[10px]">
              {pendingSyncCount} معلقة
            </span>
          )}
        </div>
      ) : isSyncingOffline ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#14261b] px-3.5 py-2 text-xs font-semibold text-[#82e6a7]">
          <Loader2 size={14} className="animate-spin text-[#65d891]" />
          <span className="hidden sm:inline">جاري المزامنة...</span>
        </div>
      ) : isLoadingData ? (
        <div className="hidden items-center gap-2 rounded-xl border border-white/[.07] bg-[#111914] px-3.5 py-2 sm:flex">
          <Loader2 size={14} className="animate-spin text-[#65d891]" />
          <span className="text-xs text-[#8da094]">تحميل البيانات...</span>
        </div>
      ) : isCloudSynced ? (
        <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/20 bg-[#14261b] px-3.5 py-2 sm:flex">
          <Cloud size={15} className="text-[#65d891]" />
          <span className="text-xs font-semibold text-[#82e6a7]">متصل بالسحابة</span>
        </div>
      ) : (
        <Link
          href="/login"
          className="hidden items-center gap-2 rounded-xl border border-white/[.07] bg-[#111914] px-3.5 py-2 transition hover:border-[#65d891]/40 sm:flex"
        >
          <Laptop size={15} className="text-[#8b9990]" />
          <span className="text-xs text-[#8da094]">
            حفظ محلي · <span className="font-semibold text-[#65d891]">تسجيل للدخول السحابي</span>
          </span>
        </Link>
      )}

      <div className="grid h-9 w-9 place-items-center rounded-full border border-[#36533f] bg-[#1c3324] text-xs font-bold text-[#91e5aa]">
        {userInitial}
      </div>
    </div>
  );
}
