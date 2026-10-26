import React, { useState, useEffect } from 'react';
import { Account, AccountType, InstitutionType } from '../types/finance';
import { getAllBanks, saveCustomBank } from '../services/bankSync';
import { X, Building2, Landmark, Check, Trash2, Palette } from 'lucide-react';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null; // null if creating new
  onSave: (account: Account) => void;
  onDelete?: (accountId: string) => void;
}

const PRESET_COLORS = [
  '#EC111A', // Scotiabank Red
  '#00873D', // Coopsano Green
  '#004481', // BBVA Blue
  '#820AD1', // Nu Purple
  '#3B82F6', // Cobalt Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const isEditing = !!account;

  const [name, setName] = useState(account?.name || '');
  const [bankName, setBankName] = useState(account?.bankName || 'Scotiabank');
  const [institutionType, setInstitutionType] = useState<InstitutionType>(account?.institutionType || 'bank');
  const [accountType, setAccountType] = useState<AccountType>(account?.type || 'checking');
  const [balance, setBalance] = useState(account ? account.balance.toString() : '0.00');
  const [currency, setCurrency] = useState(account?.currency || 'USD');
  const [color, setColor] = useState(account?.color || '#EC111A');
  const [accountNumberMasked, setAccountNumberMasked] = useState(account?.accountNumberMasked || '•••• ' + Math.floor(1000 + Math.random() * 9000));
  const [creditLimit, setCreditLimit] = useState(account?.creditLimit?.toString() || '2500');

  // Load banks and coops
  const availableBanks = getAllBanks();

  const handleSelectQuickInstitution = (instName: string, type: InstitutionType, defaultColor: string) => {
    setBankName(instName);
    setInstitutionType(type);
    setColor(defaultColor);
    if (!name || name === 'Mi Cuenta' || name.includes('Scotiabank') || name.includes('Coopsano')) {
      setName(`${instName} ${accountType === 'savings' ? 'Ahorros' : accountType === 'credit' ? 'Tarjeta' : 'Cuenta'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = parseFloat(balance) || 0;
    const parsedCreditLimit = accountType === 'credit' ? parseFloat(creditLimit) || 3000 : undefined;

    // Check if new custom institution
    const existing = availableBanks.find((b) => b.name.toLowerCase() === bankName.trim().toLowerCase());
    if (!existing && bankName.trim()) {
      saveCustomBank({
        id: `custom-${Date.now()}`,
        name: bankName.trim(),
        code: bankName.trim().toUpperCase().slice(0, 8),
        country: institutionType === 'cooperative' ? 'Cooperativa Local' : 'Banco Local',
        color,
        logoText: bankName.trim().slice(0, 4).toUpperCase(),
        apiProtocol: institutionType === 'cooperative' ? 'Manual-Coop' : 'DirectBank-OAuth2',
        institutionType,
        isCustom: true,
      });
    }

    const updatedAccount: Account = {
      id: account?.id || `acc-${Date.now()}`,
      name: name.trim() || `${bankName} Cuenta`,
      bankName: bankName.trim(),
      bankCode: existing ? existing.code : bankName.slice(0, 4).toLowerCase(),
      type: accountType,
      balance: parsedBalance,
      currency,
      color,
      accountNumberMasked: accountNumberMasked || '•••• ' + Math.floor(1000 + Math.random() * 9000),
      creditLimit: parsedCreditLimit,
      isSynced: account?.isSynced ?? true,
      e2eEncrypted: true,
      institutionType,
    };

    onSave(updatedAccount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="p-2 rounded-xl text-white shadow-md"
            style={{ backgroundColor: color }}
          >
            {institutionType === 'cooperative' ? (
              <Building2 className="w-5 h-5" />
            ) : (
              <Landmark className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">
              {isEditing ? 'Editar Cuenta o Institución' : 'Agregar Nueva Cuenta o Cooperativa'}
            </h3>
            <p className="text-xs text-zinc-400">
              Configura cualquier banco, cooperativa de ahorro y crédito o neobanco
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick suggestions: Scotiabank & Coopsano first! */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Instituciones Rápidas
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectQuickInstitution('Scotiabank', 'bank', '#EC111A')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  bankName === 'Scotiabank'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#EC111A]"></span>
                <span>Scotiabank</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickInstitution('Cooperativa Coopsano', 'cooperative', '#00873D')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  bankName === 'Cooperativa Coopsano'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#00873D]"></span>
                <span>Coopsano (Cooperativa)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickInstitution('BBVA', 'bank', '#004481')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  bankName === 'BBVA'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#004481]"></span>
                <span>BBVA</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickInstitution('Nu Bank', 'bank', '#820AD1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  bankName === 'Nu Bank'
                    ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#820AD1]"></span>
                <span>Nu</span>
              </button>
            </div>
          </div>

          {/* Institution Type: Banco vs Cooperativa */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setInstitutionType('bank')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                institutionType === 'bank'
                  ? 'bg-zinc-800 border-zinc-600 text-zinc-100 shadow-sm'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Landmark className="w-4 h-4 text-cyan-400" />
              <span>Banco Tradicional</span>
            </button>
            <button
              type="button"
              onClick={() => setInstitutionType('cooperative')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                institutionType === 'cooperative'
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200 shadow-sm'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Cooperativa de Ahorro</span>
            </button>
          </div>

          {/* Bank / Cooperative Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nombre de la Entidad o Cooperativa
            </label>
            <input
              type="text"
              required
              placeholder="ej: Scotiabank, Cooperativa Coopsano, etc."
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Account Display Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nombre Personalizado de la Cuenta
            </label>
            <input
              type="text"
              required
              placeholder="ej: Scotiabank Nómina, Coopsano Aportaciones, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Account Type & Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Tipo de Cuenta
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="checking">Cuenta Corriente / Cheques</option>
                <option value="savings">Cuenta de Ahorros / Programado</option>
                <option value="credit">Tarjeta de Crédito</option>
                <option value="investment">Inversión / Aportaciones Coop</option>
                <option value="cash">Efectivo / Caja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Saldo Actual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-zinc-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-7 pr-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Credit limit if credit card */}
          {accountType === 'credit' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Límite de Crédito Aprobado ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Currency & Masked Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($ - Dólar)</option>
                <option value="DOP">DOP (RD$ - Peso Dominicano)</option>
                <option value="MXN">MXN ($ - Peso Mexicano)</option>
                <option value="COP">COP ($ - Peso Colombiano)</option>
                <option value="CLP">CLP ($ - Peso Chileno)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Número Enmascarado
              </label>
              <input
                type="text"
                placeholder="•••• 1234"
                value={accountNumberMasked}
                onChange={(e) => setAccountNumberMasked(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Color palette */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Color Distintivo</span>
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-800">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar la cuenta "${name}"?`)) {
                    onDelete(account!.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-md"
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
