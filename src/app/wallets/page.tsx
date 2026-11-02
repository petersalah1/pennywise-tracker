"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Wallet as WalletIcon,
  Building2,
  Zap,
  Smartphone,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  ArrowLeftRight,
  Check,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";
import type { Wallet, WalletType } from "@/types/transaction";
import TransferModal from "@/components/wallets/TransferModal";

const palette = [
  "#10B981",
  "#38BDF8",
  "#A855F7",
  "#EF4444",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
];

function getWalletIcon(type: WalletType) {
  switch (type) {
    case "bank":
      return Building2;
    case "instapay":
      return Zap;
    case "e-wallet":
      return Smartphone;
    case "cash":
      return WalletIcon;
    default:
      return CreditCard;
  }
}

export default function WalletsPage() {
  const {
    wallets,
    walletBalances,
    getWalletBalance,
    addWallet,
    editWallet,
    deleteWallet,
    balance,
  } = useFinance();

  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("cash");
  const [initialBalance, setInitialBalance] = useState("");
  const [color, setColor] = useState(palette[0]);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  function startEdit(w: Wallet) {
    setEditingWallet(w);
    setName(w.name);
    setType(w.type);
    setInitialBalance(String(w.initialBalance));
    setColor(w.color);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingWallet(null);
    setName("");
    setType("cash");
    setInitialBalance("");
    setColor(palette[0]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const initBal = Number(initialBalance) || 0;

    if (editingWallet) {
      await editWallet(editingWallet.id, {
        name: name.trim(),
        type,
        initialBalance: initBal,
        color,
      });
      setFeedback({ text: `تم تحديث محفظة "${name.trim()}" بنجاح!` });
      cancelEdit();
    } else {
      await addWallet({
        name: name.trim(),
        type,
        initialBalance: initBal,
        color,
        icon: "wallet",
      });
      setFeedback({ text: `تمت إضافة محفظة "${name.trim()}" بنجاح!` });
      setName("");
      setInitialBalance("");
    }

    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleDelete(w: Wallet) {
    if (window.confirm(`هل أنت متأكد من حذف محفظة "${w.name}"؟`)) {
      const res = await deleteWallet(w.id);
      if (!res.success) {
        alert(res.message || "تعذر حذف المحفظة");
      } else {
        setFeedback({ text: `تم حذف محفظة "${w.name}" بنجاح.` });
        if (editingWallet?.id === w.id) cancelEdit();
        setTimeout(() => setFeedback(null), 3000);
      }
    }
  }

  return (
    <AppShell
      title="المحافظ والحسابات المالية"
      subtitle="تتبع وتوزيع أموالك بين الكاش، البنوك، إنستاباي، والمحافظ الرقمية"
    >
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#69d994]">مصادر أموالك</p>
          <h2 className="mt-1.5 text-2xl font-bold text-white">المحافظ والحسابات</h2>
          <p className="mt-1 text-xs text-[#829087]">
            إجمالي رصيدك الفعلي موزعاً بدقة لمعرفة أين تتواجد أموالك الآن.
          </p>
        </div>

        <button
          onClick={() => setTransferOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c084fc] px-4 py-3 text-xs font-bold text-[#140b1f] shadow-lg transition hover:bg-[#d8b4fe]"
        >
          <ArrowLeftRight size={16} />
          <span>تحويل بين المحافظ</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border p-3.5 text-xs font-medium ${
            feedback.error
              ? "border-red-500/20 bg-red-950/30 text-red-300"
              : "border-emerald-500/20 bg-[#16271c] text-[#86efac]"
          }`}
        >
          <Check size={16} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Total Balance Card */}
      <div className="mb-6 rounded-2xl border border-white/[.07] bg-gradient-to-br from-[#121f17] to-[#0c140f] p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs text-[#7ea08b]">مجموع أرصدة كافة المحافظ</p>
            <p className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
              {formatEGP(balance)}
            </p>
          </div>
          <div className="text-xs text-[#718a7c]">
            <span>عدد المحافظ النشطة: </span>
            <span className="font-bold text-white">{wallets.length} محافظ</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Wallets Cards List */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {wallets.map((wallet) => {
              const Icon = getWalletIcon(wallet.type);
              const liveBalance = getWalletBalance(wallet.id);

              return (
                <div
                  key={wallet.id}
                  className="rounded-2xl border border-white/[.06] bg-[#111914] p-5 shadow-sm transition hover:border-white/[.12]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-10 w-10 place-items-center rounded-xl"
                        style={{
                          background: `${wallet.color}15`,
                          color: wallet.color,
                        }}
                      >
                        <Icon size={19} />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{wallet.name}</h4>
                        <p className="text-[10px] text-[#758279]">
                          {wallet.type === "cash"
                            ? "نقدية كاش"
                            : wallet.type === "bank"
                            ? "حساب مصرفي"
                            : wallet.type === "instapay"
                            ? "إنستاباي (InstaPay)"
                            : "محفظة رقمية"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        title="تعديل المحفظة"
                        onClick={() => startEdit(wallet)}
                        className="rounded-lg p-1.5 text-[#7e8f84] transition hover:bg-white/10 hover:text-white"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        title="حذف المحفظة"
                        onClick={() => handleDelete(wallet)}
                        className="rounded-lg p-1.5 text-[#7e8f84] transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/[.04] pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#87998e]">الرصيد الفعلي الحالي:</span>
                      <span
                        className={`text-lg font-bold tabular-nums ${
                          liveBalance >= 0 ? "text-white" : "text-[#f87171]"
                        }`}
                      >
                        {formatEGP(liveBalance)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#5e6f64]">
                      <span>الرصيد المبدئي:</span>
                      <span>{formatEGP(wallet.initialBalance)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add / Edit Wallet Form */}
        <form
          onSubmit={submit}
          className="h-fit rounded-2xl border border-white/[.06] bg-[#111914] p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c3827] text-[#72d99b]">
                <WalletIcon size={17} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingWallet ? "تعديل المحفظة" : "إضافة محفظة أو حساب جديد"}
                </h3>
                <p className="text-[11px] text-[#758279]">
                  {editingWallet ? `تعديل بيانات: ${editingWallet.name}` : "إضافة مصدر مالي"}
                </p>
              </div>
            </div>
            {editingWallet && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-[#9baaa0] hover:bg-white/5"
              >
                <X size={13} /> إلغاء
              </button>
            )}
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">اسم المحفظة / الحساب</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="مثلاً: بنك CIB، محفظة أورنج كاش"
              className="field"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">نوع الحساب</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WalletType)}
              className="field"
            >
              <option value="cash">كاش في اليد</option>
              <option value="bank">حساب بنكي</option>
              <option value="instapay">إنستاباي (InstaPay)</option>
              <option value="e-wallet">محفظة إلكترونية (فودافون كاش / أورنج / وي)</option>
              <option value="other">أخرى</option>
            </select>
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-[#aab6ae]">
              الرصيد المبدئي الافتتاحي (ج.م)
            </span>
            <input
              type="number"
              step="any"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
              className="field"
            />
            <span className="mt-1 block text-[10px] text-[#6b7c72]">
              المبلغ الموجود فعلياً داخل هذه المحفظة قبل تسجيل المعاملات الجديدة.
            </span>
          </label>

          <div className="mb-6">
            <span className="mb-2 block text-xs font-medium text-[#aab6ae]">لون المحفظة</span>
            <div className="flex flex-wrap gap-2">
              {palette.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setColor(item)}
                  aria-label={`اختيار اللون ${item}`}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === item
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#111914]"
                      : "hover:scale-105"
                  }`}
                  style={{ background: item }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#69d994] py-3 text-xs font-bold text-[#0a160e] transition hover:bg-[#82e6a7]"
          >
            <Plus size={15} />
            {editingWallet ? "حفظ تعديلات المحفظة" : "إضافة المحفظة"}
          </button>
        </form>
      </div>

      {transferOpen && <TransferModal onClose={() => setTransferOpen(false)} />}
    </AppShell>
  );
}

