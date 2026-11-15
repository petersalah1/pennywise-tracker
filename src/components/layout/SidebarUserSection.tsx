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
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#a7f3d0] bg-[#ecfdf5] text-xs font-bold text-[#059669]">
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
              <Cloud size={10} className="text-[#059669]" />
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
          className="rounded-lg p-1.5 text-[#8c9c91] transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={15} />
        </button>
      ) : (
        <Link
          href="/login"
          title="تسجيل الدخول / حفظ سحابي"
          className="rounded-lg p-1.5 text-[#059669] transition hover:bg-[#ecfdf5]"
        >
          <LogIn size={16} />
        </Link>
      )}
    </div>
  );
}
