"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet as WalletIcon,
  Building2,
  Zap,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  ArrowLeft,
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { formatEGP } from "@/lib/finance";
import type { WalletType } from "@/types/transaction";
import TransferModal from "./TransferModal";

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

export default function WalletsOverview() {
  const { wallets, getWalletBalance } = useFinance();
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-white/[.065] bg-[#111914] p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-white">محافظي وحساباتي المالية</h3>
            <p className="mt-1 text-[11px] text-[#718078]">
              توزيع رصيدك الفعلي بين الكاش، البنك، إنستاباي، والمحافظ الإلكترونية
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTransferOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#c084fc]/30 bg-[#261738] px-3 py-2 text-xs font-semibold text-[#d8b4fe] transition hover:bg-[#341e4d]"
            >
              <ArrowLeftRight size={14} />
              <span>تحويل بين المحافظ</span>
            </button>

            <Link
              href="/wallets"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#78d99b] hover:text-[#a0edb9]"
            >
              <span>إدارة الحسابات</span>
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {wallets.map((wallet) => {
            const Icon = getWalletIcon(wallet.type);
            const balance = getWalletBalance(wallet.id);

            return (
              <div
                key={wallet.id}
                className="relative overflow-hidden rounded-xl border border-white/[.05] bg-[#0c120e] p-4 transition hover:border-white/[.12]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium text-[#8d9b92]">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: wallet.color }}
                    />
                    <span className="truncate">{wallet.name}</span>
                  </span>
                  <span
                    className="grid h-8 w-8 place-items-center rounded-lg"
                    style={{
                      background: `${wallet.color}15`,
                      color: wallet.color,
                    }}
                  >
                    <Icon size={16} />
                  </span>
                </div>

                <p className="mt-3 text-lg font-bold tracking-tight text-white">
                  {formatEGP(balance)}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-[#637368]">
                  <span>
                    {wallet.type === "cash"
                      ? "نقدية في اليد"
                      : wallet.type === "bank"
                      ? "حساب مصرفي"
                      : wallet.type === "instapay"
                      ? "شبكة المدفوعات اللحظية"
                      : "محفظة ذكية"}
                  </span>
                  <span
                    className={`font-semibold ${
                      balance >= 0 ? "text-[#65d891]" : "text-[#f87171]"
                    }`}
                  >
                    {balance >= 0 ? "نشط" : "عجز"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {transferOpen && <TransferModal onClose={() => setTransferOpen(false)} />}
    </>
  );
}

