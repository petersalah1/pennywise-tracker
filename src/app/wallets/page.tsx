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
  "#2563EB",
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
          <p className="text-xs font-semibold tracking-wider text-blue-700">مصادر أموالك</p>
          <h2 className="mt-1.5 text-2xl font-bold text-[#0f1712]">المحافظ والحسابات</h2>
          <p className="mt-1 text-xs text-[#607267]">
            إجمالي رصيدك الفعلي موزعاً بدقة لمعرفة أين تتواجد أموالك الآن.
          </p>
        </div>

        <button
          onClick={() => setTransferOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
        >
          <ArrowLeftRight size={16} />
          <span>تحويل بين المحافظ</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border p-3.5 text-xs font-medium ${
            feedback.error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          <Check size={16} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Total Balance Card */}
      <div className="mb-6 rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs text-[#607267]">مجموع أرصدة كافة المحافظ</p>
            <p className="mt-1 text-2xl font-extrabold text-[#0f1712] sm:text-3xl">
              {formatEGP(balance)}
            </p>
          </div>
          <div className="text-xs text-[#607267]">
            <span>عدد المحافظ النشطة: </span>
            <span className="font-bold text-[#0f1712]">{wallets.length} محافظ</span>
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
                  className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs transition hover:border-blue-300"
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
                        <h4 className="text-sm font-bold text-[#0f1712]">{wallet.name}</h4>
                        <p className="text-[10px] text-[#607267]">
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
                        className="rounded-lg p-1.5 text-[#8c9c91] transition hover:bg-[#f1f5f3] hover:text-[#0f1712]"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        title="حذف المحفظة"
                        onClick={() => handleDelete(wallet)}
                        className="rounded-lg p-1.5 text-[#8c9c91] transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#f1f5f3] pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#607267]">الرصيد الفعلي الحالي:</span>
                      <span
                        className={`text-lg font-bold tabular-nums ${
                          liveBalance >= 0 ? "text-[#0f1712]" : "text-rose-600"
                        }`}
                      >
                        {formatEGP(liveBalance)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#8c9c91]">
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
          className="h-fit rounded-2xl border border-[#e5eae7] bg-white p-5 sm:p-6 shadow-xs"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <WalletIcon size={17} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#0f1712]">
                  {editingWallet ? "تعديل المحفظة" : "إضافة محفظة أو حساب جديد"}
                </h3>
                <p className="text-[11px] text-[#607267]">
                  {editingWallet ? `تعديل بيانات: ${editingWallet.name}` : "إضافة مصدر مالي"}
                </p>
              </div>
            </div>
            {editingWallet && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-1 rounded-lg border border-[#e2e8e5] px-2 py-1 text-[11px] text-[#607267] hover:bg-[#f3f6f4]"
              >
                <X size={13} /> إلغاء
              </button>
            )}
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">اسم المحفظة / الحساب</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="مثلاً: بنك CIB، محفظة أورنج كاش"
              className="field"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">نوع الحساب</span>
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
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">
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
            <span className="mt-1 block text-[10px] text-[#8c9c91]">
              المبلغ الموجود فعلياً داخل هذه المحفظة قبل تسجيل المعاملات الجديدة.
            </span>
          </label>

          <div className="mb-6">
            <span className="mb-2 block text-xs font-medium text-[#526359]">لون المحفظة</span>
            <div className="flex flex-wrap gap-2">
              {palette.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setColor(item)}
                  aria-label={`اختيار اللون ${item}`}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === item
                      ? "scale-110 ring-2 ring-blue-500 ring-offset-2 ring-offset-white"
                      : "hover:scale-105"
                  }`}
                  style={{ background: item }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm"
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

