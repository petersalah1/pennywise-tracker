import type { Category, Transaction, Wallet } from "@/types/transaction";

export const DEFAULT_WALLETS: Wallet[] = [
  { id: "cash", name: "كاش (المحفظة)", type: "cash", initialBalance: 0, color: "#10B981", icon: "wallet" },
  { id: "bank", name: "حساب بنكي", type: "bank", initialBalance: 0, color: "#38BDF8", icon: "building-2" },
  { id: "instapay", name: "إنستاباي (InstaPay)", type: "instapay", initialBalance: 0, color: "#A855F7", icon: "zap" },
  { id: "ewallet", name: "محفظة إلكترونية (فودافون كاش)", type: "e-wallet", initialBalance: 0, color: "#EF4444", icon: "smartphone" },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "طعام ومشروبات", type: "expense", color: "#F59E0B", icon: "utensils", budget: 4000 },
  { id: "transport", name: "مواصلات ووقود", type: "expense", color: "#38BDF8", icon: "car-front", budget: 1500 },
  { id: "shopping", name: "تسوق ومشتريات", type: "expense", color: "#C084FC", icon: "shopping-bag", budget: 2000 },
  { id: "bills", name: "فواتير والتزامات", type: "expense", color: "#FB7185", icon: "receipt", budget: 2500 },
  { id: "health", name: "صحة وعلاج", type: "expense", color: "#34D399", icon: "heart-pulse", budget: 1000 },
  { id: "other-expense", name: "مصاريف أخرى", type: "expense", color: "#94A3B8", icon: "ellipsis" },
  { id: "salary", name: "راتب شهري", type: "income", color: "#34D399", icon: "briefcase-business" },
  { id: "freelance", name: "عمل حر (Freelance)", type: "income", color: "#60A5FA", icon: "laptop" },
  { id: "gift", name: "مكافآت وهدايا", type: "income", color: "#F472B6", icon: "gift" },
  { id: "other-income", name: "دخل إضافي آخر", type: "income", color: "#A3A3A3", icon: "plus-circle" },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export function formatEGP(value: number): string {
  const formatted = new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} ج.م`;
}

export function getCategory(categories: Category[], id: string) {
  return categories.find((category) => category.id === id);
}

export function getWallet(wallets: Wallet[], id?: string) {
  if (!id) return undefined;
  return wallets.find((wallet) => wallet.id === id);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[] = []
) {
  const headers = ["العنوان", "النوع", "المبلغ (ج.م)", "المحفظة / الحساب", "التصنيف", "التاريخ", "ملاحظات"];
  const rows = transactions.map((t) => {
    const category = getCategory(categories, t.categoryId)?.name || "غير محدد";
    const wallet = getWallet(wallets, t.walletId)?.name || "افتراضي";
    const toWallet = t.toWalletId ? ` -> ${getWallet(wallets, t.toWalletId)?.name || ""}` : "";
    const type = t.type === "income" ? "دخل" : t.type === "expense" ? "مصروف" : "تحويل بين محافظ";
    const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : "";
    const title = `"${t.title.replace(/"/g, '""')}"`;
    return [title, type, t.amount, `"${wallet}${toWallet}"`, `"${category}"`, t.date, note].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `معاملات-مالية-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
