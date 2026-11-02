"use client";

import { useState } from "react";
import Link from "next/link";
import { Cloud, Laptop, Menu, ShieldCheck } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { useFinance } from "@/context/FinanceContext";

export default function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userName, isCloudSynced } = useFinance();

  const userInitial = userName
    ? userName
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
    : "ب";

  return (
    <div className="min-h-screen bg-[#0b100d] text-[#f3f7f4]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen lg:pr-[258px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[.055] bg-[#0b100d]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-[#9ba99f] hover:bg-white/5 lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-white">{title}</h1>
              <p className="mt-0.5 text-[11px] text-[#718078]">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isCloudSynced ? (
              <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/20 bg-[#14261b] px-3.5 py-2 sm:flex">
                <Cloud size={15} className="text-[#65d891]" />
                <span className="text-xs font-semibold text-[#82e6a7]">متصل بالسحابة (Supabase)</span>
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
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
