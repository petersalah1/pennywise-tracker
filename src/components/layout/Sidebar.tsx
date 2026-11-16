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
      <div className="h-9 w-9 rounded-full bg-blue-50 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-16 rounded bg-[#e5eae7]" />
        <div className="h-2 w-24 rounded bg-[#e5eae7]/60" />
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
        className={`fixed inset-y-0 right-0 z-50 flex w-[258px] flex-col border-l border-[#e5eae7] bg-white px-5 py-6 shadow-xs transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Wallet size={21} strokeWidth={2.5} />
            </span>
            <div>
              <span className="block text-[16px] font-bold tracking-tight text-[#0f1712]">
                محفظتي
              </span>
              <span className="text-[10px] font-medium tracking-wider text-[#607267]">
                إدارة المصروفات الشخصية
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="text-[#8c9c91] hover:text-[#0f1712] lg:hidden"
            aria-label="إغلاق"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-10">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-[#8c9c91]">
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
                      ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/20"
                      : "text-[#526359] hover:bg-[#f3f6f4] hover:text-[#0f1712] dark:text-[#A0A7B4] dark:hover:bg-[#222833] dark:hover:text-[#F3F4F6]"
                  }`}
                >
                  <Icon
                    size={18}
                    className={active ? "text-blue-600 dark:text-blue-400" : "text-[#8c9c91] group-hover:text-[#0f1712] dark:text-[#7A8696] dark:group-hover:text-[#F3F4F6]"}
                  />
                  <span>{label}</span>
                  {active && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account / Auth Section */}
        <div className="mt-5 border-t border-[#e5eae7] pt-4 mt-auto">
          <SidebarUserSection />
        </div>
      </aside>
    </>
  );
}
