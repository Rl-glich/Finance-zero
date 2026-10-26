import React, { useState } from 'react';
import { Account, CategoryBudget, SavingsGoal, Transaction } from '../types/finance';
import { generateTransactionsCSV, downloadCSV } from '../services/storage';
import { exportFinancesToGoogleSheets, sendMonthlyFinancialReportEmail, googleSignIn, GoogleSheetsExportResult } from '../services/googleWorkspace';
import { DestructiveConfirmModal } from './DestructiveConfirmModal';
import { FileSpreadsheet, Download, Mail, ExternalLink, X, CheckCircle2, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: CategoryBudget[];
  goals: SavingsGoal[];
  currentUser: User | null;
  onUserAuth: (user: User) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  categories,
  goals,
  currentUser,
  onUserAuth,
}) => {
  if (!isOpen) return null;

  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [sheetsResult, setSheetsResult] = useState<GoogleSheetsExportResult | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Confirmation dialogs
  const [confirmSheetsOpen, setConfirmSheetsOpen] = useState(false);
  const [confirmEmailOpen, setConfirmEmailOpen] = useState(false);

  const monthName = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // 1. CSV Download
  const handleDownloadCSV = () => {
    const csv = generateTransactionsCSV(transactions, accounts);
    const filename = `KuroFinance_Reporte_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
  };

  // 2. Google Auth Trigger
  const handleGoogleAuth = async () => {
    try {
      setErrorMessage('');
      const res = await googleSignIn();
      if (res?.user) {
        onUserAuth(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión con Google.');
    }
  };

  // 3. Confirm & Execute Google Sheets export
  const handleExecuteSheetsExport = async () => {
    setConfirmSheetsOpen(false);
    setIsExportingSheets(true);
    setErrorMessage('');
    try {
      const result = await exportFinancesToGoogleSheets(
        `KuroFinance - Finanzas Personales (${monthName})`,
        transactions,
        accounts,
        categories,
        goals
      );
      setSheetsResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al exportar a Google Sheets.');
    } finally {
      setIsExportingSheets(false);
    }
  };

  // 4. Confirm & Execute Gmail send
  const handleExecuteSendEmail = async () => {
    if (!currentUser?.email) return;
    setConfirmEmailOpen(false);
    setIsSendingEmail(true);
    setErrorMessage('');
    try {
      const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const netSavings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';

      await sendMonthlyFinancialReportEmail(currentUser.email, monthName, {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
      });

      setEmailSentSuccess(true);
      setTimeout(() => setEmailSentSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al enviar el reporte por correo.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Exportar Reportes & Google Workspace</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Descarga en formato CSV o sincroniza con Google Sheets y envía a Gmail
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Option 1: CSV Export */}
          <div className="mb-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">Exportar Reporte a CSV</h4>
              <p className="text-[11px] text-zinc-400">
                Archivo compatible con Excel, Numbers y hojas de cálculo (UTF-8 con BOM).
              </p>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 transition-colors cursor-pointer flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar CSV</span>
            </button>
          </div>

          {/* Google Account Section */}
          <div className="mb-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300">Cuenta de Google Conectada</span>
              </div>
              {currentUser ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Conectado
                </span>
              ) : (
                <span className="text-[11px] text-zinc-500">No iniciada</span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2.5 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-7 h-7 rounded-full border border-zinc-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-xs font-medium text-zinc-200 block truncate">
                    {currentUser.displayName || 'Usuario de Google'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 block truncate">
                    {currentUser.email}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Acceder con Google para exportar a Sheets & Gmail</span>
              </button>
            )}
          </div>

          {/* Option 2: Google Sheets Export */}
          <div className="mb-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">Crear Hoja en Google Sheets</h4>
                <p className="text-[11px] text-zinc-400">
                  Crea un libro en tu Google Drive con 3 pestañas: Resumen, Transacciones y Presupuestos.
                </p>
              </div>
              <button
                disabled={!currentUser || isExportingSheets}
                onClick={() => setConfirmSheetsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isExportingSheets ? 'Exportando...' : 'Exportar a Sheets'}</span>
              </button>
            </div>

            {sheetsResult && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-medium">¡Hoja creada con éxito en tu Drive!</span>
                <a
                  href={sheetsResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
                >
                  <span>Abrir Hoja</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Option 3: Send via Gmail */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">Enviar Reporte a mi Correo</h4>
                <p className="text-[11px] text-zinc-400">
                  Recibe un balance consolidado de ahorros y gastos por Gmail.
                </p>
              </div>
              <button
                disabled={!currentUser || isSendingEmail}
                onClick={() => setConfirmEmailOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isSendingEmail ? 'Enviando...' : 'Enviar por Gmail'}</span>
              </button>
            </div>

            {emailSentSuccess && (
              <div className="mt-3 p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300">
                ¡Reporte financiero enviado correctamente a tu correo!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Google Sheets export (MANDATORY per Workspace skill) */}
      <DestructiveConfirmModal
        isOpen={confirmSheetsOpen}
        title="¿Crear hoja de cálculo en tu Google Drive?"
        description={`Se creará un nuevo archivo titulado "KuroFinance - Finanzas Personales (${monthName})" en tu unidad de Google Drive con las tablas de transacciones, saldos y presupuestos con tu autorización.`}
        confirmLabel="Sí, crear en Google Sheets"
        onConfirm={handleExecuteSheetsExport}
        onCancel={() => setConfirmSheetsOpen(false)}
        isLoading={isExportingSheets}
      />

      {/* Confirmation Dialog for Gmail send (MANDATORY per Workspace skill) */}
      <DestructiveConfirmModal
        isOpen={confirmEmailOpen}
        title="¿Enviar balance financiero a tu correo?"
        description={`Se enviará un correo electrónico a ${currentUser?.email || 'tu cuenta'} con el desglose de ingresos, gastos y tasa de ahorro del mes.`}
        confirmLabel="Sí, enviar reporte ahora"
        onConfirm={handleExecuteSendEmail}
        onCancel={() => setConfirmEmailOpen(false)}
        isLoading={isSendingEmail}
      />
    </>
  );
};
