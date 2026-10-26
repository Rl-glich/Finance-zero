import React, { useState } from 'react';
import { Account, BankProvider, InstitutionType, Transaction } from '../types/finance';
import { getAllBanks, saveCustomBank, simulateSecureBankSync, BankSyncResult } from '../services/bankSync';
import { ShieldCheck, Lock, RefreshCw, X, CheckCircle2, Key, Landmark, Building2, Plus, Sparkles } from 'lucide-react';

interface BankSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAddSyncedTransactions: (transactions: Transaction[], accountId: string) => void;
}

export const BankSyncModal: React.FC<BankSyncModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddSyncedTransactions,
}) => {
  if (!isOpen) return null;

  const [availableBanks, setAvailableBanks] = useState<BankProvider[]>(getAllBanks);
  const [selectedBankId, setSelectedBankId] = useState<string>(availableBanks[0]?.id || 'scotiabank');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'cooperative'>('all');

  // New Custom Institution Form Toggle
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<InstitutionType>('cooperative');
  const [customCountry, setCustomCountry] = useState('Local');
  const [customColor, setCustomColor] = useState('#00873D');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [lastSyncResult, setLastSyncResult] = useState<BankSyncResult | null>(null);

  const selectedBank = availableBanks.find((b) => b.id === selectedBankId) || availableBanks[0];

  const filteredBanks = availableBanks.filter((b) => {
    if (filterType === 'bank') return b.institutionType !== 'cooperative';
    if (filterType === 'cooperative') return b.institutionType === 'cooperative';
    return true;
  });

  const handleCreateCustomInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newInst: BankProvider = {
      id: `inst-${Date.now()}`,
      name: customName.trim(),
      code: customName.trim().toUpperCase().slice(0, 8),
      country: customCountry || (customType === 'cooperative' ? 'Cooperativa Local' : 'Banco Local'),
      color: customColor,
      logoText: customName.trim().slice(0, 5).toUpperCase(),
      apiProtocol: customType === 'cooperative' ? 'Manual-Coop' : 'DirectBank-OAuth2',
      institutionType: customType,
      isCustom: true,
    };

    saveCustomBank(newInst);
    const updated = getAllBanks();
    setAvailableBanks(updated);
    setSelectedBankId(newInst.id);
    setCustomName('');
    setShowAddCustom(false);
  };

  const handleStartSync = async () => {
    if (!selectedAccountId) return;
    setIsSyncing(true);
    setSyncStatusMsg(`Estableciendo túnel cifrado TLS 1.3 con API de ${selectedBank.name}...`);

    try {
      setTimeout(() => {
        setSyncStatusMsg('Verificando certificado y token OpenBanking PSD2...');
      }, 500);

      const result = await simulateSecureBankSync(selectedBankId, selectedAccountId);
      setLastSyncResult(result);
      setSyncStatusMsg(`Sincronización completada. ${result.transactionsFetched.length} movimientos detectados.`);
      onAddSyncedTransactions(result.transactionsFetched, selectedAccountId);
    } catch (err: any) {
      setSyncStatusMsg('Error en el protocolo de enlace.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & E2EE Badge */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">Bancos & Cooperativas de Ahorro</h3>
            <p className="text-xs text-zinc-400">Sincronización cifrada de extremo a extremo (E2EE)</p>
          </div>
        </div>

        {/* Filter Tabs & Add Custom Button */}
        <div className="my-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos ({availableBanks.length})
            </button>
            <button
              onClick={() => setFilterType('bank')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'bank' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Bancos (Scotiabank, BBVA...)
            </button>
            <button
              onClick={() => setFilterType('cooperative')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'cooperative' ? 'bg-emerald-950/80 text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cooperativas (Coopsano...)
            </button>
          </div>

          <button
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddCustom ? 'Cerrar formulario' : 'Agregar Banco / Coop'}</span>
          </button>
        </div>

        {/* Add Custom Institution Form */}
        {showAddCustom && (
          <form
            onSubmit={handleCreateCustomInstitution}
            className="mb-4 p-4 rounded-xl bg-zinc-950 border border-zinc-700/80 space-y-3 animate-fadeIn"
          >
            <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Registrar Nueva Entidad Financiera o Cooperativa</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Scotiabank, Cooperativa Coopsano, etc."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Tipo de Entidad</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as InstitutionType)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="cooperative">Cooperativa de Ahorro y Crédito</option>
                  <option value="bank">Banco Comercial / Múltiple</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Guardar Entidad
              </button>
            </div>
          </form>
        )}

        {/* Institutions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {filteredBanks.map((bank) => {
            const isSelected = selectedBankId === bank.id;
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => setSelectedBankId(bank.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                  isSelected
                    ? 'bg-zinc-800 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: bank.color }}
                  >
                    {bank.logoText}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-zinc-200 block truncate">{bank.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {bank.institutionType === 'cooperative' ? 'Cooperativa' : 'Banco'} • {bank.country}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Target account */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Vincular con Cuenta Local KuroFinance
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.bankName} - Saldo: ${a.balance.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Sync Action */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-zinc-300">
                {selectedBank.name} ({selectedBank.institutionType === 'cooperative' ? 'Cooperativa' : 'Banco'})
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              {selectedBank.apiProtocol}
            </span>
          </div>

          {syncStatusMsg && (
            <p className="text-xs text-zinc-300 mb-3 font-mono bg-zinc-900 p-2 rounded-lg border border-zinc-800 animate-pulse">
              {syncStatusMsg}
            </p>
          )}

          {lastSyncResult && (
            <div className="text-[11px] text-zinc-400 space-y-1 mb-3 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
              <div className="flex justify-between">
                <span>Huella Digital E2EE:</span>
                <span className="font-mono text-zinc-300">{lastSyncResult.encryptionFingerprint}</span>
              </div>
              <div className="flex justify-between">
                <span>Hora de sincronización:</span>
                <span className="font-mono text-zinc-300">{lastSyncResult.syncedAt}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleStartSync}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-lg shadow-emerald-950/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando con Entidad...' : `Sincronizar ${selectedBank.name}`}</span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
