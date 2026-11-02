"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Info } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import type { Transaction, TransactionType } from "@/types/transaction";
import { formatEGP } from "@/lib/finance";

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
  const [note, setNote] = useState(transactionToEdit?.note ?? "");
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
      });
    }
    onClose();
  }

  const isEditing = Boolean(transactionToEdit);
  const destinationWallets = wallets.filter((w) => w.id !== walletId);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-[500px] rounded-2xl border border-white/10 bg-[#141c17] p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? "تعديل المعاملة" : "إضافة حركة مالية جديدة"}
            </h3>
            <p className="mt-1 text-xs text-[#829087]">
              سجل مصروفاً، دخلاً وارداً، أو تحويلاً بين محافظك الشخصية
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8d9b92] hover:bg-white/5 hover:text-white"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/30 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* 3 Mode Tabs: Expense / Income / Transfer */}
        <div className="mb-5 grid grid-cols-3 rounded-xl bg-[#0c120e] p-1 text-xs">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-semibold transition ${
              type === "expense"
                ? "bg-[#352020] text-[#ff8585] shadow"
                : "text-[#819087] hover:text-white"
            }`}
          >
            <ArrowUpRight size={15} /> مصروف
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-semibold transition ${
              type === "income"
                ? "bg-[#1c3526] text-[#75dfa0] shadow"
                : "text-[#819087] hover:text-white"
            }`}
          >
            <ArrowDownLeft size={15} /> دخل
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-semibold transition ${
              type === "transfer"
                ? "bg-[#281a38] text-[#c084fc] shadow"
                : "text-[#819087] hover:text-white"
            }`}
          >
            <ArrowLeftRight size={15} /> تحويل
          </button>
        </div>

        {type === "transfer" && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-purple-500/20 bg-[#1a1426] p-3 text-xs leading-5 text-[#d8b4fe]">
            <Info size={15} className="mt-0.5 shrink-0 text-[#c084fc]" />
            <p className="text-[11px] text-[#c4b1dc]">
              التحويل هنا لنقل الأموال <strong>بين حساباتك الشخصية</strong>. إذا كنت ترسل فلوس{" "}
              <strong>لشخص آخر</strong> عن طريق إنستاباي، اختر <strong>«مصروف»</strong> وحدد
              محفظة إنستاباي.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {type === "transfer" ? (
            /* Transfer Source and Destination */
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
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
                <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
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
                <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
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
                  <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
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
                  <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">التصنيف</span>
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
              <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">المبلغ (ج.م)</span>
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
              <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">التاريخ</span>
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
            <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
              ملاحظات <span className="text-[#68766e]">(اختياري)</span>
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أي تفاصيل أو ملاحظات إضافية ترغب في تدوينها..."
              className="field"
            />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-medium text-[#aab6ae] hover:bg-white/5"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className={`flex-1 rounded-xl py-3 text-xs font-bold transition ${
              type === "transfer"
                ? "bg-[#c084fc] text-[#13071f] hover:bg-[#d8b4fe]"
                : "bg-[#65d891] text-[#0b170f] hover:bg-[#7ce5a4]"
            }`}
          >
            {isEditing ? "حفظ التعديلات" : type === "transfer" ? "إتمام التحويل" : "حفظ المعاملة"}
          </button>
        </div>
      </form>
    </div>
  );
}
