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
    { label: "إجمالي الدخل الوارد", value: formatEGP(income), tone: "text-emerald-600" },
    { label: "إجمالي المصروفات المنفقة", value: formatEGP(expenses), tone: "text-rose-600" },
  ];

  return (
    <AppShell title="سجل المعاملات">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold text-[#0f1712] dark:text-[#f0f4f2]">المعاملات المالية</h2>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 active:bg-blue-800"
        >
          <Plus size={16} /> إضافة معاملة جديدة
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#e5eae7] bg-white p-4 shadow-xs dark:border-[#222933] dark:bg-[#151921]"
          >
            <p className="text-[11px] font-medium text-[#607267] dark:text-[#8b9aa7]">{item.label}</p>
            <p className={`mt-2 text-xl font-bold ${item.tone ?? "text-[#0f1712] dark:text-[#f0f4f2]"}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <TransactionTable />

      {open && <TransactionForm onClose={() => setOpen(false)} />}
    </AppShell>
  );
}
