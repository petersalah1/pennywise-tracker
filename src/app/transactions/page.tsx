"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionForm from "@/components/transactions/TransactionForm";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";

export default function TransactionsPage() {
  const [open, setOpen] = useState(false);
  const { transactions, income, expenses } = useFinance();

  const stats = [
    { label: "كافة المعاملات المسجلة", value: `${transactions.length} معاملة` },
    { label: "إجمالي الدخل الوارد", value: formatEGP(income), tone: "text-[#70d99a]" },
    { label: "إجمالي المصروفات المنفقة", value: formatEGP(expenses), tone: "text-[#f18484]" },
  ];

  return (
    <AppShell
      title="سجل المعاملات"
      subtitle="سجل زمني دقيق لكل جنيه يدخل أو يخرج من محفظتك"
    >
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#69d994]">سجل النشاط المالي</p>
          <h2 className="mt-1.5 text-2xl font-bold text-white">المعاملات المالية</h2>
          <p className="mt-1 text-xs text-[#829087]">
            استعراض وتعديل وحذف الحركات المالية مع إمكانية التصدير والبحث المتقدم.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#69d994] px-4 py-3 text-xs font-bold text-[#0a160e] shadow-lg shadow-emerald-950/20 transition hover:bg-[#82e6a7]"
        >
          <Plus size={16} /> إضافة معاملة جديدة
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/[.06] bg-[#111914] p-4 transition hover:border-white/[.1]"
          >
            <p className="text-[11px] font-medium text-[#7e8c83]">{item.label}</p>
            <p className={`mt-2 text-xl font-bold ${item.tone ?? "text-white"}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <TransactionTable />

      {open && <TransactionForm onClose={() => setOpen(false)} />}
    </AppShell>
  );
}
