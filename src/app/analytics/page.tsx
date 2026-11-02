"use client";

import { useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { CategoryChart, WeeklyChart } from "@/components/charts/SpendingCharts";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";

const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export default function AnalyticsPage() {
  const { transactions, income, expenses } = useFinance();

  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - i));

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = ARABIC_MONTHS[date.getMonth()];

      const monthIncome = transactions
        .filter((t) => t.type === "income" && t.date.startsWith(key))
        .reduce((s, t) => s + t.amount, 0);

      const monthExpense = transactions
        .filter((t) => t.type === "expense" && t.date.startsWith(key))
        .reduce((s, t) => s + t.amount, 0);

      return {
        month: `${monthName} ${date.getFullYear()}`,
        income: monthIncome,
        expense: monthExpense,
      };
    });
  }, [transactions]);

  const netSavings = income - expenses;

  return (
    <AppShell
      title="التقارير والتحليلات"
      subtitle="فهم أعمق لحركة أموالك وتحليل نمط الصرف والادخار"
    >
      <div className="mb-7">
        <p className="text-xs font-semibold tracking-wider text-[#69d994]">الرؤى والاتجاهات المالية</p>
        <h2 className="mt-1.5 text-2xl font-bold text-white">التحليلات المالية</h2>
        <p className="mt-1 text-xs text-[#829087]">
          رؤية متكاملة توضح اتجاهات الدخل والمصروفات وصافي الوفر التراكمي.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "إجمالي الدخل الوارد", value: formatEGP(income), tone: "text-[#70d99a]" },
          { label: "إجمالي المصروفات المنفقة", value: formatEGP(expenses), tone: "text-[#f18484]" },
          {
            label: "صافي التدفق المالي (الوفر)",
            value: formatEGP(netSavings),
            tone: netSavings >= 0 ? "text-[#70d99a]" : "text-[#f18484]",
          },
        ].map((x) => (
          <div
            key={x.label}
            className="rounded-2xl border border-white/[.06] bg-[#111914] p-4 transition hover:border-white/[.1]"
          >
            <p className="text-[11px] font-medium text-[#7e8c83]">{x.label}</p>
            <p className={`mt-2 text-xl font-bold ${x.tone}`}>{x.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/[.06] bg-[#111914] p-5">
          <h3 className="text-sm font-bold text-white">المصروفات الأسبوعية</h3>
          <p className="mt-1 text-[11px] text-[#718078]">معدل الصرف اليومي خلال الأسبوع الجاري</p>
          <div className="mt-4">
            <WeeklyChart />
          </div>
        </section>

        <section className="rounded-2xl border border-white/[.06] bg-[#111914] p-5">
          <h3 className="text-sm font-bold text-white">توزيع المصروفات حسب التصنيف</h3>
          <p className="mt-1 text-[11px] text-[#718078]">النسبة المئوية لكل بند من بنود المصروفات</p>
          <div className="mt-4">
            <CategoryChart />
          </div>
        </section>
      </div>

      {/* 6 Months Trend */}
      <section className="mt-4 rounded-2xl border border-white/[.06] bg-[#111914] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">مقارنة آخر 6 أشهر</h3>
            <p className="mt-1 text-[11px] text-[#718078]">
              مقارنة شهرية بين إجمالي الدخل وإجمالي المصروفات
            </p>
          </div>
          <div className="flex gap-4 text-xs font-medium text-[#84958a]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#65d891]" />
              الدخل
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e87979]" />
              المصروفات
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {months.map((m) => {
            const max = Math.max(...months.map((x) => Math.max(x.income, x.expense)), 1);

            return (
              <div key={m.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#c8d4cd]">{m.month}</span>
                  <span className="text-[11px] text-[#7b8980]">
                    دخل: <span className="font-semibold text-[#82e6a7]">{formatEGP(m.income)}</span>
                    <span className="px-1.5">|</span>
                    صرف: <span className="font-semibold text-[#fca5a5]">{formatEGP(m.expense)}</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#1b251e]">
                    <div
                      className="h-full rounded-full bg-[#65d891] transition-all duration-300"
                      style={{ width: `${(m.income / max) * 100}%` }}
                    />
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#1b251e]">
                    <div
                      className="h-full rounded-full bg-[#e87979] transition-all duration-300"
                      style={{ width: `${(m.expense / max) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
