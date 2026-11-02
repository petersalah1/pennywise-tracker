"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft, CalendarDays, PieChart as PieIcon, ShieldAlert } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import SummaryCards from "@/components/dashboard/SummaryCards";
import WalletsOverview from "@/components/wallets/WalletsOverview";
import { CategoryChart, WeeklyChart } from "@/components/charts/SpendingCharts";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionForm from "@/components/transactions/TransactionForm";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";

export default function DashboardPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { userName, categories, transactions } = useFinance();

  // Calculate monthly budget progress
  const budgetProgress = useMemo(() => {
    const now = new Date();
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const expenseCategories = categories.filter((c) => c.type === "expense" && (c.budget ?? 0) > 0);

    return expenseCategories.map((category) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.categoryId === category.id && t.date.startsWith(thisMonthPrefix))
        .reduce((sum, t) => sum + t.amount, 0);

      const budget = category.budget || 0;
      const percentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
      const isOver = spent > budget;

      return {
        ...category,
        spent,
        budget,
        percentage,
        isOver,
      };
    });
  }, [categories, transactions]);

  return (
    <AppShell
      title="نظرة عامة"
      subtitle="ملخص شامل لوضعك المالي ومتابعة مدخراتك ومصروفاتك"
    >
      {/* Header Greeting */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#69d994]">
            لوحة المتابعة المالية
          </p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
            أهلاً بك مجدداً، {userName}
            <span className="text-[#70dc99]">.</span>
          </h2>
          <p className="mt-1 text-xs text-[#829087]">
            إليك نظرة دقيقة وفورية على حركة أموالك ومصروفات هذا الشهر.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#69d994] px-4 py-3 text-xs font-bold text-[#0a160e] shadow-lg shadow-emerald-950/20 transition hover:bg-[#82e6a7]"
        >
          <Plus size={16} /> إضافة معاملة جديدة
        </button>
      </div>

      {/* KPI Cards */}
      <SummaryCards />

      {/* Wallets Overview */}
      <div className="mt-6">
        <WalletsOverview />
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-white/[.065] bg-[#111914] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">المصروفات الأسبوعية</h3>
              <p className="mt-1 text-[11px] text-[#718078]">
                معدل إنفاقك اليومي من بداية الأسبوع حتى نهايته
              </p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1d3025] text-[#75d99b]">
              <CalendarDays size={16} />
            </span>
          </div>
          <WeeklyChart />
        </section>

        <section className="rounded-2xl border border-white/[.065] bg-[#111914] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">توزيع المصروفات حسب التصنيف</h3>
              <p className="mt-1 text-[11px] text-[#718078]">أين تذهب أموالك الأكثر استهلاكاً</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1d3025] text-[#75d99b]">
              <PieIcon size={16} />
            </span>
          </div>
          <CategoryChart />
        </section>
      </div>

      {/* Monthly Budget Tracker */}
      {budgetProgress.length > 0 && (
        <section className="mt-6 rounded-2xl border border-white/[.065] bg-[#111914] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">متابعة الميزانيات وسقف المصروفات الشهري</h3>
              <p className="mt-1 text-[11px] text-[#718078]">
                مراقبة نسبة استهلاك الميزانية المحددة لكل تصنيف خلال هذا الشهر
              </p>
            </div>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#78d99b] hover:text-[#a0edb9]"
            >
              إدارة الميزانيات <ArrowLeft size={14} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {budgetProgress.map((item) => {
              const isDanger = item.isOver || item.percentage >= 90;
              const isWarning = !isDanger && item.percentage >= 75;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/[.05] bg-[#0c120e] p-4 transition hover:border-white/[.09]"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#dfe7e2]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        item.isOver
                          ? "text-[#f87171]"
                          : isWarning
                          ? "text-[#fbbf24]"
                          : "text-[#6ee7b7]"
                      }`}
                    >
                      {item.isOver ? "تجاوز السقف!" : `${item.percentage}%`}
                    </span>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#1e2a22]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isOver
                          ? "bg-[#ef4444]"
                          : isWarning
                          ? "bg-[#f59e0b]"
                          : "bg-[#10b981]"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#7b8980]">
                    <span>تم صرف: {formatEGP(item.spent)}</span>
                    <span>السقف: {formatEGP(item.budget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">أحدث المعاملات</h3>
            <p className="mt-1 text-[11px] text-[#718078]">عرض سريع لآخر الحركات المالية المسجلة</p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#78d99b] hover:text-[#a0edb9]"
          >
            عرض الكل <ArrowLeft size={14} />
          </Link>
        </div>
        <TransactionTable limit={5} />
      </section>

      {/* Footer */}
      <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/[.05] pt-4 text-[11px] text-[#5e6c63] sm:flex-row">
        <span>صُمم لمساعدتك على بناء عادات مالية أفضل واستقرار مالي دائم.</span>
        <span>كافة الحسابات بالجنيه المصري (EGP)</span>
      </div>

      {formOpen && <TransactionForm onClose={() => setFormOpen(false)} />}
    </AppShell>
  );
}
