"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  Target,
  Flame,
  Calculator,
  CalendarDays,
  PieChart as PieIcon,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Ban,
  Tag,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { CategoryChart, WeeklyChart } from "@/components/charts/SpendingCharts";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP, getCategory, isOneOffTransaction } from "@/lib/finance";

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
  const { transactions, categories, income, expenses, toggleTransactionOneOff } = useFinance();
  const [calculationMode, setCalculationMode] = useState<"routine" | "all">("routine");
  const [managerOpen, setManagerOpen] = useState(false);

  // 1. Daily Spending Intelligence (with One-off / Irregular expense control)
  const dailyStats = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDaysInMonth = Math.max(daysInMonth - currentDay, 1);
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // All this month's expenses
    const thisMonthExpenses = transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(thisMonthPrefix))
      .sort((a, b) => b.amount - a.amount);

    const totalSpentThisMonth = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Filter out one-off expenses (like buying a mobile phone, laptop, course fees, etc.)
    const oneOffExpenses = thisMonthExpenses.filter(isOneOffTransaction);
    const oneOffTotal = oneOffExpenses.reduce((sum, t) => sum + t.amount, 0);

    const routineExpenses = thisMonthExpenses.filter((t) => !isOneOffTransaction(t));
    const routineTotal = routineExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Active spend based on chosen mode
    const activeSpent = calculationMode === "routine" ? routineTotal : totalSpentThisMonth;
    const dailyAverageThisMonth = activeSpent / Math.max(currentDay, 1);

    // Realistic projection: routine pace * full month + fixed one-off purchases
    const projectedMonthlySpend =
      calculationMode === "routine"
        ? dailyAverageThisMonth * daysInMonth + oneOffTotal
        : dailyAverageThisMonth * daysInMonth;

    // Daily breakdown & Peak spending day (based on active calculation mode)
    const targetExpensesForPeak =
      calculationMode === "routine" ? routineExpenses : thisMonthExpenses;
    const dailySpendMap: Record<string, number> = {};
    targetExpensesForPeak.forEach((t) => {
      dailySpendMap[t.date] = (dailySpendMap[t.date] || 0) + t.amount;
    });

    let peakDayDate = "";
    let peakDayAmount = 0;
    Object.entries(dailySpendMap).forEach(([dateStr, amt]) => {
      if (amt > peakDayAmount) {
        peakDayAmount = amt;
        peakDayDate = dateStr;
      }
    });

    let formattedPeakDate = "لا توجد مصروفات مسجلة بعد";
    if (peakDayDate) {
      const d = new Date(`${peakDayDate}T00:00:00`);
      formattedPeakDate = d.toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "short",
      });
    }

    // Safe Daily Budget Target
    const totalMonthlyBudget = categories
      .filter((c) => c.type === "expense" && (c.budget ?? 0) > 0)
      .reduce((sum, c) => sum + (c.budget || 0), 0);

    const remainingBudget = Math.max(totalMonthlyBudget - totalSpentThisMonth, 0);
    const dailyBudgetAllowance =
      totalMonthlyBudget > 0 ? remainingBudget / remainingDaysInMonth : null;
    const isBudgetOver = totalMonthlyBudget > 0 && totalSpentThisMonth > totalMonthlyBudget;

    // Last 30 Days daily average
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
    const last30Expenses = transactions
      .filter((t) => t.type === "expense" && t.date >= thirtyDaysAgoStr)
      .reduce((s, t) => s + t.amount, 0);
    const dailyAverage30Days = last30Expenses / 30;

    // Zero-spend days
    const activeDays = Object.keys(dailySpendMap).length;
    const zeroSpendDays = Math.max(currentDay - activeDays, 0);

    return {
      currentDay,
      daysInMonth,
      remainingDaysInMonth,
      totalSpentThisMonth,
      oneOffTotal,
      oneOffCount: oneOffExpenses.length,
      oneOffExpenses,
      routineTotal,
      routineCount: routineExpenses.length,
      thisMonthExpenses,
      dailyAverageThisMonth,
      projectedMonthlySpend,
      peakDayAmount,
      formattedPeakDate,
      totalMonthlyBudget,
      remainingBudget,
      dailyBudgetAllowance,
      isBudgetOver,
      dailyAverage30Days,
      zeroSpendDays,
      activeDays,
    };
  }, [transactions, categories, calculationMode]);

  // 2. 6 Months trend comparison
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
    <AppShell title="التقارير والتحليلات">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1712] dark:text-[#f0f4f2]">التحليلات ومتوسط الإنفاق</h2>
      </div>

      {/* Top Summary KPI Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "إجمالي الدخل الوارد", value: formatEGP(income), tone: "text-emerald-600 dark:text-emerald-400" },
          { label: "إجمالي المصروفات المنفقة", value: formatEGP(expenses), tone: "text-rose-600 dark:text-rose-400" },
          {
            label: "صافي التدفق المالي (الوفر)",
            value: formatEGP(netSavings),
            tone: netSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          },
        ].map((x) => (
          <div
            key={x.label}
            className="rounded-2xl border border-[#e5eae7] bg-white p-4 shadow-xs dark:border-[#222933] dark:bg-[#151921]"
          >
            <p className="text-[11px] font-medium text-[#607267] dark:text-[#8b9aa7]">{x.label}</p>
            <p className={`mt-2 text-xl font-bold ${x.tone}`}>{x.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Spending Intelligence Section */}
      <section className="mb-6 rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs dark:border-[#222933] dark:bg-[#151921]">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <Clock size={17} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-[#0f1712] dark:text-[#f0f4f2]">
              تحليل متوسط الإنفاق اليومي
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 rounded-xl border border-[#e5eae7] bg-[#f1f5f3] p-1 text-xs">
              <button
                type="button"
                onClick={() => setCalculationMode("routine")}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  calculationMode === "routine"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-[#607267] hover:text-[#0f1712]"
                }`}
              >
                مصاريف يومية عادية
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode("all")}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  calculationMode === "all"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-[#607267] hover:text-[#0f1712]"
                }`}
              >
                شامل كل المصروفات
              </button>
            </div>

            {/* Toggle Drawer to manage exclusions */}
            <button
              type="button"
              onClick={() => setManagerOpen(!managerOpen)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              <SlidersHorizontal size={13} />
              <span>
                التحكم بالاستثناءات ({dailyStats.oneOffCount})
              </span>
              {managerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Manager Drawer: List expenses to include/exclude with 1-click */}
        {managerOpen && (
          <div className="mb-5 rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-4 animate-in fade-in duration-200">
            <div className="mb-3 flex items-center justify-between border-b border-[#e5eae7] pb-2.5">
              <div>
                <p className="text-xs font-bold text-[#0f1712]">
                  تحديد المصروفات المستبعدة من بند التقسيم اليومي
                </p>
                <p className="mt-0.5 text-[10px] text-[#607267]">
                  المصروفات المستبعدة تظل مسجلة في رصيدك ومحفظتك، ولكن لا تُقسم على الأيام حتى لا تُشوه معدل الصرف اليومي (مثل شراء موبايل، كورس، لابتوب).
                </p>
              </div>
              <span className="shrink-0 text-xs text-[#607267]">
                مستبعد: <strong className="text-amber-700">{formatEGP(dailyStats.oneOffTotal)}</strong> ({dailyStats.oneOffCount} عناصر)
              </span>
            </div>

            <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
              {dailyStats.thisMonthExpenses.map((t) => {
                const isExcluded = isOneOffTransaction(t);
                const category = getCategory(categories, t.categoryId);

                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-2.5 transition ${
                      isExcluded
                        ? "border-amber-200 bg-amber-50/70 text-amber-900"
                        : "border-[#e5eae7] bg-white text-[#0f1712]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: category?.color || "#888" }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#0f1712]">{t.title}</p>
                        <p className="text-[10px] text-[#607267]">
                          {category?.name || "عام"} · {t.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold tabular-nums text-[#0f1712]" dir="ltr">
                        {formatEGP(t.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleTransactionOneOff(t.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          isExcluded
                            ? "border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        {isExcluded ? "مستبعد من الحساب" : "مشمول في الحساب"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {dailyStats.thisMonthExpenses.length === 0 && (
                <p className="py-4 text-center text-xs text-[#8c9c91]">
                  لا توجد مصروفات مسجلة في هذا الشهر حتى الآن.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Daily Average */}
          <div className="rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-4 transition hover:border-[#ccd6d0] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#607267]">
                {calculationMode === "routine" ? "المعدل اليومي الروتيني" : "المعدل اليومي الكلي"}
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Clock size={14} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-[#0f1712]">
              {formatEGP(dailyStats.dailyAverageThisMonth)}
              <span className="text-xs font-normal text-[#607267]"> / يوم</span>
            </p>
            <p className="mt-2 text-[10px] text-[#8c9c91]">
              {calculationMode === "routine" && dailyStats.oneOffTotal > 0
                ? `مستبعد ${formatEGP(dailyStats.oneOffTotal)} لمصاريف استثنائية`
                : `محسوب على ${dailyStats.currentDay} يوماً من هذا الشهر`}
            </p>
          </div>

          {/* Card 2: Safe Daily Budget Pace */}
          <div className="rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-4 transition hover:border-[#ccd6d0] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#607267]">
                {dailyStats.totalMonthlyBudget > 0 ? "المعدل اليومي الآمن" : "متوسط آخر 30 يوماً"}
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Target size={14} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-[#0f1712]">
              {dailyStats.totalMonthlyBudget > 0 && dailyStats.dailyBudgetAllowance !== null
                ? formatEGP(dailyStats.dailyBudgetAllowance)
                : formatEGP(dailyStats.dailyAverage30Days)}
              <span className="text-xs font-normal text-[#607267]"> / يوم</span>
            </p>
            <p className="mt-2 text-[10px] text-[#8c9c91]">
              {dailyStats.totalMonthlyBudget > 0
                ? dailyStats.isBudgetOver
                  ? "تجاوزت سقف الميزانية الإجمالي!"
                  : `متاح للصرف لـ ${dailyStats.remainingDaysInMonth} يوماً قادمة`
                : "متوسط إنفاقك لآخر 30 يوماً"}
            </p>
          </div>

          {/* Card 3: Peak Spending Day */}
          <div className="rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-4 transition hover:border-[#ccd6d0] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#607267]">أعلى يوم إنفاقاً</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
                <Flame size={14} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-rose-600">
              {dailyStats.peakDayAmount > 0 ? formatEGP(dailyStats.peakDayAmount) : "0 ج.م"}
            </p>
            <p className="mt-2 truncate text-[10px] text-[#607267]">
              {dailyStats.formattedPeakDate}
            </p>
          </div>

          {/* Card 4: Projected Monthly Total */}
          <div className="rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-4 transition hover:border-[#ccd6d0] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#607267]">التوقع لنهاية الشهر</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <Calculator size={14} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-amber-700">
              {formatEGP(dailyStats.projectedMonthlySpend)}
            </p>
            <p className="mt-2 text-[10px] text-[#607267]">
              توقع واقعي شامل للمعيشة والمشتريات الكبيرة
            </p>
          </div>
        </div>

        {/* Insight callout */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-900">
          <span>
            {dailyStats.totalSpentThisMonth === 0 ? (
              "لم تسجل أي مصروفات خلال هذا الشهر حتى الآن."
            ) : dailyStats.oneOffTotal > 0 && calculationMode === "routine" ? (
              <>
                تم بنجاح استبعاد <strong>{formatEGP(dailyStats.oneOffTotal)}</strong> (المتعلقة بالمشتريات الكبيرة/الاستثنائية كالموبايل أو الكورسات). معدل صرفك اليومي الفعلي الآن هو <strong>{formatEGP(dailyStats.dailyAverageThisMonth)} / يوم</strong>.
              </>
            ) : (
              <>
                معدل صرفك اليومي الحالي ({formatEGP(dailyStats.dailyAverageThisMonth)}/يوم). يمكنك في أي وقت استبعاد أي بند استثنائي عبر زر «التحكم بالاستثناءات» بالأعلى.
              </>
            )}
          </span>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs dark:border-[#222933] dark:bg-[#151921]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0f1712] dark:text-[#f0f4f2]">المصروفات الأسبوعية</h3>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
              <CalendarDays size={16} />
            </span>
          </div>
          <WeeklyChart />
        </section>

        <section className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs dark:border-[#222933] dark:bg-[#151921]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0f1712] dark:text-[#f0f4f2]">توزيع المصروفات حسب التصنيف</h3>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
              <PieIcon size={16} />
            </span>
          </div>
          <CategoryChart />
        </section>
      </div>

      {/* 6 Months Trend */}
      <section className="mt-4 rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs dark:border-[#222933] dark:bg-[#151921]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f1712] dark:text-[#f0f4f2]">مقارنة آخر 6 أشهر</h3>
          <div className="flex gap-4 text-xs font-medium text-[#607267] dark:text-[#8b9aa7]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              الدخل
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
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
                  <span className="font-semibold text-[#0f1712]">{m.month}</span>
                  <span className="text-[11px] text-[#607267]">
                    دخل: <span className="font-semibold text-emerald-700">{formatEGP(m.income)}</span>
                    <span className="px-1.5">|</span>
                    صرف: <span className="font-semibold text-rose-700">{formatEGP(m.expense)}</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8edea]">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(m.income / max) * 100}%` }}
                    />
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8edea]">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-300"
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
