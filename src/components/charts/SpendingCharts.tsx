"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";

const tooltipStyle = {
  background: "#17211a",
  border: "1px solid #2a3a30",
  borderRadius: 10,
  color: "#f3f7f4",
  fontSize: 12,
  direction: "rtl" as const,
  textAlign: "right" as const,
};

export function WeeklyChart() {
  const { transactions } = useFinance();

  const data = useMemo(() => {
    const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const day = now.getDay();
    const diff = (day + 1) % 7;

    const sat = new Date(now);
    sat.setDate(sat.getDate() - diff);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sat);
      date.setDate(date.getDate() + index);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${d}`;

      const dayName = arabicDays[date.getDay()];

      const amount = transactions
        .filter((item) => item.type === "expense" && item.date === key)
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        day: dayName,
        amount,
      };
    });
  }, [transactions]);


  return (
    <div className="h-[230px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid stroke="#253129" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#75837a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#75837a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatEGP(Number(value)), "المصروفات"]}
            labelFormatter={(label) => `يوم ${label}`}
          />
          <Bar
            dataKey="amount"
            name="المصروفات"
            fill="#62d58f"
            radius={[6, 6, 0, 0]}
            maxBarSize={34}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart() {
  const { transactions, categories } = useFinance();

  const data = useMemo(
    () =>
      categories
        .filter((category) => category.type === "expense")
        .map((category) => ({
          ...category,
          value: transactions
            .filter((item) => item.type === "expense" && item.categoryId === category.id)
            .reduce((sum, item) => sum + item.amount, 0),
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [transactions, categories]
  );

  return (
    <div className="flex min-h-[230px] flex-col items-center justify-center gap-3 sm:flex-row">
      <div className="h-[190px] w-full max-w-[220px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={4}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatEGP(Number(value)), "الإجمالي"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full space-y-2">
        {data.length ? (
          data.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-[#9aa79e]">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-semibold text-[#e5ece7] shrink-0">{formatEGP(item.value)}</span>
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-xs text-[#718078]">
            لا توجد مصروفات مسجلة حتى الآن.
          </p>
        )}
      </div>
    </div>
  );
}
