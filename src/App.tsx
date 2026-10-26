import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  Account,
  Transaction,
  CategoryBudget,
  SavingsGoal,
  SavingsNotification,
} from './types/finance';
import {
  getStoredAccounts,
  saveAccounts,
  getStoredTransactions,
  saveTransactions,
  getStoredCategories,
  saveCategories,
  getStoredGoals,
  saveGoals,
  getStoredNotifications,
  saveNotifications,
} from './services/storage';
import { initAuth, logout } from './services/googleWorkspace';
import { AccountCard } from './components/AccountCard';
import { ExpenseDonutChart } from './components/ExpenseDonutChart';
import { CashFlowTrendChart } from './components/CashFlowTrendChart';
import { SavingsMeter } from './components/SavingsMeter';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BankSyncModal } from './components/BankSyncModal';
import { ExportModal } from './components/ExportModal';
import { GmailSyncModal } from './components/GmailSyncModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { NotificationsModal } from './components/NotificationsModal';
import { EditAccountModal } from './components/EditAccountModal';
import {
  Sparkles,
  Plus,
  ArrowRightLeft,
  FileSpreadsheet,
  Mail,
  Bell,
  Lock,
  Wifi,
  WifiOff,
  Landmark,
  PieChart,
  Wallet,
  Check,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export default function App() {
  // Financial State
  const [accounts, setAccounts] = useState<Account[]>(getStoredAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions);
  const [categories, setCategories] = useState<CategoryBudget[]>(getStoredCategories);
  const [goals, setGoals] = useState<SavingsGoal[]>(getStoredGoals);
  const [notifications, setNotifications] = useState<SavingsNotification[]>(getStoredNotifications);

  // Google Workspace Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Network State (Offline/Online)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // UI Modals & Drawers
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [preselectedAccountId, setPreselectedAccountId] = useState<string | undefined>(undefined);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listen to offline/online events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Persist State to LocalStorage (Offline-First)
  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Recalculate spent per category dynamically
  useEffect(() => {
    const spentMap: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'expense') {
        spentMap[tx.category] = (spentMap[tx.category] || 0) + tx.amount;
      }
    }

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        spent: spentMap[cat.name] || 0,
      }))
    );
  }, [transactions]);

  // Total balance computation
  const totalNetWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Handlers for Transactions & Transfers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update Account Balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (newTx.type === 'transfer') {
          if (acc.id === newTx.accountId) {
            return { ...acc, balance: acc.balance - newTx.amount };
          }
          if (acc.id === newTx.toAccountId) {
            return { ...acc, balance: acc.balance + newTx.amount };
          }
        } else if (acc.id === newTx.accountId) {
          if (newTx.type === 'expense') {
            return { ...acc, balance: acc.balance - newTx.amount };
          }
          if (newTx.type === 'income') {
            return { ...acc, balance: acc.balance + newTx.amount };
          }
        }
        return acc;
      })
    );

    showToast(
      newTx.type === 'transfer'
        ? `Transferencia de $${newTx.amount} registrada con éxito`
        : `${newTx.type === 'income' ? 'Ingreso' : 'Gasto'} de $${newTx.amount} registrado`
    );
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // Reverse balance effect
    setAccounts((prev) =>
      prev.map((acc) => {
        if (tx.type === 'transfer') {
          if (acc.id === tx.accountId) return { ...acc, balance: acc.balance + tx.amount };
          if (acc.id === tx.toAccountId) return { ...acc, balance: acc.balance - tx.amount };
        } else if (acc.id === tx.accountId) {
          if (tx.type === 'expense') return { ...acc, balance: acc.balance + tx.amount };
          if (tx.type === 'income') return { ...acc, balance: acc.balance - tx.amount };
        }
        return acc;
      })
    );

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Movimiento eliminado y saldo restaurado');
  };

  const handleApplyTransfer = (fromId: string, toId: string, amount: number, description?: string) => {
    handleSaveTransaction({
      accountId: fromId,
      toAccountId: toId,
      type: 'transfer',
      amount,
      category: 'Transferencia',
      description: description || 'Transferencia vía KuroAI',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleApplyAccountCreate = (acc: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...acc,
      id: `acc-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAcc]);
    showToast(`Cuenta "${newAcc.name}" creada con éxito.`);
  };

  const handleOpenEditAccount = (acc?: Account) => {
    setAccountToEdit(acc || null);
    setIsEditAccountModalOpen(true);
  };

  const handleSaveAccount = (updatedAccount: Account) => {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === updatedAccount.id);
      if (exists) {
        return prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a));
      }
      return [...prev, updatedAccount];
    });
    showToast(`Cuenta "${updatedAccount.name}" guardada con éxito`);
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    showToast('Cuenta eliminada');
  };

  const handleApplyBudgetAdjust = (categoryName: string, newLimit: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.name.toLowerCase() === categoryName.toLowerCase() ? { ...c, monthlyLimit: newLimit } : c))
    );
    showToast(`Presupuesto de "${categoryName}" actualizado a $${newLimit}/mes`);
  };

  const handleApplySavingsGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
    };
    setGoals((prev) => [...prev, newGoal]);
    showToast(`Meta de ahorro "${newGoal.name}" creada.`);
  };

  const handleAddFundsToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g))
    );
    showToast(`+$${amount} aportados a la meta.`);
  };

  const handleAddSyncedTransactions = (newTxs: Transaction[], accountId: string) => {
    setTransactions((prev) => [...newTxs, ...prev]);

    // Adjust balance for the newly synced transactions
    const netChange = newTxs.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              balance: acc.balance + netChange,
              lastSyncAt: new Date().toISOString(),
              isSynced: true,
            }
          : acc
      )
    );

    showToast(`¡${newTxs.length} movimientos sincronizados vía API bancaria segura!`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/60 text-zinc-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-slideUp">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-zinc-950 shadow-lg shadow-emerald-950/40 font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-100">
                KuroFinance
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <ShieldCheck className="w-3 h-3" />
                E2EE Activo
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Finanzas Personales & Ahorro Inteligente</p>
          </div>
        </div>

        {/* Right Status & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline / Online indicator */}
          <div
            title={isOnline ? 'En línea' : 'Modo Sin Conexión (Offline 100% Funcional)'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono border ${
              isOnline
                ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline text-[11px]">En línea</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Offline</span>
              </>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title="Notificaciones de Ahorro"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* KuroAI Trigger Button */}
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KuroAI Asistente</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* User Signout or Profile */}
          {currentUser && (
            <button
              onClick={() => logout()}
              title={`Cerrar sesión de ${currentUser.email}`}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Balance Banner & Quick Actions */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/5 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Patrimonio Total Consolidado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight tabular-nums text-zinc-100">
                  ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-mono text-zinc-400 font-semibold">USD</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                <span>{accounts.length} cuentas activas</span>
                <span>•</span>
                <span>Cifrado E2EE localmente</span>
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setPreselectedAccountId(undefined);
                  setIsTxModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Movimiento</span>
              </button>

              <button
                onClick={() => setIsBankModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700/80 transition-colors cursor-pointer"
              >
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>Sincronizar Bancos</span>
              </button>

              <button
                onClick={() => setIsGmailModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700/80 transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Escanear Gmail</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700/80 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Exportar CSV / Sheets</span>
              </button>
            </div>
          </div>
        </div>

        {/* Accounts Cards Section */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Mis Cuentas, Bancos & Cooperativas</span>
                <span className="text-[11px] font-mono text-zinc-400">({accounts.length})</span>
              </h2>
              <p className="text-xs text-zinc-400">Acceso rápido, edición de nombres y movimientos protegidos</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEditAccount()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer border border-zinc-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Banco / Cooperativa</span>
              </button>

              <button
                onClick={() => {
                  setPreselectedAccountId(accounts[0]?.id);
                  setIsTxModalOpen(true);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transferir</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onTransferClick={(id) => {
                  setPreselectedAccountId(id);
                  setIsTxModalOpen(true);
                }}
                onEditClick={(acc) => handleOpenEditAccount(acc)}
                onSyncClick={() => setIsBankModalOpen(true)}
              />
            ))}
          </div>
        </div>

        {/* Visual Analytics & Savings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart */}
          <div className="lg:col-span-6">
            <ExpenseDonutChart transactions={transactions} categories={categories} />
          </div>

          {/* Cash Flow Trend Chart */}
          <div className="lg:col-span-6">
            <CashFlowTrendChart transactions={transactions} />
          </div>
        </div>

        {/* Savings Goals & Warnings */}
        <div>
          <SavingsMeter
            goals={goals}
            categories={categories}
            onAddFunds={handleAddFundsToGoal}
            onNewGoal={handleApplySavingsGoal}
          />
        </div>

        {/* Statements & Detailed Transactions */}
        <div>
          <TransactionList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-6 px-4 text-center text-xs text-zinc-500">
        <p>
          KuroFinance — Cifrado de Extremo a Extremo (AES-GCM 256) • Soporte Offline Completo • Google Workspace
        </p>
      </footer>

      {/* Modals & AI Assistant */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSave={handleSaveTransaction}
        initialAccountId={preselectedAccountId}
      />

      <BankSyncModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        accounts={accounts}
        onAddSyncedTransactions={handleAddSyncedTransactions}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        goals={goals}
        currentUser={currentUser}
        onUserAuth={(user) => setCurrentUser(user)}
      />

      <GmailSyncModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        accounts={accounts}
        currentUser={currentUser}
        onUserAuth={(user) => setCurrentUser(user)}
        onImportTransactions={(newTxs) => {
          setTransactions((prev) => [...newTxs, ...prev]);
          showToast(`¡${newTxs.length} recibos importados desde Gmail!`);
        }}
      />

      <NotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          showToast('Notificaciones marcadas como leídas');
        }}
        onDismiss={(id) => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }}
      />

      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        goals={goals}
        onApplyTransaction={handleSaveTransaction}
        onApplyTransfer={handleApplyTransfer}
        onApplyAccountCreate={handleApplyAccountCreate}
        onApplyBudgetAdjust={handleApplyBudgetAdjust}
        onApplySavingsGoal={handleApplySavingsGoal}
      />

      <EditAccountModal
        isOpen={isEditAccountModalOpen}
        onClose={() => setIsEditAccountModalOpen(false)}
        account={accountToEdit}
        onSave={handleSaveAccount}
        onDelete={handleDeleteAccount}
      />
    </div>
  );
}
