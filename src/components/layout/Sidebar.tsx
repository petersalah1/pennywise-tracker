"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  ChartNoAxesCombined,
  Settings,
  CreditCard,
  X,
} from "lucide-react";

const SidebarUserSection = dynamic(() => import("./SidebarUserSection"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-3 px-1 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-[#284634]/50 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-16 rounded bg-white/10" />
        <div className="h-2 w-24 rounded bg-white/5" />
      </div>
    </div>
  ),
});

const links = [
  { href: "/", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/wallets", label: "المحافظ والحسابات", icon: CreditCard },
  { href: "/transactions", label: "سجل المعاملات", icon: ArrowLeftRight },
  { href: "/categories", label: "التصنيفات والميزانية", icon: Tags },
  { href: "/analytics", label: "التقارير والتحليلات", icon: ChartNoAxesCombined },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          aria-label="إغلاق القائمة"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[258px] flex-col border-l border-white/[0.06] bg-[#101713] px-5 py-6 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-[#07110c]">
              <Wallet size={21} strokeWidth={2.5} />
            </span>
            <div>
              <span className="block text-[16px] font-bold tracking-tight text-white">
                بيني وايز
              </span>
              <span className="text-[10px] font-medium tracking-wider text-[#738078]">
                إدارة المصروفات الشخصية
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="text-[#8b9990] hover:text-white lg:hidden"
            aria-label="إغلاق"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-10">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-[#65736a]">
            القائمة الرئيسية
          </p>
          <nav className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium transition ${
                    active
                      ? "bg-[#1d3025] text-[#7ce0a5]"
                      : "text-[#91a097] hover:bg-white/[.045] hover:text-white"
                  }`}
                >
                  <Icon
                    size={18}
                    className={active ? "text-[#65d891]" : "text-[#718078] group-hover:text-white"}
                  />
                  <span>{label}</span>
                  {active && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-[#65d891]" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account / Auth Section */}
        <div className="mt-5 border-t border-white/[.06] pt-4 mt-auto">
          <SidebarUserSection />
        </div>
      </aside>
    </>
  );
}
