"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Category, FinanceData, Transaction, TransactionType, Wallet } from "@/types/transaction";
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS, INITIAL_TRANSACTIONS, encodeNoteWithOneOff, isOneOffTransaction } from "@/lib/finance";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export type OfflineSyncAction =
  | { id: string; type: "upsert_transaction"; data: Transaction }
  | { id: string; type: "delete_transaction"; targetId: string }
  | { id: string; type: "upsert_wallet"; data: Wallet }
  | { id: string; type: "delete_wallet"; targetId: string }
  | { id: string; type: "upsert_category"; data: Category }
  | { id: string; type: "delete_category"; targetId: string }
  | { id: string; type: "update_profile"; data: { userName?: string; openingBalance?: number } };

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
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncingOffline: boolean;
  flushSyncQueue: () => Promise<void>;
  walletBalances: Record<string, number>;
  getWalletBalance: (id: string) => number;
  updateUserName: (name: string) => Promise<void>;
  addTransaction: (input: Omit<Transaction, "id">) => Promise<void>;
  editTransaction: (id: string, input: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  toggleTransactionOneOff: (id: string) => Promise<void>;
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
  resetAllData: () => Promise<void>;
  importData: (data: FinanceData) => boolean;
  syncLocalToCloud: () => Promise<void>;
};

const STORAGE_KEY = "egp-tracker-data-v3";
const LEGACY_STORAGE_KEY_V2 = "egp-tracker-data-v2";

export function clearGuestData() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
    localStorage.removeItem("egp-tracker-sync-queue-guest");
  } catch (err) {
    console.error("Failed to clear guest data", err);
  }
}

