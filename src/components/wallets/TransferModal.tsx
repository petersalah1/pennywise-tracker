"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeftRight, X, Info } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";

export default function TransferModal({ onClose }: { onClose: () => void }) {
  const { wallets, getWalletBalance, transferBetweenWallets } = useFinance();

  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || "");
  const [toWalletId, setToWalletId] = useState(
    wallets.length > 1 ? wallets[1].id : wallets[0]?.id || ""
  );
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Auto-fix if from and to are the same or not found
  useEffect(() => {
    if (wallets.length >= 2) {
      if (!fromWalletId || !wallets.some((w) => w.id === fromWalletId)) {
        setFromWalletId(wallets[0].id);
      }
      if (
        !toWalletId ||
        !wallets.some((w) => w.id === toWalletId) ||
        toWalletId === fromWalletId
      ) {
        const other = wallets.find((w) => w.id !== fromWalletId);
        if (other) setToWalletId(other.id);
      }
    }
  }, [wallets, fromWalletId, toWalletId]);

  function handleFromChange(newFromId: string) {
    setFromWalletId(newFromId);
    if (toWalletId === newFromId) {
      const other = wallets.find((w) => w.id !== newFromId);
      if (other) setToWalletId(other.id);
    }
  }

  const fromBalance = getWalletBalance(fromWalletId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("يرجى إدخال مبلغ صحيح للتحويل.");
      return;
    }

    if (fromWalletId === toWalletId) {
      setError("لا يمكن التحويل إلى نفس المحفظة! يرجى اختيار محفظة أخرى كـ مستلم.");
      return;
    }

    if (numAmount > fromBalance) {
      if (
        !window.confirm(
          `رصيد المحفظة المصدر (${formatEGP(fromBalance)}) أقل من المبلغ المطلوب تحويله (${formatEGP(
            numAmount
          )}). هل ترغب في إتمام التحويل على أي حال؟`
        )
      ) {
        return;
      }
    }

    await transferBetweenWallets({
      fromWalletId,
      toWalletId,
      amount: numAmount,
      date,
      note: note.trim() || undefined,
    });

    onClose();
  }

  const destinationWallets = wallets.filter((w) => w.id !== fromWalletId);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-[480px] rounded-none sm:rounded-2xl border-0 sm:border sm:border-[#e5eae7] bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Sticky Header on Mobile */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-[#e5eae7] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
              <ArrowLeftRight size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#0f1712]">تحويل بين محافظك الشخصية</h3>
              <p className="text-[11px] text-[#607267]">
                نقل رصيد داخلي من حساب إلى حساب آخر تابع لك
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8c9c91] hover:bg-[#f3f6f4] hover:text-[#0f1712]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body without visible scrollbar */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-4">
          {/* Informative Tip */}
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold">توضيح مهم:</p>
              <p className="text-[11px] text-blue-800">
                هذه الخاصية لنقل الأموال <strong>بين حساباتك أنت</strong> (مثلاً: سحب كاش من البنك، أو تحويل من إنستاباي لكاش).
                <br />
                إذا كنت تحول فلوس <strong>لشخص آخر</strong> عن طريق إنستاباي، اختر <strong>«مصروف»</strong> وحدد محفظة إنستاباي.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#526359]">
                من محفظة (المصدر)
              </span>
              <select
                required
                value={fromWalletId}
                onChange={(e) => handleFromChange(e.target.value)}
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

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">
              المبلغ المراد تحويله (ج.م)
            </span>
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
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">تاريخ التحويل</span>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">
              سبب أو ملاحظة التحويل <span className="text-[#8c9c91]">(اختياري)</span>
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثلاً: سحب نقدي كاش من ATM البنك"
              className="field"
            />
          </label>
        </div>

        {/* Sticky Action Footer on Mobile */}
        <div className="flex gap-3 p-4 sm:p-6 pt-3 border-t border-[#e5eae7] bg-white shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e2e8e5] py-3 text-xs font-semibold text-[#526359] hover:bg-[#f3f6f4] hover:text-[#0f1712] transition dark:border-[#303744] dark:bg-[#1E2530] dark:text-[#A0A7B4] dark:hover:bg-[#29303D] dark:hover:text-[#F3F4F6]"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-white transition hover:bg-primary-hover shadow-sm shadow-blue-600/20 active:scale-[0.99]"
          >
            تأكيد التحويل
          </button>
        </div>
      </form>
    </div>
  );
}
