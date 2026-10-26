import React from 'react';
import { Account } from '../types/finance';
import { ShieldCheck, ArrowRightLeft, RefreshCw, CreditCard, Wallet, Landmark, Building2, Pencil } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  onTransferClick: (accountId: string) => void;
  onEditClick: (account: Account) => void;
  onSyncClick?: (account: Account) => void;
  isSyncing?: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onTransferClick,
  onEditClick,
  onSyncClick,
  isSyncing = false,
}) => {
  const getAccountTypeLabel = (type: Account['type']) => {
    switch (type) {
      case 'checking':
        return 'Cuenta Corriente';
      case 'savings':
        return 'Ahorro & Renta';
      case 'credit':
        return 'Tarjeta de Crédito';
      case 'cash':
        return 'Efectivo';
      case 'investment':
        return 'Inversión / Aportes';
      default:
        return 'Cuenta';
    }
  };

  const getAccountIcon = () => {
    if (account.institutionType === 'cooperative') {
      return <Building2 className="w-4 h-4 text-emerald-400" />;
    }
    if (account.type === 'credit') {
      return <CreditCard className="w-4 h-4 text-zinc-300" />;
    }
    if (account.type === 'cash') {
      return <Wallet className="w-4 h-4 text-zinc-300" />;
    }
    return <Landmark className="w-4 h-4 text-zinc-300" />;
  };

  const isCredit = account.type === 'credit';
  const creditLimit = account.creditLimit || 3000;
  const creditUsed = Math.abs(Math.min(0, account.balance));
  const creditPct = Math.min(100, (creditUsed / creditLimit) * 100);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-zinc-700 transition-all shadow-lg flex flex-col justify-between">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: account.color || '#3B82F6' }}
      />

      <div>
        {/* Header with bank tag and badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              {getAccountIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase block">
                  {getAccountTypeLabel(account.type)}
                </span>
                {account.institutionType === 'cooperative' && (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Coop
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-zinc-100 truncate max-w-[155px]" title={account.name}>
                {account.name}
              </h4>
            </div>
          </div>

          {/* Edit & Privacy Badges */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditClick(account)}
              title="Editar nombre, saldo o institución"
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-mono text-emerald-400 font-medium">E2EE</span>
            </div>
          </div>
        </div>

        {/* Bank / Cooperative Subtitle */}
        <div className="text-[11px] text-zinc-400 truncate mb-2">
          {account.bankName}
        </div>

        {/* Balance Display */}
        <div className="my-2.5">
          <span className="text-[11px] text-zinc-400 block mb-0.5">Saldo Disponible</span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
                account.balance < 0 ? 'text-rose-400' : 'text-zinc-100'
              }`}
            >
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-mono text-zinc-400 font-medium">{account.currency}</span>
          </div>
        </div>

        {/* Credit Card Utilization Bar if credit */}
        {isCredit && (
          <div className="mb-3 p-2 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
              <span>Límite: ${creditLimit.toLocaleString()}</span>
              <span>Uso: {creditPct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  creditPct > 80 ? 'bg-rose-500' : creditPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${creditPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-mono">
          <span>{account.accountNumberMasked}</span>
          {account.isSynced && (
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              API
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {account.isSynced && onSyncClick && (
            <button
              onClick={() => onSyncClick(account)}
              disabled={isSyncing}
              title="Sincronizar cuenta ahora"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          <button
            onClick={() => onTransferClick(account.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
            <span>Mover</span>
          </button>
        </div>
      </div>
    </div>
  );
};
