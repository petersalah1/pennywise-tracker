"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Info } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import type { Transaction, TransactionType } from "@/types/transaction";
import { formatEGP, formatNoteForDisplay, isOneOffTransaction } from "@/lib/finance";

export default function TransactionForm({
  onClose,
  transactionToEdit,
}: {
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}) {
  const { categories, wallets, getWalletBalance, addTransaction, editTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>(transactionToEdit?.type ?? "expense");
  const [title, setTitle] = useState(transactionToEdit?.title ?? "");
  const [amount, setAmount] = useState(transactionToEdit ? String(transactionToEdit.amount) : "");
  const [categoryId, setCategoryId] = useState(transactionToEdit?.categoryId ?? "");
  const [walletId, setWalletId] = useState(transactionToEdit?.walletId ?? wallets[0]?.id ?? "");
  const [toWalletId, setToWalletId] = useState(
    transactionToEdit?.toWalletId ?? (wallets.length > 1 ? wallets[1].id : wallets[0]?.id ?? "")
  );
  const [date, setDate] = useState(
    transactionToEdit?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState(
    transactionToEdit ? formatNoteForDisplay(transactionToEdit.note) : ""
  );
  const [isOneOff, setIsOneOff] = useState(
    transactionToEdit ? isOneOffTransaction(transactionToEdit) : false
  );
  const [error, setError] = useState<string | null>(null);

  const availableCategories = categories.filter(
    (item) => item.type === (type === "income" ? "income" : "expense")
  );

  // Auto-sync categories when switching type
  useEffect(() => {
    if (type !== "transfer" && !availableCategories.some((c) => c.id === categoryId)) {
      setCategoryId(availableCategories[0]?.id ?? "");
    }
  }, [type, availableCategories, categoryId]);

  // Auto-fix if walletId and toWalletId are identical
  useEffect(() => {
    if (wallets.length >= 2) {
      if (!walletId || !wallets.some((w) => w.id === walletId)) {
        setWalletId(wallets[0].id);
      }
      if (!toWalletId || !wallets.some((w) => w.id === toWalletId) || toWalletId === walletId) {
        const other = wallets.find((w) => w.id !== walletId);
        if (other) setToWalletId(other.id);
      }
    }
  }, [wallets, walletId, toWalletId]);

  function handleWalletChange(newId: string) {
    setWalletId(newId);
    if (toWalletId === newId) {
      const other = wallets.find((w) => w.id !== newId);
      if (other) setToWalletId(other.id);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("يرجى إدخال مبلغ صحيح.");
      return;
    }

    if (type === "transfer") {
      if (walletId === toWalletId) {
        setError("لا يمكن التحويل لنفس المحفظة! يرجى اختيار محفظة أخرى كـ مستلم.");
        return;
      }
      const fromWallet = wallets.find((w) => w.id === walletId);
      const toWallet = wallets.find((w) => w.id === toWalletId);
      const transferTitle =
        title.trim() || `تحويل من ${fromWallet?.name || ""} إلى ${toWallet?.name || ""}`;

      if (transactionToEdit) {
        editTransaction(transactionToEdit.id, {
          title: transferTitle,
          amount: numericAmount,
          type: "transfer",
          categoryId: "",
          walletId,
          toWalletId,
          date,
          note: note.trim() || undefined,
        });
      } else {
        addTransaction({
          title: transferTitle,
          amount: numericAmount,
          type: "transfer",
          categoryId: "",
          walletId,
          toWalletId,
          date,
          note: note.trim() || undefined,
        });
      }
      onClose();
      return;
    }

    if (!title.trim() || !categoryId) {
      setError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    if (transactionToEdit) {
      editTransaction(transactionToEdit.id, {
        title: title.trim(),
        amount: numericAmount,
        type,
        categoryId,
        walletId,
        date,
        note: note.trim() || undefined,
        isOneOff: type === "expense" ? isOneOff : false,
      });
    } else {
      addTransaction({
        title: title.trim(),
        amount: numericAmount,
        type,
        categoryId,
        walletId,
        date,
        note: note.trim() || undefined,
        isOneOff: type === "expense" ? isOneOff : false,
      });
    }
    onClose();
  }

  const isEditing = Boolean(transactionToEdit);
  const destinationWallets = wallets.filter((w) => w.id !== walletId);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-[500px] rounded-none sm:rounded-2xl border-0 sm:border sm:border-[#e5eae7] bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Sticky Header on Mobile */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-[#e5eae7] bg-white shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#0f1712]">
              {isEditing ? "تعديل المعاملة" : "إضافة حركة مالية جديدة"}
            </h3>
            <p className="mt-1 text-xs text-[#607267]">
              سجل مصروفاً، دخلاً وارداً، أو تحويلاً بين محافظك الشخصية
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8c9c91] hover:bg-[#f3f6f4] hover:text-[#0f1712]"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body without visible scrollbar */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* 3 Mode Tabs: Expense / Income / Transfer */}
          <div className="grid grid-cols-3 rounded-xl border border-[#e5eae7] bg-[#f1f5f3] p-1 text-xs">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-semibold transition border ${
              type === "expense"
                ? "border-rose-200 bg-white text-rose-600 shadow-xs"
                : "border-transparent text-[#607267] hover:text-[#0f1712]"
            }`}
          >
            <ArrowUpRight size={15} /> مصروف
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-semibold transition border ${
              type === "income"
                ? "border-emerald-200 bg-white text-emerald-600 shadow-xs"
                : "border-transparent text-[#607267] hover:text-[#0f1712]"
            }`}
          >
            <ArrowDownLeft size={15} /> دخل
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-semibold transition border ${
              type === "transfer"
                ? "border-blue-200 bg-white text-blue-600 shadow-xs"
                : "border-transparent text-[#607267] hover:text-[#0f1712]"
            }`}
          >
            <ArrowLeftRight size={15} /> تحويل
          </button>
        </div>

        {type === "transfer" && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
            <Info size={15} className="mt-0.5 shrink-0 text-blue-600" />
            <p className="text-[11px] text-blue-800">
              التحويل هنا لنقل الأموال <strong>بين حساباتك الشخصية</strong>. إذا كنت ترسل فلوس{" "}
              <strong>لشخص آخر</strong> عن طريق إنستاباي، اختر <strong>«مصروف»</strong> وحدد
              محفظة إنستاباي.
            </p>
          </div>
        )}

        {type === "transfer" ? (
          /* Transfer Source and Destination */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#526359]">
                  من محفظة (المصدر)
                </span>
                <select
                  required
                  value={walletId}
                  onChange={(e) => handleWalletChange(e.target.value)}
                  className="field"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatEGP(getWalletBalance(w.id))})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#526359]">
                  إلى محفظة (المستلم)
                </span>
                <select
                  required
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="field"
                >
                  {destinationWallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatEGP(getWalletBalance(w.id))})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            /* Regular Title & Wallet */
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#526359]">
                  عنوان المعاملة
                </span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: مشتريات البقالة، بنزين، راتب"
                  className="field"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#526359]">
                    المحفظة / الحساب
                  </span>
                  <select
                    required
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="field"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatEGP(getWalletBalance(w.id))})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#526359]">التصنيف</span>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="field"
                  >
                    <option value="">اختر التصنيف...</option>
                    {availableCategories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#526359]">المبلغ (ج.م)</span>
              <input
                required
                min="0.01"
                step="any"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="field text-lg font-bold"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#526359]">التاريخ</span>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="field"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">
              ملاحظات <span className="text-[#8c9c91]">(اختياري)</span>
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أي تفاصيل أو ملاحظات إضافية ترغب في تدوينها..."
              className="field"
            />
          </label>

          {type === "expense" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e2e8e5] bg-[#f8faf9] p-3.5 transition hover:border-blue-400">
              <input
                type="checkbox"
                checked={isOneOff}
                onChange={(e) => setIsOneOff(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-blue-600"
              />
              <div className="text-right">
                <span className="block text-xs font-semibold text-[#0f1712]">
                  مصروف استثنائي / شراء كبير (استبعاد من حساب المعدل اليومي)
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[#607267]">
                  مثل: شراء موبايل، كورس، أجهزة، أو مصاريف غير متكررة حتى لا تُضخم معدل الصرف اليومي المعتاد.
                </span>
              </div>
            </label>
          )}
        </div>

        {/* Sticky Action Footer on Mobile */}
        <div className="flex gap-3 p-4 sm:p-6 pt-3 border-t border-[#e5eae7] bg-white shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e2e8e5] bg-[#f8faf9] py-3 text-xs font-semibold text-[#526359] transition hover:bg-[#f1f5f3] hover:text-[#0f1712]"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm shadow-blue-600/20"
          >
            {isEditing ? "حفظ التعديلات" : type === "transfer" ? "إتمام التحويل" : "حفظ المعاملة"}
          </button>
        </div>
      </form>
    </div>
  );
}
