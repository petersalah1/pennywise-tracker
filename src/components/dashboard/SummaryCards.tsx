"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";

export default function SummaryCards() {
  const { balance, income, expenses, transactions } = useFinance();
  const now = new Date();

  // Week start (Saturday in Arab/Egypt calendar)
  const day = now.getDay();
  const diff = (day + 1) % 7;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - diff);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekly = transactions
    .filter((item) => item.type === "expense" && new Date(`${item.date}T00:00:00`) >= weekStart)
    .reduce((sum, item) => sum + item.amount, 0);

  const monthly = transactions
    .filter((item) => item.type === "expense" && new Date(`${item.date}T00:00:00`) >= monthStart)
    .reduce((sum, item) => sum + item.amount, 0);

  const cards = [
    {
      label: "إجمالي الرصيد المتاح",
      value: formatEGP(balance),
      icon: Wallet,
      color: "green",
      note: "الرصيد الافتتاحي + الدخل − المصروفات",
    },
    {
      label: "إجمالي الدخل",
      value: formatEGP(income),
      icon: ArrowDownLeft,
      color: "green",
      note: "مجموع كافة مصادر الدخل",
    },
    {
      label: "إجمالي المصروفات",
      value: formatEGP(expenses),
      icon: ArrowUpRight,
      color: "red",
      note: "مجموع كافة المصاريف المسجلة",
    },
    {
      label: "مصروفات هذا الشهر",
      value: formatEGP(monthly),
      icon: TrendingUp,
      color: "amber",
      note: `مصروفات هذا الأسبوع: ${formatEGP(weekly)}`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color, note }) => (
        <div
          key={label}
          className="rounded-2xl border border-white/[.065] bg-[#111914] p-5 transition hover:border-white/[.12]"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#8d9b92]">{label}</p>
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${
                color === "red"
                  ? "bg-[#392323] text-[#f18a8a]"
                  : color === "amber"
                  ? "bg-[#3a3020] text-[#e7bd70]"
                  : "bg-[#1c3827] text-[#78dda0]"
              }`}
            >
              <Icon size={18} />
            </span>
          </div>
          <p className="mt-4 text-[24px] font-bold tracking-tight text-white">{value}</p>
          <p className="mt-2 text-[11px] text-[#6f7d74]">{note}</p>
        </div>
      ))}
    </div>
  );
}
