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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-[480px] rounded-2xl border border-white/10 bg-[#141c17] p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#291e3b] text-[#c084fc]">
              <ArrowLeftRight size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">تحويل بين محافظك الشخصية</h3>
              <p className="text-[11px] text-[#829087]">
                نقل رصيد داخلي من حساب إلى حساب آخر تابع لك
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8d9b92] hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informative Tip */}
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-purple-500/20 bg-[#1a1426] p-3 text-xs leading-5 text-[#d8b4fe]">
          <Info size={16} className="mt-0.5 shrink-0 text-[#c084fc]" />
          <div>
            <p className="font-semibold">توضيح مهم:</p>
            <p className="text-[11px] text-[#c4b1dc]">
              هذه الخاصية لنقل الأموال <strong>بين حساباتك أنت</strong> (مثلاً: سحب كاش من البنك، أو تحويل من إنستاباي لكاش).
              <br />
              إذا كنت تحول فلوس <strong>لشخص آخر</strong> عن طريق إنستاباي، اختر <strong>«مصروف»</strong> وحدد محفظة إنستاباي.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/30 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
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

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
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
            <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">تاريخ التحويل</span>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
              سبب أو ملاحظة التحويل <span className="text-[#68766e]">(اختياري)</span>
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثلاً: سحب نقدي كاش من ATM البنك"
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
            className="flex-1 rounded-xl bg-[#c084fc] py-3 text-xs font-bold text-[#140b1f] transition hover:bg-[#d8b4fe]"
          >
            تأكيد التحويل
          </button>
        </div>
      </form>
    </div>
  );
}
