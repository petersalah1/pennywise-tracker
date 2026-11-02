"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Download,
  Edit2,
  Search,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { exportTransactionsToCSV, formatEGP, getCategory, getWallet } from "@/lib/finance";
import type { Transaction } from "@/types/transaction";
import TransactionForm from "./TransactionForm";

export default function TransactionTable({ limit }: { limit?: number }) {
  const { transactions, categories, wallets, deleteTransaction } = useFinance();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredRows = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const day = now.getDay();
    const diff = (day + 1) % 7;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - diff);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = `${prevMonthDate.getFullYear()}-${String(
      prevMonthDate.getMonth() + 1
    ).padStart(2, "0")}`;

    return transactions
      .filter((item) => {
        // Type filter
        if (typeFilter !== "all" && item.type !== typeFilter) return false;

        // Wallet filter
        if (walletFilter !== "all") {
          if (item.walletId !== walletFilter && item.toWalletId !== walletFilter) {
            return false;
          }
        }

        // Date filter
        if (dateFilter === "today" && item.date !== todayStr) return false;
        if (dateFilter === "week" && item.date < weekStartStr) return false;
        if (dateFilter === "month" && !item.date.startsWith(thisMonthPrefix)) return false;
        if (dateFilter === "last-month" && !item.date.startsWith(lastMonthPrefix)) return false;

        // Query filter
        const category = getCategory(categories, item.categoryId);
        const fromW = getWallet(wallets, item.walletId);
        const toW = getWallet(wallets, item.toWalletId);
        const searchTarget = `${item.title} ${category?.name ?? ""} ${fromW?.name ?? ""} ${toW?.name ?? ""} ${item.note ?? ""}`.toLowerCase();
        return searchTarget.includes(query.toLowerCase());
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, categories, wallets, typeFilter, walletFilter, dateFilter, query]);

  const shown = limit ? filteredRows.slice(0, limit) : filteredRows;

  function handleDelete(id: string, title: string) {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف المعاملة: "${title}"؟`)) {
      deleteTransaction(id);
    }
  }

  function handleExport() {
    exportTransactionsToCSV(filteredRows, categories, wallets);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/[.065] bg-[#111914]">
        {/* Header Controls */}
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">سجل المعاملات المالية</h3>
            <p className="mt-1 text-[11px] text-[#718078]">
              عرض وتصفية حركات الدخل والمصروفات والتحويلات بين المحافظ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[.07] bg-[#0c120e] px-3">
              <Search size={14} className="shrink-0 text-[#708078]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث..."
                className="w-full bg-transparent py-2 text-xs text-white outline-none placeholder:text-[#637168] sm:w-32"
              />
            </div>

            {/* Wallet Filter */}
            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className="rounded-xl border border-white/[.07] bg-[#0c120e] px-2.5 py-2 text-xs text-[#aab6ae] outline-none"
            >
              <option value="all">كل المحافظ</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-white/[.07] bg-[#0c120e] px-2.5 py-2 text-xs text-[#aab6ae] outline-none"
            >
              <option value="all">كل الأنواع</option>
              <option value="expense">المصروفات فقط</option>
              <option value="income">الدخل فقط</option>
              <option value="transfer">التحويلات فقط</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-white/[.07] bg-[#0c120e] px-2.5 py-2 text-xs text-[#aab6ae] outline-none"
            >
              <option value="all">كل الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="last-month">الشهر الماضي</option>
            </select>

            {/* Export CSV button */}
            <button
              onClick={handleExport}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-[#16231a] px-3 py-2 text-xs font-semibold text-[#82e6a7] transition hover:bg-[#1f3326] disabled:opacity-40"
              title="تصدير النتائج كملف Excel / CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right">
            <thead>
              <tr className="border-b border-white/[.045] bg-[#0c120e]/60 text-[11px] font-semibold uppercase tracking-wider text-[#738279]">
                <th className="px-5 py-3">المعاملة</th>
                <th className="px-4 py-3">المحفظة / الحساب</th>
                <th className="px-4 py-3">التصنيف</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3 text-left">المبلغ</th>
                <th className="w-24 px-4 py-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => {
                const category = getCategory(categories, item.categoryId);
                const wallet = getWallet(wallets, item.walletId);
                const toWallet = getWallet(wallets, item.toWalletId);
                const isIncome = item.type === "income";
                const isTransfer = item.type === "transfer";

                return (
                  <tr
                    key={item.id}
                    className="border-b border-white/[.04] transition hover:bg-white/[.018]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                            isTransfer
                              ? "bg-[#271a38] text-[#c084fc]"
                              : isIncome
                              ? "bg-[#1c3827] text-[#72d99b]"
                              : "bg-[#382323] text-[#f58b8b]"
                          }`}
                        >
                          {isTransfer ? (
                            <ArrowLeftRight size={16} />
                          ) : isIncome ? (
                            <ArrowDownLeft size={17} />
                          ) : (
                            <ArrowUpRight size={17} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#e8eee9]">
                            {item.title}
                          </p>
                          {item.note && (
                            <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-[#718077]">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Wallet Badge */}
                    <td className="px-4 py-3.5">
                      {isTransfer ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#aab6ae]">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: wallet?.color || "#888" }}
                          />
                          <span className="font-medium text-white">{wallet?.name || "مصدر"}</span>
                          <span className="text-[#64746b]">&larr;</span>
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: toWallet?.color || "#888" }}
                          />
                          <span className="font-medium text-white">{toWallet?.name || "مستلم"}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0c120e] px-2.5 py-1 text-xs text-[#c5d1c9]">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: wallet?.color || "#888" }}
                          />
                          <span>{wallet?.name || "افتراضي"}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {isTransfer ? (
                        <span className="text-xs text-[#6e7d73]">تحويل أموال</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs text-[#a2afa6]">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: category?.color ?? "#87938b" }}
                          />
                          <span className="truncate">{category?.name ?? "غير محدد"}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-[#89968d]">
                      {new Date(`${item.date}T00:00:00`).toLocaleDateString("ar-EG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td
                      className={`px-4 py-3.5 text-left text-xs font-bold tabular-nums ${
                        isTransfer
                          ? "text-[#c084fc]"
                          : isIncome
                          ? "text-[#70d99a]"
                          : "text-[#f18484]"
                      }`}
                      dir="ltr"
                    >
                      {isTransfer ? "⇄ " : isIncome ? "+" : "−"} {formatEGP(item.amount)}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="تعديل المعاملة"
                          onClick={() => setEditingTransaction(item)}
                          className="rounded-lg p-1.5 text-[#8b9b91] transition hover:bg-white/10 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          title="حذف المعاملة"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="rounded-lg p-1.5 text-[#8b9b91] transition hover:bg-red-400/10 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#758279]">
                    لا توجد معاملات تطابق خيارات البحث والتصفية المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/[.05] px-5 py-3 text-[11px] text-[#6e7d73]">
          <span>
            عرض {shown.length} من أصل {filteredRows.length} معاملة
          </span>
          {limit && filteredRows.length > limit && (
            <span className="text-[#84e4a7]">يتم عرض أحدث {limit} معاملات فقط</span>
          )}
        </div>
      </div>

      {editingTransaction && (
        <TransactionForm
          transactionToEdit={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </>
  );
}
