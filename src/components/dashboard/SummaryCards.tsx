"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP, isOneOffTransaction } from "@/lib/finance";

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
  const currentDay = now.getDate();

  const weekly = transactions
    .filter((item) => item.type === "expense" && new Date(`${item.date}T00:00:00`) >= weekStart)
    .reduce((sum, item) => sum + item.amount, 0);

  const monthlyExpenses = transactions.filter(
    (item) => item.type === "expense" && new Date(`${item.date}T00:00:00`) >= monthStart
  );
  const monthly = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);

  const oneOffMonthly = monthlyExpenses
    .filter(isOneOffTransaction)
    .reduce((sum, item) => sum + item.amount, 0);

  const routineMonthly = Math.max(monthly - oneOffMonthly, 0);
  const dailyAverageThisMonth = routineMonthly / Math.max(currentDay, 1);

  const cards = [
    {
      label: "إجمالي الرصيد المتاح",
      value: formatEGP(balance),
      icon: Wallet,
      color: "blue",
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
      note:
        oneOffMonthly > 0
          ? `المعدل اليومي: ${formatEGP(dailyAverageThisMonth)} (مستبعد ${formatEGP(oneOffMonthly)} استثنائي)`
          : `المعدل اليومي: ${formatEGP(dailyAverageThisMonth)} • الأسبوع: ${formatEGP(weekly)}`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color, note }) => (
        <div
          key={label}
          className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs transition hover:border-[#ccd6d0] hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#607267]">{label}</p>
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl border ${
                color === "red"
                  ? "border-rose-100 bg-rose-50 text-rose-600"
                  : color === "amber"
                  ? "border-amber-100 bg-amber-50 text-amber-600"
                  : color === "blue"
                  ? "border-blue-100 bg-blue-50 text-blue-600"
                  : "border-emerald-100 bg-emerald-50 text-emerald-600"
              }`}
            >
              <Icon size={18} />
            </span>
          </div>
          <p className="mt-4 text-[24px] font-bold tracking-tight text-[#0f1712]">{value}</p>
          <p className="mt-2 text-[11px] text-[#8c9c91]">{note}</p>
        </div>
      ))}
    </div>
  );
}