const DEFAULT_DATA: FinanceData = {
  userName: "مستخدم",
  openingBalance: 0,
  wallets: DEFAULT_WALLETS,
  transactions: INITIAL_TRANSACTIONS,
  categories: DEFAULT_CATEGORIES,
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function getCacheKey(userId?: string | null) {
  return userId ? `egp-tracker-user-${userId}` : STORAGE_KEY;
}

function getSyncQueueKey(userId?: string | null) {
  return userId ? `egp-tracker-sync-queue-${userId}` : "egp-tracker-sync-queue-guest";
}

function loadSyncQueue(userId?: string | null): OfflineSyncAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getSyncQueueKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: OfflineSyncAction[], userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getSyncQueueKey(userId), JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save sync queue", e);
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const [data, setData] = useState<FinanceData>({
    userName: "مستخدم جديد",
    openingBalance: 0,
    wallets: DEFAULT_WALLETS,
    transactions: [],
    categories: DEFAULT_CATEGORIES,
  });
  const [ready, setReady] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Track the user ID that is currently loaded into `data` state
  const loadedUserIdRef = useRef<string | null | undefined>(undefined);
  const [dataOwnerId, setDataOwnerId] = useState<string | null | undefined>(undefined);

  // Offline / Network States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  // Helper to save to local cache safely
  const persistLocally = (freshData: FinanceData, targetUserId?: string | null) => {
    try {
      const activeUserId = targetUserId !== undefined ? targetUserId : (userId || null);
      const key = getCacheKey(activeUserId);
      localStorage.setItem(key, JSON.stringify(freshData));
      // Only update the shared STORAGE_KEY for guest users (no userId)
      if (!activeUserId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
      }
    } catch (e) {
      console.error("Local storage persist error", e);
    }
  };

  // Enqueue an action to be synchronized when back online
  const enqueueOfflineAction = (action: OfflineSyncAction) => {
    const currentQueue = loadSyncQueue(userId);

    // Filter out previous pending action for the exact same entity to avoid redundant ops
    const filtered = currentQueue.filter((item) => {
      if (item.type === action.type) {
        if ("targetId" in item && "targetId" in action) {
          return item.targetId !== action.targetId;
        }
        if ("data" in item && "data" in action && "id" in item.data && "id" in action.data) {
          return item.data.id !== action.data.id;
        }
      }
      return true;
    });

    const updated = [...filtered, action];
    saveSyncQueue(updated, userId);
    setPendingSyncCount(updated.length);
  };

  // Flush pending offline changes to Supabase
  const flushSyncQueue = async () => {
    if (!userId || !supabase || isSyncingOffline) return;

    const queue = loadSyncQueue(userId);
    if (queue.length === 0) {
      setPendingSyncCount(0);
      return;
    }

    setIsSyncingOffline(true);
    const failedQueue: OfflineSyncAction[] = [];

    for (const action of queue) {
      try {
        if (action.type === "upsert_transaction") {
          const tx = action.data;
          const { error } = await supabase.from("transactions").upsert({
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
          if (error) failedQueue.push(action);
        } else if (action.type === "delete_transaction") {
          const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", action.targetId)
            .eq("user_id", userId);
          if (error) failedQueue.push(action);
        } else if (action.type === "upsert_wallet") {
          const w = action.data;
          const { error } = await supabase.from("wallets").upsert({
            id: w.id,
            user_id: userId,
            name: w.name,
            type: w.type,
            initial_balance: w.initialBalance,
            color: w.color,
            icon: w.icon || "wallet",
          });
          if (error) failedQueue.push(action);
        } else if (action.type === "delete_wallet") {
          const { error } = await supabase
            .from("wallets")
            .delete()
            .eq("id", action.targetId)
            .eq("user_id", userId);
          if (error) failedQueue.push(action);
        } else if (action.type === "upsert_category") {
          const c = action.data;
          const { error } = await supabase.from("categories").upsert({
            id: c.id,
            user_id: userId,
            name: c.name,
            type: c.type,
            color: c.color,
            icon: c.icon || "tag",
            budget: c.budget || null,
          });
          if (error) failedQueue.push(action);
        } else if (action.type === "delete_category") {
          const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", action.targetId)
            .eq("user_id", userId);
          if (error) failedQueue.push(action);
        } else if (action.type === "update_profile") {
          const { error } = await supabase.from("profiles").upsert({
            id: userId,
            user_name: action.data.userName,
            opening_balance: action.data.openingBalance,
          });
          if (error) failedQueue.push(action);
        }
      } catch (err) {
        console.error("Failed executing sync action", action, err);
        failedQueue.push(action);
      }
    }

    saveSyncQueue(failedQueue, userId);
    setPendingSyncCount(failedQueue.length);
    setIsSyncingOffline(false);
  };

  // 1. Initial Load & Account Switch / Logout Lifecycle
  useEffect(() => {
    // Wait until auth state has fully resolved to avoid treating logged-in users as guests
    if (authLoading) return;

    const activeUserId = userId || null;
    const isAccountSwitch =
      loadedUserIdRef.current !== undefined && loadedUserIdRef.current !== activeUserId;

    if (isAccountSwitch) {
      setReady(false);
      // When logging in, completely purge guest operations from local storage
      // so operations done while not logged in NEVER carry over or get counted.
      if (activeUserId) {
        clearGuestData();
      }
    }

    try {
      const activeKey = getCacheKey(activeUserId);
      let saved: string | null = null;

      if (activeUserId) {
        // Logged-in user: load strictly their own isolated cache
        saved = localStorage.getItem(activeKey);
      } else {
        // Guest user: load from generic guest cache (if any)
        saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY_V2);
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        setData({
          userName: parsed.userName || (activeUserId ? "مستخدم جديد" : "مستخدم"),
          openingBalance: Number(parsed.openingBalance) || 0,
          wallets: parsed.wallets && parsed.wallets.length > 0 ? parsed.wallets : DEFAULT_WALLETS,
          transactions: parsed.transactions || [],
          categories:
            parsed.categories && parsed.categories.length > 0
              ? parsed.categories.map((c: Category) => {
                  let b = c.budget ? Number(c.budget) : undefined;
                  if (
                    (c.id.startsWith("food") && b === 4000) ||
                    (c.id.startsWith("transport") && b === 1500) ||
                    (c.id.startsWith("shopping") && b === 2000) ||
                    (c.id.startsWith("bills") && b === 2500) ||
                    (c.id.startsWith("health") && b === 1000)
                  ) {
                    b = undefined;
                  }
                  return { ...c, budget: b };
                })
              : DEFAULT_CATEGORIES,
        });
      } else {
        // Fresh start: no previous cache for this identity
        setData({
          userName: activeUserId
            ? ((user?.user_metadata?.user_name as string) || "مستخدم جديد")
            : "مستخدم",
          openingBalance: 0,
          wallets: DEFAULT_WALLETS,
          transactions: [],
          categories: DEFAULT_CATEGORIES,
        });
      }
    } catch (error) {
      console.error("Could not load local finance data", error);
    } finally {
      loadedUserIdRef.current = activeUserId;
      setDataOwnerId(activeUserId);
      setReady(true);
      if (!activeUserId || !isConfigured) {
        setIsLoadingData(false);
      }
    }
  }, [userId, authLoading, isConfigured]);

  // 2. Network Status & Auto-Sync Listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    setPendingSyncCount(loadSyncQueue(userId).length);

    const handleOnline = () => {
      setIsOnline(true);
      // Flush queue automatically when network is back
      flushSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userId]);

  // 3. Always persist any state changes to Local Storage
  useEffect(() => {
    const activeUserId = userId || null;
    // CRITICAL: Only persist if ready, auth has resolved,
    // AND dataOwnerId strictly matches activeUserId (prevents saving guest data into a user's cache upon login)
    if (ready && !authLoading && dataOwnerId === activeUserId) {
      persistLocally(data, activeUserId);
    }
  }, [data, ready, userId, authLoading, dataOwnerId]);

  // 4. Supabase Cloud Sync & Self-Healing (With Offline-First Resilience)
  useEffect(() => {
    if (authLoading || !userId || !supabase || !isConfigured) return;
    if (dataOwnerId !== userId) return;

    // If completely offline on boot, skip cloud fetch to avoid hanging; local data is already ready
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsLoadingData(false);
      return;
    }

    let isMounted = true;

    async function fetchCloudData() {
      setIsLoadingData(true);
      try {
        // First: flush any pending offline writes before fetching to prevent overwriting
        await flushSyncQueue();

        // Read local cached data strictly for THIS user
        const cacheKey = getCacheKey(userId);
        const cachedRaw = localStorage.getItem(cacheKey);
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

        const defaultName = (user?.user_metadata?.user_name as string) || "مستخدم جديد";

        // If profile doesn't exist yet in Supabase, create it
        if (!profile) {
          await supabase!.from("profiles").upsert({
            id: userId,
            user_name: defaultName,
            opening_balance: 0,
          });
        }

        // B. Categories
        const { data: categoriesData } = await supabase!
          .from("categories")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        let loadedCategories: Category[] = (categoriesData || []).map((c) => {
          let b = c.budget ? Number(c.budget) : undefined;
          if (
            (c.id.startsWith("food") && b === 4000) ||
            (c.id.startsWith("transport") && b === 1500) ||
            (c.id.startsWith("shopping") && b === 2000) ||
            (c.id.startsWith("bills") && b === 2500) ||
            (c.id.startsWith("health") && b === 1000)
          ) {
            b = undefined;
          }
          return {
            id: String(c.id),
            name: c.name,
            type: c.type,
            color: c.color,
            icon: c.icon || "tag",
            budget: b,
          };
        });

        // If user has no categories in Supabase, seed clean defaults
        if (loadedCategories.length === 0) {
          const toSeed = DEFAULT_CATEGORIES;

          loadedCategories = toSeed.map((c) => ({
            ...c,
            id: `${c.id}_${userId}`,
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

        // If user has no wallets in Supabase, seed clean defaults
        if (loadedWallets.length === 0) {
          const toSeed = DEFAULT_WALLETS;

          loadedWallets = toSeed.map((w) => ({
            ...w,
            id: `${w.id}_${userId}`,
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

        const validWalletIds = new Set(loadedWallets.map((w) => w.id));

        // Purge any orphan/guest transactions that leaked into Supabase (e.g. wallet_id = "cash")
        const rawTxs = transactionsData || [];
        const orphanGuestTxs = rawTxs.filter(
          (t) =>
            !t.wallet_id ||
            !validWalletIds.has(String(t.wallet_id))
        );

        if (orphanGuestTxs.length > 0) {
          for (const orphan of orphanGuestTxs) {
            await supabase!.from("transactions").delete().eq("id", orphan.id).eq("user_id", userId);
          }
        }

        const cleanTxs = rawTxs.filter(
          (t) => t.wallet_id && validWalletIds.has(String(t.wallet_id))
        );

        const loadedTransactions: Transaction[] = cleanTxs.map((t) => ({
          id: String(t.id),
          title: t.title,
          amount: Number(t.amount),
          type: t.type,
          categoryId: String(t.category_id || ""),
          walletId: t.wallet_id ? String(t.wallet_id) : undefined,
          toWalletId: t.to_wallet_id ? String(t.to_wallet_id) : undefined,
          date: t.date,
          note: t.note || undefined,
          isOneOff: Boolean((t as { is_one_off?: boolean }).is_one_off || (t.note && t.note.includes("[استثنائي]"))),
        }));

        if (!isMounted) return;

        const mergedData: FinanceData = {
          userName: profile?.user_name || defaultName,
          openingBalance: Number(profile?.opening_balance ?? 0),
          wallets: loadedWallets,
          categories: loadedCategories,
          transactions: loadedTransactions,
        };

        setData(mergedData);
        setDataOwnerId(userId);
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
    const encodedNote = encodeNoteWithOneOff(input.note, input.isOneOff);
    const newTx: Transaction = {
      ...input,
      id: newId,
      walletId: input.walletId || data.wallets[0]?.id || "cash",
      note: encodedNote,
      isOneOff: Boolean(input.isOneOff),
    };

    // 1. Update state
    const nextTransactions = [newTx, ...data.transactions];
    const nextData = { ...data, transactions: nextTransactions };
    setData(nextData);

    // 2. Persist locally immediately
    persistLocally(nextData, userId);

    // 3. Persist to Supabase or queue offline
    if (userId && supabase) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_transaction",
          data: newTx,
        });
        return;
      }

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
          note: encodedNote || null,
        });

        if (error) {
          console.warn("Supabase insert failed, queueing offline:", error);
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "upsert_transaction",
            data: newTx,
          });
        }
      } catch (err) {
        console.warn("Network error inserting transaction, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_transaction",
          data: newTx,
        });
      }
    }
  };

  const editTransaction = async (id: string, input: Omit<Transaction, "id">) => {
    const encodedNote = encodeNoteWithOneOff(input.note, input.isOneOff);
    const updatedTx: Transaction = {
      ...input,
      id,
      note: encodedNote,
      isOneOff: Boolean(input.isOneOff),
    };
    const nextTransactions = data.transactions.map((item) =>
      item.id === id ? updatedTx : item
    );
    const nextData = { ...data, transactions: nextTransactions };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_transaction",
          data: updatedTx,
        });
        return;
      }

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
            note: encodedNote || null,
          })
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.warn("Supabase update failed, queueing offline:", error);
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "upsert_transaction",
            data: updatedTx,
          });
        }
      } catch (err) {
        console.warn("Network error updating transaction, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_transaction",
          data: updatedTx,
        });
      }
    }
  };

  const toggleTransactionOneOff = async (id: string) => {
    const target = data.transactions.find((item) => item.id === id);
    if (!target) return;
    const nextIsOneOff = !isOneOffTransaction(target);
    const nextNote = encodeNoteWithOneOff(target.note, nextIsOneOff);
    await editTransaction(id, {
      ...target,
      note: nextNote,
      isOneOff: nextIsOneOff,
    });
  };

  const deleteTransaction = async (id: string) => {
    const nextTransactions = data.transactions.filter((item) => item.id !== id);
    const nextData = { ...data, transactions: nextTransactions };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "delete_transaction",
          targetId: id,
        });
        return;
      }

      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.warn("Supabase delete failed, queueing offline:", error);
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "delete_transaction",
            targetId: id,
          });
        }
      } catch (err) {
        console.warn("Network error deleting transaction, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "delete_transaction",
          targetId: id,
        });
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
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_wallet",
          data: newWallet,
        });
        return;
      }

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
          console.warn("Supabase add wallet failed, queueing offline:", error);
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "upsert_wallet",
            data: newWallet,
          });
        }
      } catch (err) {
        console.warn("Network error inserting wallet, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_wallet",
          data: newWallet,
        });
      }
    }
  };

  const editWallet = async (id: string, input: Partial<Omit<Wallet, "id">>) => {
    let updatedWallet: Wallet | null = null;
    const nextWallets = data.wallets.map((item) => {
      if (item.id === id) {
        updatedWallet = { ...item, ...input };
        return updatedWallet;
      }
      return item;
    });

    const nextData = { ...data, wallets: nextWallets };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase && updatedWallet) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_wallet",
          data: updatedWallet,
        });
        return;
      }

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
          console.warn("Supabase edit wallet failed, queueing offline:", error);
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "upsert_wallet",
            data: updatedWallet,
          });
        }
      } catch (err) {
        console.warn("Network error updating wallet, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_wallet",
          data: updatedWallet,
        });
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
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "delete_wallet",
          targetId: id,
        });
        return { success: true };
      }

      try {
        const { error } = await supabase.from("wallets").delete().eq("id", id).eq("user_id", userId);
        if (error) {
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "delete_wallet",
            targetId: id,
          });
        }
      } catch (err) {
        console.warn("Network error deleting wallet, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "delete_wallet",
          targetId: id,
        });
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
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_category",
          data: newCat,
        });
        return;
      }

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
          console.warn("Supabase add category failed, queueing offline:", error);
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "upsert_category",
            data: newCat,
          });
        }
      } catch (err) {
        console.warn("Network error inserting category, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_category",
          data: newCat,
        });
      }
    }
  };

  const editCategory = async (id: string, input: Partial<Omit<Category, "id">>) => {
    let updatedCat: Category | null = null;
    const nextCategories = data.categories.map((item) => {
      if (item.id === id) {
        const nextBudget = "budget" in input
          ? (input.budget && input.budget > 0 ? Number(input.budget) : undefined)
          : item.budget;
        updatedCat = {
          ...item,
          ...input,
          budget: nextBudget,
        };
        return updatedCat;
      }
      return item;
    });

    const nextData = { ...data, categories: nextCategories };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase && updatedCat) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_category",
          data: updatedCat,
        });
        return;
      }

      try {
        const updatePayload: Record<string, any> = {};
        if (input.name) updatePayload.name = input.name;
        if (input.type) updatePayload.type = input.type;
        if (input.color) updatePayload.color = input.color;
        if ("budget" in input) {
          updatePayload.budget = input.budget && input.budget > 0 ? Number(input.budget) : null;
        }

        const { error } = await supabase
          .from("categories")
          .update(updatePayload)
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.warn("Supabase edit category failed, queueing offline:", error);
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "upsert_category",
            data: updatedCat,
          });
        }
      } catch (err) {
        console.warn("Network error updating category, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "upsert_category",
          data: updatedCat,
        });
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
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "delete_category",
          targetId: id,
        });
        return { success: true };
      }

      try {
        const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", userId);
        if (error) {
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "delete_category",
            targetId: id,
          });
        }
      } catch (err) {
        console.warn("Network error deleting category, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "delete_category",
          targetId: id,
        });
      }
    }

    return { success: true };
  };

  const updateOpeningBalance = async (value: number) => {
    const nextData = { ...data, openingBalance: value };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "update_profile",
          data: { openingBalance: value },
        });
        return;
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ opening_balance: value })
          .eq("id", userId);

        if (error) {
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "update_profile",
            data: { openingBalance: value },
          });
        }
      } catch (err) {
        console.warn("Network error updating balance, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "update_profile",
          data: { openingBalance: value },
        });
      }
    }
  };

  const updateUserName = async (name: string) => {
    const nextData = { ...data, userName: name };
    setData(nextData);
    persistLocally(nextData, userId);

    if (userId && supabase) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "update_profile",
          data: { userName: name },
        });
        return;
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ user_name: name })
          .eq("id", userId);

        if (error) {
          enqueueOfflineAction({
            id: crypto.randomUUID(),
            type: "update_profile",
            data: { userName: name },
          });
        }
      } catch (err) {
        console.warn("Network error updating username, queueing offline:", err);
        enqueueOfflineAction({
          id: crypto.randomUUID(),
          type: "update_profile",
          data: { userName: name },
        });
      }
    }
  };

  const syncLocalToCloud = async () => {
    if (!userId || !supabase) return;
    try {
      // First, flush any actions from the queue
      await flushSyncQueue();

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
      throw err;
    }
  };

  const resetAllData = async () => {
    const cleanCategories = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      id: userId ? `${c.id}_${userId}` : c.id,
    }));
    const cleanWallets = DEFAULT_WALLETS.map((w) => ({
      ...w,
      id: userId ? `${w.id}_${userId}` : w.id,
    }));
    const cleanName = (user?.user_metadata?.user_name as string) || "مستخدم جديد";

    const cleanData: FinanceData = {
      userName: cleanName,
      openingBalance: 0,
      wallets: cleanWallets,
      transactions: [],
      categories: cleanCategories,
    };

    setData(cleanData);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
    if (userId) {
      localStorage.removeItem(getCacheKey(userId));
      localStorage.removeItem(getSyncQueueKey(userId));
      persistLocally(cleanData, userId);

      if (supabase) {
        try {
          // Remove all transactions from cloud for this user
          await supabase.from("transactions").delete().eq("user_id", userId);
          // Reset opening balance
          await supabase.from("profiles").upsert({
            id: userId,
            opening_balance: 0,
            user_name: cleanName,
          });
        } catch (err) {
          console.error("Failed clearing user cloud data", err);
        }
      }
    }
    setPendingSyncCount(0);
  };

  const importData = (imported: FinanceData) => {
    try {
      if (!Array.isArray(imported.transactions) || !Array.isArray(imported.categories)) {
        return false;
      }
      const nextData: FinanceData = {
        userName: imported.userName || "مستخدم",
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
    isOnline,
    pendingSyncCount,
    isSyncingOffline,
    flushSyncQueue,
    walletBalances,
    getWalletBalance,
    updateUserName,
    addTransaction,
    editTransaction,
    deleteTransaction,
    toggleTransactionOneOff,
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
