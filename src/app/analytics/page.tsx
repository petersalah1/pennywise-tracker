"use client";

import { useMemo } from "react";
import {
  Clock,
  Target,
  Flame,
  Sparkles,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  PieChart as PieIcon,
  Zap,
} from "lucide-react";
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
  const { transactions, categories, income, expenses } = useFinance();

  // 1. Daily Spending Intelligence
  const dailyStats = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDaysInMonth = Math.max(daysInMonth - currentDay, 1);
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const thisMonthExpenses = transactions.filter(
      (t) => t.type === "expense" && t.date.startsWith(thisMonthPrefix)
    );
    const totalSpentThisMonth = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const dailyAverageThisMonth = totalSpentThisMonth / Math.max(currentDay, 1);
    const projectedMonthlySpend = dailyAverageThisMonth * daysInMonth;

    // Daily breakdown & Peak spending day
    const dailySpendMap: Record<string, number> = {};
    thisMonthExpenses.forEach((t) => {
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
  }, [transactions, categories]);

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
    <AppShell
      title="التقارير والتحليلات"
      subtitle="فهم أعمق لحركة أموالك وتحليل نمط الصرف والادخار ومتوسط الإنفاق اليومي"
    >
      <div className="mb-7">
        <p className="text-xs font-semibold tracking-wider text-[#69d994]">الرؤى والاتجاهات المالية</p>
        <h2 className="mt-1.5 text-2xl font-bold text-white">التحليلات ومتوسط الإنفاق</h2>
        <p className="mt-1 text-xs text-[#829087]">
          رؤية متكاملة توضح معدل استهلاكك اليومي، اتجاهات المصروفات، وتوقعات نهاية الشهر.
        </p>
      </div>

      {/* Top Summary KPI Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
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

      {/* Daily Spending Intelligence Section */}
      <section className="mb-6 rounded-2xl border border-white/[.065] bg-[#111914] p-5">
        <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Clock size={16} className="text-[#69d994]" />
              <span>تحليل متوسط الإنفاق اليومي ووتيرة الصرف</span>
            </h3>
            <p className="mt-1 text-[11px] text-[#718078]">
              مؤشرات دقيقة لمعدل استهلاكك المالي يومياً وسرعة الصرف خلال هذا الشهر
            </p>
          </div>
          <span className="rounded-lg bg-[#142319] px-2.5 py-1 text-[11px] font-semibold text-[#82e6a7]">
            اليوم {dailyStats.currentDay} من {dailyStats.daysInMonth} يوماً ({dailyStats.remainingDaysInMonth} يوماً متبقية)
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Daily Average (This Month) */}
          <div className="rounded-xl border border-white/[.05] bg-[#0c120e] p-4 transition hover:border-white/[.1]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#87998e]">متوسط الصرف اليومي</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#1c3526] text-[#75dfa0]">
                <Clock size={14} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-white">
              {formatEGP(dailyStats.dailyAverageThisMonth)}
              <span className="text-xs font-normal text-[#75847b]"> / يوم</span>
            </p>
            <p className="mt-2 text-[10px] text-[#69796e]">
              محسوب على مدار {dailyStats.currentDay} يوماً من هذا الشهر
            </p>
          </div>

          {/* Card 2: Safe Daily Budget Pace */}
          <div className="rounded-xl border border-white/[.05] bg-[#0c120e] p-4 transition hover:border-white/[.1]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#87998e]">
                {dailyStats.totalMonthlyBudget > 0 ? "المعدل اليومي الآمن" : "متوسط آخر 30 يوماً"}
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#272138] text-[#c084fc]">
                <Target size={14} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-white">
              {dailyStats.totalMonthlyBudget > 0 && dailyStats.dailyBudgetAllowance !== null
                ? formatEGP(dailyStats.dailyBudgetAllowance)
                : formatEGP(dailyStats.dailyAverage30Days)}
              <span className="text-xs font-normal text-[#75847b]"> / يوم</span>
            </p>
            <p className="mt-2 text-[10px] text-[#69796e]">
              {dailyStats.totalMonthlyBudget > 0
                ? dailyStats.isBudgetOver
                  ? "تجاوزت سقف الميزانية الإجمالي!"
                  : `متاح للصرف لـ ${dailyStats.remainingDaysInMonth} يوماً دون تجاوز الميزانية`
                : "متوسط إنفاقك لآخر 30 يوماً"}
            </p>
          </div>

          {/* Card 3: Peak Spending Day */}
          <div className="rounded-xl border border-white/[.05] bg-[#0c120e] p-4 transition hover:border-white/[.1]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#87998e]">أعلى يوم إنفاقاً</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#3a2020] text-[#f87171]">
                <Flame size={14} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-[#fca5a5]">
              {dailyStats.peakDayAmount > 0 ? formatEGP(dailyStats.peakDayAmount) : "0 ج.م"}
            </p>
            <p className="mt-2 truncate text-[10px] text-[#718077]">
              {dailyStats.formattedPeakDate}
            </p>
          </div>

          {/* Card 4: Projected Monthly Total */}
          <div className="rounded-xl border border-white/[.05] bg-[#0c120e] p-4 transition hover:border-white/[.1]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#87998e]">التوقع لنهاية الشهر</span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#382d1c] text-[#fbbf24]">
                <Sparkles size={14} />
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-[#fde047]">
              {formatEGP(dailyStats.projectedMonthlySpend)}
            </p>
            <p className="mt-2 text-[10px] text-[#718077]">
              بناءً على وتيرة الصرف الحالية ({dailyStats.zeroSpendDays} أيام بدون صرف)
            </p>
          </div>
        </div>

        {/* Insight callout */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#2b4433] bg-[#0f1d14] px-4 py-2.5 text-xs text-[#a2d4b1]">
          <Zap size={15} className="shrink-0 text-[#69d994]" />
          <span>
            {dailyStats.totalSpentThisMonth === 0 ? (
              "لم تسجل أي مصروفات خلال هذا الشهر حتى الآن."
            ) : dailyStats.dailyAverageThisMonth > dailyStats.dailyAverage30Days && dailyStats.dailyAverage30Days > 0 ? (
              <>
                معدل صرفك اليومي هذا الشهر ({formatEGP(dailyStats.dailyAverageThisMonth)}/يوم) <strong>أعلى</strong> من معدل آخر 30 يوماً ({formatEGP(dailyStats.dailyAverage30Days)}/يوم). احرص على ترشيد النفقات في الأيام القادمة.
              </>
            ) : (
              <>
                معدل صرفك اليومي الحالي ({formatEGP(dailyStats.dailyAverageThisMonth)}/يوم) متزن ومستقر مقارنة بالشهر السابق. أحسنت!
              </>
            )}
          </span>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/[.06] bg-[#111914] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">المصروفات الأسبوعية</h3>
              <p className="mt-1 text-[11px] text-[#718078]">معدل الصرف اليومي خلال الأسبوع الجاري</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1d3025] text-[#75d99b]">
              <CalendarDays size={16} />
            </span>
          </div>
          <WeeklyChart />
        </section>

        <section className="rounded-2xl border border-white/[.06] bg-[#111914] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">توزيع المصروفات حسب التصنيف</h3>
              <p className="mt-1 text-[11px] text-[#718078]">النسبة المئوية لكل بند من بنود المصروفات</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1d3025] text-[#75d99b]">
              <PieIcon size={16} />
            </span>
          </div>
          <CategoryChart />
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
