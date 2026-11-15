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
import { exportTransactionsToCSV, formatEGP, formatNoteForDisplay, getCategory, getWallet, isOneOffTransaction } from "@/lib/finance";
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
      <div className="overflow-hidden rounded-2xl border border-[#e5eae7] bg-white shadow-xs">
        {/* Header Controls */}
        <div className="flex flex-col gap-3 border-b border-[#e5eae7] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#0f1712]">سجل المعاملات المالية</h3>
            <p className="mt-1 text-[11px] text-[#607267]">
              عرض وتصفية حركات الدخل والمصروفات والتحويلات بين المحافظ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e2e8e5] bg-white px-3 shadow-2xs focus-within:border-blue-500 transition">
              <Search size={14} className="shrink-0 text-[#8c9c91]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث..."
                className="w-full bg-transparent py-2 text-xs text-[#0f1712] outline-none placeholder:text-[#8c9c91] sm:w-32"
              />
            </div>

            {/* Wallet Filter */}
            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className="rounded-xl border border-[#e2e8e5] bg-white px-3 py-2 text-xs font-medium text-[#0f1712] shadow-2xs outline-none hover:border-blue-300 focus:border-blue-500 transition"
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
              className="rounded-xl border border-[#e2e8e5] bg-white px-3 py-2 text-xs font-medium text-[#0f1712] shadow-2xs outline-none hover:border-blue-300 focus:border-blue-500 transition"
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
              className="rounded-xl border border-[#e2e8e5] bg-white px-3 py-2 text-xs font-medium text-[#0f1712] shadow-2xs outline-none hover:border-blue-300 focus:border-blue-500 transition"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-100 disabled:opacity-40"
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
              <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-[#607267]">
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
                    className="border-b border-[#f1f5f3] transition hover:bg-[#f8faf9]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                            isTransfer
                              ? "border-blue-100 bg-blue-50 text-blue-600"
                              : isIncome
                              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                              : "border-rose-100 bg-rose-50 text-rose-600"
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
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-semibold text-[#0f1712]">
                              {item.title}
                            </p>
                            {isOneOffTransaction(item) && (
                              <span
                                title="مصروف استثنائي (مستبعد من المعدل اليومي)"
                                className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800"
                              >
                                استثنائي
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-[#607267]">
                              {formatNoteForDisplay(item.note)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Wallet Badge */}
                    <td className="px-4 py-3.5">
                      {isTransfer ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#607267]">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: wallet?.color || "#888" }}
                          />
                          <span className="font-medium text-[#0f1712]">{wallet?.name || "مصدر"}</span>
                          <span className="text-[#8c9c91]">&larr;</span>
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: toWallet?.color || "#888" }}
                          />
                          <span className="font-medium text-[#0f1712]">{toWallet?.name || "مستلم"}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8e5] bg-[#f8faf9] px-2.5 py-1 text-xs text-[#0f1712]">
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
                        <span className="text-xs text-[#607267]">تحويل أموال</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs text-[#526359]">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: category?.color ?? "#87938b" }}
                          />
                          <span className="truncate">{category?.name ?? "غير محدد"}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-[#607267]">
                      {new Date(`${item.date}T00:00:00`).toLocaleDateString("ar-EG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td
                      className={`px-4 py-3.5 text-left text-xs font-bold tabular-nums ${
                        isTransfer
                          ? "text-blue-600"
                          : isIncome
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                      dir="ltr"
                    >
                      {isTransfer ? "⇄ " : isIncome ? "+" : "−"} {formatEGP(item.amount)}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          title="تعديل المعاملة"
                          onClick={() => setEditingTransaction(item)}
                          className="rounded-lg border border-[#e2e8e5] bg-white p-1.5 text-blue-600 shadow-2xs transition hover:bg-blue-50 hover:border-blue-200"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          title="حذف المعاملة"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="rounded-lg border border-[#e2e8e5] bg-white p-1.5 text-rose-500 shadow-2xs transition hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#8c9c91]">
                    لا توجد معاملات تطابق خيارات البحث والتصفية المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#e5eae7] px-5 py-3 text-[11px] text-[#607267]">
          <span>
            عرض {shown.length} من أصل {filteredRows.length} معاملة
          </span>
          {limit && filteredRows.length > limit && (
            <span className="font-semibold text-blue-700">يتم عرض أحدث {limit} معاملات فقط</span>
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
