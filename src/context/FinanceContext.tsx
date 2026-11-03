"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Category, FinanceData, Transaction, TransactionType, Wallet } from "@/types/transaction";
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS, INITIAL_TRANSACTIONS } from "@/lib/finance";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type FinanceContextValue = {
  userName: string;
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  openingBalance: number;
  balance: number;
  income: number;
  expenses: number;
  isCloudSynced: boolean;
  isLoadingData: boolean;
  walletBalances: Record<string, number>;
  getWalletBalance: (id: string) => number;
  updateUserName: (name: string) => Promise<void>;
  addTransaction: (input: Omit<Transaction, "id">) => Promise<void>;
  editTransaction: (id: string, input: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (input: Omit<Category, "id">) => Promise<void>;
  editCategory: (id: string, input: Partial<Omit<Category, "id">>) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;
  addWallet: (input: Omit<Wallet, "id">) => Promise<void>;
  editWallet: (id: string, input: Partial<Omit<Wallet, "id">>) => Promise<void>;
  deleteWallet: (id: string) => Promise<{ success: boolean; message?: string }>;
  transferBetweenWallets: (input: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
    note?: string;
  }) => Promise<void>;
  updateOpeningBalance: (value: number) => Promise<void>;
  resetAllData: () => void;
  importData: (data: FinanceData) => boolean;
  syncLocalToCloud: () => Promise<void>;
};

const STORAGE_KEY = "egp-tracker-data-v3";
const LEGACY_STORAGE_KEY_V2 = "egp-tracker-data-v2";

