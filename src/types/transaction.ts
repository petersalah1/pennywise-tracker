export type TransactionType = "income" | "expense" | "transfer";

export type WalletType = "cash" | "bank" | "instapay" | "e-wallet" | "other";

export type Wallet = {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  color: string;
  icon?: string;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  budget?: number; // سقف الميزانية الشهرية إن وجد
};

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  walletId?: string; // المحفظة المستخدمة
  toWalletId?: string; // المحفظة المحول إليها (في حالة التحويل)
  date: string; // YYYY-MM-DD
  note?: string;
};

export type FinanceData = {
  userName: string;
  openingBalance: number;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
};
