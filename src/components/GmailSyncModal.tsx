import React, { useState } from 'react';
import { Account, Transaction } from '../types/finance';
import { searchBankingEmails, BankEmailCandidate, googleSignIn } from '../services/googleWorkspace';
import { Mail, Search, CheckCircle2, ArrowRight, X, AlertCircle, RefreshCw } from 'lucide-react';
import { User } from 'firebase/auth';

interface GmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  currentUser: User | null;
  onUserAuth: (user: User) => void;
  onImportTransactions: (transactions: Transaction[]) => void;
}

export const GmailSyncModal: React.FC<GmailSyncModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentUser,
  onUserAuth,
  onImportTransactions,
}) => {
  if (!isOpen) return null;

  const [isScanning, setIsScanning] = useState(false);
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [candidates, setCandidates] = useState<BankEmailCandidate[]>([]);
  const [detectedTransactions, setDetectedTransactions] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [importSuccess, setImportSuccess] = useState(false);

  const handleScanEmails = async () => {
    setErrorMessage('');
    setIsScanning(true);
    setCandidates([]);
    setDetectedTransactions([]);

    try {
      const emails = await searchBankingEmails();
      setCandidates(emails);

      if (emails.length === 0) {
        setErrorMessage('No se encontraron correos recientes de notificaciones bancarias o recibos.');
        setIsScanning(false);
        return;
      }

      // Send to server-side Gemini to parse structured financial movements
      setIsAiParsing(true);
      const parseRes = await fetch('/api/parse-email-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });

      if (!parseRes.ok) {
        throw new Error('Error al analizar correos con IA.');
      }

      const parseData = await parseRes.json();
      setDetectedTransactions(parseData.transactions || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con Gmail.');
    } finally {
      setIsScanning(false);
      setIsAiParsing(false);
    }
  };

  const handleImport = () => {
    if (!detectedTransactions.length) return;

    const newTx: Transaction[] = detectedTransactions.map((dt, idx) => ({
      id: `gmail-${Date.now()}-${idx}`,
      accountId: selectedAccountId,
      type: dt.type === 'income' ? 'income' : 'expense',
      amount: Math.abs(dt.amount),
      category: dt.category || 'Alimentación & Súper',
      description: dt.description || 'Gasto detectado en correo',
      merchant: dt.bankName || dt.description,
      date: dt.date || new Date().toISOString().split('T')[0],
      sourceEmailId: dt.sourceEmailId,
    }));

    onImportTransactions(newTx);
    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
      onClose();
    }, 1500);
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

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">Sincronización con Correo Electrónico (Gmail)</h3>
            <p className="text-xs text-zinc-400">
              Escanea comprobantes y alertas bancarias mediante IA y agrégalos a tus cuentas
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="my-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth prompt if not logged in */}
        {!currentUser ? (
          <div className="my-5 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center">
            <p className="text-xs text-zinc-300 mb-3">
              Conecta tu cuenta de Google para permitir que KuroFinance lea recibos de transferencias, cargos y nóminas con tu autorización.
            </p>
            <button
              onClick={async () => {
                const res = await googleSignIn();
                if (res?.user) onUserAuth(res.user);
              }}
              className="py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-semibold text-xs inline-flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Mail className="w-4 h-4 text-rose-600" />
              <span>Conectar Gmail</span>
            </button>
          </div>
        ) : (
          <div className="my-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <div className="text-xs">
                <span className="text-zinc-400 block">Cuenta autorizada:</span>
                <span className="font-mono text-zinc-200 font-semibold">{currentUser.email}</span>
              </div>
              <button
                type="button"
                disabled={isScanning || isAiParsing}
                onClick={handleScanEmails}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Search className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>
                  {isScanning
                    ? 'Buscando correos...'
                    : isAiParsing
                    ? 'Analizando con IA...'
                    : 'Escanear Recibos'}
                </span>
              </button>
            </div>

            {/* Candidates found */}
            {candidates.length > 0 && (
              <div>
                <span className="text-xs font-medium text-zinc-400 mb-2 block">
                  Correos detectados ({candidates.length}):
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {candidates.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px]"
                    >
                      <div className="flex justify-between font-medium text-zinc-200 truncate">
                        <span className="truncate">{c.subject}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate">{c.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted transactions */}
            {detectedTransactions.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-300">
                    Movimientos identificados por KuroAI ({detectedTransactions.length})
                  </span>
                </div>

                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {detectedTransactions.map((dt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-zinc-200 block truncate">{dt.description}</span>
                        <span className="text-[10px] text-zinc-400">
                          {dt.date} • {dt.category} {dt.bankName ? `(${dt.bankName})` : ''}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold ml-2 ${
                          dt.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {dt.type === 'income' ? '+' : '-'}${dt.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Asignar estos movimientos a la cuenta:
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.bankName})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleImport}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Importar a mis Cuentas</span>
                </button>
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-700 text-xs text-emerald-200 text-center font-medium">
                ¡Movimientos importados exitosamente!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
