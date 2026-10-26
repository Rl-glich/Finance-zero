import React, { useState, useMemo } from 'react';
import { Account, Transaction, CategoryBudget } from '../types/finance';
import { Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, ShieldCheck, Mail } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: CategoryBudget[];
  onDeleteTransaction: (id: string) => void;
  currency?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  categories,
  onDeleteTransaction,
  currency = 'USD',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      // Account filter
      if (selectedAccount !== 'all' && t.accountId !== selectedAccount && t.toAccountId !== selectedAccount)
        return false;
      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesCategory = t.category.toLowerCase().includes(query);
        const matchesMerchant = t.merchant?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesCategory && !matchesMerchant) return false;
      }
      return true;
    });
  }, [transactions, selectedType, selectedAccount, selectedCategory, searchTerm]);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">Estados de Cuenta & Movimientos</h3>
          <p className="text-xs text-zinc-400">
            {filteredTransactions.length} de {transactions.length} registros
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type tabs */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedType === 'all' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedType === 'expense' ? 'bg-rose-950/60 text-rose-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Gastos
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedType === 'income' ? 'bg-emerald-950/60 text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => setSelectedType('transfer')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedType === 'transfer' ? 'bg-cyan-950/60 text-cyan-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Transfers
            </button>
          </div>
        </div>
      </div>

      {/* Search and Secondary Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por concepto o comercio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No se encontraron movimientos con los filtros seleccionados.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const account = accountMap.get(tx.accountId);
            const toAccount = tx.toAccountId ? accountMap.get(tx.toAccountId) : null;

            return (
              <div
                key={tx.id}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-zinc-800/40 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon depending on type */}
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                        : tx.type === 'expense'
                        ? 'bg-rose-950/50 text-rose-400 border border-rose-800/40'
                        : 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/40'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.type === 'expense' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
                        {tx.description}
                      </h4>
                      {tx.isBankSynced && (
                        <span
                          title="Sincronizado vía API bancaria segura"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-emerald-400 border border-zinc-700"
                        >
                          <ShieldCheck className="w-2.5 h-2.5" />
                          API
                        </span>
                      )}
                      {tx.sourceEmailId && (
                        <span
                          title="Detectado vía Gmail"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-amber-400 border border-zinc-700"
                        >
                          <Mail className="w-2.5 h-2.5" />
                          Gmail
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{tx.category}</span>
                      <span>•</span>
                      <span className="text-zinc-500 truncate max-w-[130px]">
                        {account?.name || 'Cuenta'}
                        {toAccount ? ` ➔ ${toAccount.name}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                  <div>
                    <span
                      className={`text-xs sm:text-sm font-bold font-mono tabular-nums block ${
                        tx.type === 'income'
                          ? 'text-emerald-400'
                          : tx.type === 'expense'
                          ? 'text-rose-400'
                          : 'text-cyan-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}$
                      {tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{currency}</span>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Eliminar movimiento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