const DEFAULT_DATA: FinanceData = {
  userName: "بيتر صلاح",
  openingBalance: 0,
  wallets: DEFAULT_WALLETS,
  transactions: INITIAL_TRANSACTIONS,
  categories: DEFAULT_CATEGORIES,
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function getCacheKey(userId?: string | null) {
  return userId ? `egp-tracker-user-${userId}` : STORAGE_KEY;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured } = useAuth();
  const userId = user?.id;
  const [data, setData] = useState<FinanceData>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Helper to save to local cache safely
  const persistLocally = (freshData: FinanceData, targetUserId?: string | null) => {
    try {
      const key = getCacheKey(targetUserId !== undefined ? targetUserId : userId);
      localStorage.setItem(key, JSON.stringify(freshData));
      // Also maintain general storage fallback
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
    } catch (e) {
      console.error("Local storage persist error", e);
    }
  };

  // 1. Initial Load from LocalStorage Cache on Mount
  useEffect(() => {
    try {
      const activeKey = getCacheKey(userId);
      let saved = localStorage.getItem(activeKey);
      if (!saved && userId) {
        saved = localStorage.getItem(STORAGE_KEY);
      }
      if (!saved) {
        saved = localStorage.getItem(LEGACY_STORAGE_KEY_V2);
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        setData({
          userName: parsed.userName || "بيتر صلاح",
          openingBalance: Number(parsed.openingBalance) || 0,
          wallets: parsed.wallets && parsed.wallets.length > 0 ? parsed.wallets : DEFAULT_WALLETS,
          transactions: parsed.transactions || [],
          categories:
            parsed.categories && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
        });
      }
    } catch (error) {
      console.error("Could not load local finance data", error);
    } finally {
      setReady(true);
    }
  }, [userId]);

  // 2. Always persist any state changes to Local Storage
  useEffect(() => {
    if (ready) {
      persistLocally(data, userId);
    }
  }, [data, ready, userId]);

  // 3. Supabase Cloud Sync & Self-Healing
  useEffect(() => {
    if (!userId || !supabase || !isConfigured) return;

    let isMounted = true;

    async function fetchCloudData() {
      setIsLoadingData(true);
      try {
        // Read local cached data first so we don't accidentally lose offline items
        const cacheKey = getCacheKey(userId);
        const cachedRaw = localStorage.getItem(cacheKey) || localStorage.getItem(STORAGE_KEY);
        let cachedData: FinanceData | null = null;
        if (cachedRaw) {
          try {
            cachedData = JSON.parse(cachedRaw);
          } catch {}
        }

        // A. Profile
        const { data: profile } = await supabase!
          .from("profiles")
          .select("user_name, opening_balance")
          .eq("id", userId)
          .maybeSingle();

        // If profile doesn't exist yet in Supabase, create it
        if (!profile) {
          await supabase!.from("profiles").upsert({
            id: userId,
            user_name: cachedData?.userName || "بيتر صلاح",
            opening_balance: cachedData?.openingBalance || 0,
          });
        }

        // B. Categories
        const { data: categoriesData } = await supabase!
          .from("categories")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        let loadedCategories: Category[] = (categoriesData || []).map((c) => ({
          id: String(c.id),
          name: c.name,
          type: c.type,
          color: c.color,
          icon: c.icon || "tag",
          budget: c.budget ? Number(c.budget) : undefined,
        }));

        // If user has no categories in Supabase, seed defaults
        if (loadedCategories.length === 0) {
          const toSeed = (cachedData?.categories && cachedData.categories.length > 0)
            ? cachedData.categories
            : DEFAULT_CATEGORIES;

          loadedCategories = toSeed.map((c) => ({
            ...c,
            id: c.id.includes("_") ? c.id : `${c.id}_${userId}`,
          }));

          for (const cat of loadedCategories) {
            await supabase!.from("categories").upsert({
              id: cat.id,
              user_id: userId,
              name: cat.name,
              type: cat.type,
              color: cat.color,
              icon: cat.icon || "tag",
              budget: cat.budget || null,
            });
          }
        }

        // C. Wallets
        const { data: walletsData } = await supabase!
          .from("wallets")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        let loadedWallets: Wallet[] = (walletsData || []).map((w) => ({
          id: String(w.id),
          name: w.name,
          type: w.type,
          initialBalance: Number(w.initial_balance) || 0,
          color: w.color,
          icon: w.icon || "wallet",
        }));

        // If user has no wallets in Supabase, seed defaults
        if (loadedWallets.length === 0) {
          const toSeed = (cachedData?.wallets && cachedData.wallets.length > 0)
            ? cachedData.wallets
            : DEFAULT_WALLETS;

          loadedWallets = toSeed.map((w) => ({
            ...w,
            id: w.id.includes("_") ? w.id : `${w.id}_${userId}`,
          }));

          for (const wal of loadedWallets) {
            await supabase!.from("wallets").upsert({
              id: wal.id,
              user_id: userId,
              name: wal.name,
              type: wal.type,
              initial_balance: wal.initialBalance,
              color: wal.color,
              icon: wal.icon || "wallet",
            });
          }
        }

        // D. Transactions
        const { data: transactionsData, error: txError } = await supabase!
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false });

        if (txError) {
          console.error("Failed to query transactions from Supabase", txError);
        }

        let loadedTransactions: Transaction[] = (transactionsData || []).map((t) => ({
          id: String(t.id),
          title: t.title,
          amount: Number(t.amount),
          type: t.type,
          categoryId: String(t.category_id || ""),
          walletId: t.wallet_id ? String(t.wallet_id) : undefined,
          toWalletId: t.to_wallet_id ? String(t.to_wallet_id) : undefined,
          date: t.date,
          note: t.note || undefined,
        }));

        // SAFETY NET: If Supabase returns 0 transactions but local cache has transactions,
        // DO NOT wipe them out! Instead, push local transactions up to Supabase!
        if (
          loadedTransactions.length === 0 &&
          cachedData?.transactions &&
          cachedData.transactions.length > 0
        ) {
          loadedTransactions = cachedData.transactions;
          for (const tx of loadedTransactions) {
            await supabase!.from("transactions").upsert({
              id: tx.id,
              user_id: userId,
              category_id: tx.categoryId || null,
              wallet_id: tx.walletId || null,
              to_wallet_id: tx.toWalletId || null,
              title: tx.title,
              amount: tx.amount,
              type: tx.type,
              date: tx.date,
              note: tx.note || null,
            });
          }
        }

        if (!isMounted) return;

        const mergedData: FinanceData = {
          userName: profile?.user_name || cachedData?.userName || "بيتر صلاح",
          openingBalance: Number(profile?.opening_balance ?? cachedData?.openingBalance ?? 0),
          wallets: loadedWallets,
          categories: loadedCategories,
          transactions: loadedTransactions,
        };

        setData(mergedData);
        persistLocally(mergedData, userId);
      } catch (err) {
        console.error("Failed to load Supabase cloud data", err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    fetchCloudData();

    return () => {
      isMounted = false;
    };
  }, [userId, isConfigured]);

  // Live Balances
  const walletBalances = useMemo(() => {
    const balances: Record<string, number> = {};

    data.wallets.forEach((w) => {
      balances[w.id] = w.initialBalance || 0;
    });

    data.transactions.forEach((tx) => {
      if (tx.type === "income" && tx.walletId && balances[tx.walletId] !== undefined) {
        balances[tx.walletId] += tx.amount;
      } else if (tx.type === "expense" && tx.walletId && balances[tx.walletId] !== undefined) {
        balances[tx.walletId] -= tx.amount;
      } else if (tx.type === "transfer") {
        if (tx.walletId && balances[tx.walletId] !== undefined) {
          balances[tx.walletId] -= tx.amount;
        }
        if (tx.toWalletId && balances[tx.toWalletId] !== undefined) {
          balances[tx.toWalletId] += tx.amount;
        }
      }
    });

    return balances;
  }, [data.wallets, data.transactions]);

  const getWalletBalance = (id: string) => walletBalances[id] ?? 0;

  const totals = useMemo(() => {
    const income = data.transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = data.transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    const balance = data.openingBalance + income - expenses;

    return {
      income,
      expenses,
      balance,
    };
  }, [data]);

  const addTransaction = async (input: Omit<Transaction, "id">) => {
    const newId = crypto.randomUUID();
    const newTx: Transaction = {
      ...input,
      id: newId,
      walletId: input.walletId || data.wallets[0]?.id || "cash",
    };

    // 1. Update state
    const nextTransactions = [newTx, ...data.transactions];
    const nextData = { ...data, transactions: nextTransactions };
    setData(nextData);

    // 2. Persist locally immediately
    persistLocally(nextData, userId);

    // 3. Persist to Supabase
    if (userId && supabase) {
      try {
        const { error } = await supabase.from("transactions").insert({
          id: newId,
          user_id: userId,
          category_id: input.categoryId || null,
          wallet_id: newTx.walletId || null,
          to_wallet_id: input.toWalletId || null,
          title: input.title,
          amount: input.amount,
          type: input.type,
          date: input.date,
          note: input.note || null,
        });

        if (error) {
          console.error("Supabase insert error details:", error);
        }
      } catch (err) {
        console.error("Error inserting transaction to Supabase", err);
      }
    }
  };

  const editTransaction = async (id: string, input: Omit<Transaction, "id">) => {
    const nextTransactions = data.transactions.map((item) =>
      item.id === id ? { ...input, id } : item
    );
    const nextData = { ...data, transactions: nextTransactions };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        const { error } = await supabase
          .from("transactions")
          .update({
            category_id: input.categoryId || null,
            wallet_id: input.walletId || null,
            to_wallet_id: input.toWalletId || null,
            title: input.title,
            amount: input.amount,
            type: input.type,
            date: input.date,
            note: input.note || null,
          })
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.error("Supabase update error:", error);
        }
      } catch (err) {
        console.error("Error updating transaction in Supabase", err);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    const nextTransactions = data.transactions.filter((item) => item.id !== id);
    const nextData = { ...data, transactions: nextTransactions };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.error("Supabase delete error:", error);
        }
      } catch (err) {
        console.error("Error deleting transaction from Supabase", err);
      }
    }
  };

  const transferBetweenWallets = async (input: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
    note?: string;
  }) => {
    const fromWallet = data.wallets.find((w) => w.id === input.fromWalletId);
    const toWallet = data.wallets.find((w) => w.id === input.toWalletId);

    const title = `تحويل من ${fromWallet?.name || "محفظة"} إلى ${toWallet?.name || "محفظة"}`;

    await addTransaction({
      title,
      amount: input.amount,
      type: "transfer",
      categoryId: "",
      walletId: input.fromWalletId,
      toWalletId: input.toWalletId,
      date: input.date,
      note: input.note,
    });
  };

  const addWallet = async (input: Omit<Wallet, "id">) => {
    const newId = crypto.randomUUID();
    const newWallet: Wallet = { ...input, id: newId };

    const nextWallets = [...data.wallets, newWallet];
    const nextData = { ...data, wallets: nextWallets };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        const { error } = await supabase.from("wallets").insert({
          id: newId,
          user_id: userId,
          name: input.name,
          type: input.type,
          initial_balance: input.initialBalance,
          color: input.color,
          icon: input.icon || "wallet",
        });

        if (error) {
          console.error("Supabase add wallet error:", error);
        }
      } catch (err) {
        console.error("Error inserting wallet to Supabase", err);
      }
    }
  };

  const editWallet = async (id: string, input: Partial<Omit<Wallet, "id">>) => {
    const nextWallets = data.wallets.map((item) =>
      item.id === id ? { ...item, ...input } : item
    );
    const nextData = { ...data, wallets: nextWallets };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        const { error } = await supabase
          .from("wallets")
          .update({
            ...(input.name ? { name: input.name } : {}),
            ...(input.type ? { type: input.type } : {}),
            ...(input.initialBalance !== undefined ? { initial_balance: input.initialBalance } : {}),
            ...(input.color ? { color: input.color } : {}),
          })
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.error("Supabase edit wallet error:", error);
        }
      } catch (err) {
        console.error("Error updating wallet in Supabase", err);
      }
    }
  };

  const deleteWallet = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (data.wallets.length <= 1) {
      return { success: false, message: "يجب الإبقاء على محفظة واحدة على الأقل." };
    }

    const usedCount = data.transactions.filter(
      (t) => t.walletId === id || t.toWalletId === id
    ).length;

    if (usedCount > 0) {
      return {
        success: false,
        message: `لا يمكن حذف هذه المحفظة لأنها مرتبطة بـ ${usedCount} معاملة مسجلة. يرجى تعديل المعاملات أولاً.`,
      };
    }

    const nextWallets = data.wallets.filter((item) => item.id !== id);
    const nextData = { ...data, wallets: nextWallets };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        await supabase.from("wallets").delete().eq("id", id).eq("user_id", userId);
      } catch (err) {
        console.error("Error deleting wallet from Supabase", err);
      }
    }

    return { success: true };
  };

  const addCategory = async (input: Omit<Category, "id">) => {
    const newId = crypto.randomUUID();
    const newCat: Category = { ...input, id: newId };

    const nextCategories = [...data.categories, newCat];
    const nextData = { ...data, categories: nextCategories };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        const { error } = await supabase.from("categories").insert({
          id: newId,
          user_id: userId,
          name: input.name,
          type: input.type,
          color: input.color,
          icon: input.icon || "tag",
          budget: input.budget || null,
        });

        if (error) {
          console.error("Supabase add category error:", error);
        }
      } catch (err) {
        console.error("Error inserting category to Supabase", err);
      }
    }
  };

  const editCategory = async (id: string, input: Partial<Omit<Category, "id">>) => {
    const nextCategories = data.categories.map((item) =>
      item.id === id ? { ...item, ...input } : item
    );
    const nextData = { ...data, categories: nextCategories };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        const { error } = await supabase
          .from("categories")
          .update({
            ...(input.name ? { name: input.name } : {}),
            ...(input.type ? { type: input.type } : {}),
            ...(input.color ? { color: input.color } : {}),
            ...(input.budget !== undefined ? { budget: input.budget } : {}),
          })
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.error("Supabase edit category error:", error);
        }
      } catch (err) {
        console.error("Error updating category in Supabase", err);
      }
    }
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const usedCount = data.transactions.filter((t) => t.categoryId === id).length;
    if (usedCount > 0) {
      return {
        success: false,
        message: `لا يمكن حذف هذا التصنيف لأنه مستخدم في ${usedCount} معاملة مسجلة.`,
      };
    }

    const nextCategories = data.categories.filter((item) => item.id !== id);
    const nextData = { ...data, categories: nextCategories };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        await supabase.from("categories").delete().eq("id", id).eq("user_id", userId);
      } catch (err) {
        console.error("Error deleting category from Supabase", err);
      }
    }

    return { success: true };
  };

  const updateOpeningBalance = async (value: number) => {
    const nextData = { ...data, openingBalance: value };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        await supabase
          .from("profiles")
          .update({ opening_balance: value })
          .eq("id", userId);
      } catch (err) {
        console.error("Error updating balance in Supabase", err);
      }
    }
  };

  const updateUserName = async (name: string) => {
    const nextData = { ...data, userName: name };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      try {
        await supabase
          .from("profiles")
          .update({ user_name: name })
          .eq("id", userId);
      } catch (err) {
        console.error("Error updating username in Supabase", err);
      }
    }
  };

  const syncLocalToCloud = async () => {
    if (!userId || !supabase) return;
    try {
      await supabase.from("profiles").upsert({
        id: userId,
        user_name: data.userName,
        opening_balance: data.openingBalance,
      });

      for (const cat of data.categories) {
        await supabase.from("categories").upsert({
          id: cat.id,
          user_id: userId,
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon || "tag",
          budget: cat.budget || null,
        });
      }

      for (const wal of data.wallets) {
        await supabase.from("wallets").upsert({
          id: wal.id,
          user_id: userId,
          name: wal.name,
          type: wal.type,
          initial_balance: wal.initialBalance,
          color: wal.color,
          icon: wal.icon || "wallet",
        });
      }

      for (const tx of data.transactions) {
        await supabase.from("transactions").upsert({
          id: tx.id,
          user_id: userId,
          category_id: tx.categoryId || null,
          wallet_id: tx.walletId || null,
          to_wallet_id: tx.toWalletId || null,
          title: tx.title,
          amount: tx.amount,
          type: tx.type,
          date: tx.date,
          note: tx.note || null,
        });
      }
    } catch (err) {
      console.error("Sync to cloud error", err);
    }
  };

  const resetAllData = () => {
    setData(DEFAULT_DATA);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
    if (userId) {
      localStorage.removeItem(getCacheKey(userId));
    }
  };

  const importData = (imported: FinanceData) => {
    try {
      if (!Array.isArray(imported.transactions) || !Array.isArray(imported.categories)) {
        return false;
      }
      const nextData: FinanceData = {
        userName: imported.userName || "بيتر صلاح",
        openingBalance: Number(imported.openingBalance) || 0,
        wallets: Array.isArray(imported.wallets) ? imported.wallets : DEFAULT_WALLETS,
        transactions: imported.transactions,
        categories: imported.categories,
      };
      setData(nextData);
      persistLocally(nextData, userId);
      return true;
    } catch {
      return false;
    }
  };

  const value: FinanceContextValue = {
    userName: data.userName,
    transactions: data.transactions,
    categories: data.categories,
    wallets: data.wallets,
    openingBalance: data.openingBalance,
    isCloudSynced: Boolean(userId && isConfigured),
    isLoadingData,
    walletBalances,
    getWalletBalance,
    updateUserName,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addCategory,
    editCategory,
    deleteCategory,
    addWallet,
    editWallet,
    deleteWallet,
    transferBetweenWallets,
    updateOpeningBalance,
    resetAllData,
    importData,
    syncLocalToCloud,
    ...totals,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used inside FinanceProvider");
  return context;
}

export type { TransactionType };
