import React, { useState } from 'react';
import { Account, CategoryBudget, Transaction, TransactionType } from '../types/finance';
import { X, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: CategoryBudget[];
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  initialAccountId?: string;
  initialType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  onSave,
  initialAccountId,
  initialType = 'expense',
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(initialAccountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [category, setCategory] = useState(categories[0]?.name || 'Alimentación & Súper');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSave({
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      type,
      amount: parsedAmount,
      category: type === 'transfer' ? 'Transferencia' : category,
      description: description || (type === 'transfer' ? 'Transferencia entre cuentas' : 'Movimiento'),
      merchant: merchant || undefined,
      date,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-zinc-100 mb-4">Registrar Movimiento</h3>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2 mb-4 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              type === 'expense'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Gasto</span>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              type === 'income'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Ingreso</span>
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              type === 'transfer'
                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transferir</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Monto ($ USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">$</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-base font-bold font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Accounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                {type === 'transfer' ? 'Desde Cuenta' : 'Cuenta'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (${a.balance.toFixed(0)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Hacia Cuenta</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (${a.balance.toFixed(0)})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {type !== 'transfer' && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Description & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Descripción / Concepto</label>
              <input
                type="text"
                placeholder="ej: Compra del súper"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Comercio / Entidad</label>
              <input
                type="text"
                placeholder="ej: Walmart, Oxxo, Uber"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
            >
              Confirmar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
