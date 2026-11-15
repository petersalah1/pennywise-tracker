"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";

const HeaderUserSection = dynamic(() => import("./HeaderUserSection"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="h-9 w-9 rounded-full bg-[#1c3324]/50 animate-pulse" />
    </div>
  ),
});

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

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#0f1712]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen lg:pr-[258px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e5eae7] bg-white/80 px-5 backdrop-blur-xl sm:px-8 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-[#5c6e64] hover:bg-[#edf2ee] lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-[#0f1712]">{title}</h1>
              <p className="mt-0.5 text-[11px] text-[#607267]">{subtitle}</p>
            </div>
          </div>

          <HeaderUserSection />
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
