import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Account, CategoryBudget, SavingsGoal, Transaction } from '../types/finance';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Provider with required Google Workspace Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');

// In-memory token cache (NEVER in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google (Popup)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Workspace.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error de autenticación Google Workspace:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE SHEETS API INTEGRATION
// ==========================================

export interface GoogleSheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates a complete monthly financial dashboard inside Google Sheets with 3 tabs:
 * 1. Resumen Ejecutivo
 * 2. Transacciones
 * 3. Presupuestos y Metas
 */
export async function exportFinancesToGoogleSheets(
  title: string,
  transactions: Transaction[],
  accounts: Account[],
  categories: CategoryBudget[],
  goals: SavingsGoal[]
): Promise<GoogleSheetsExportResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa con Google Sheets. Inicia sesión primero.');
  }

  // 1. Create Spreadsheet with initial metadata
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `KuroFinance - Reporte Mensual ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      },
      sheets: [
        { properties: { title: 'Resumen Ejecutivo' } },
        { properties: { title: 'Transacciones' } },
        { properties: { title: 'Presupuestos y Metas' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Error al crear la hoja de cálculo en Google Sheets.');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Prepare data for "Resumen Ejecutivo"
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';

  const summaryValues = [
    ['KUROFINANCE - ESTADO FINANCIERO PERSONAL', ''],
    ['Fecha de Generación:', new Date().toLocaleString('es-ES')],
    ['', ''],
    ['MÉTRICA GLOBAL', 'VALOR (USD)'],
    ['Ingresos Totales del Mes:', totalIncome],
    ['Gastos Totales del Mes:', totalExpense],
    ['Ahorro Neto:', netSavings],
    ['Tasa de Ahorro (%):', `${savingsRate}%`],
    ['', ''],
    ['SALDO POR CUENTA', 'SALDO ACTUAL (USD)'],
    ...accounts.map((acc) => [acc.name, acc.balance]),
  ];

  // Prepare data for "Transacciones"
  const txHeaders = ['Fecha', 'Cuenta', 'Tipo', 'Categoría', 'Descripción', 'Comercio', 'Monto (USD)', 'Sincronizado'];
  const txRows = transactions.map((t) => [
    t.date,
    accountMap.get(t.accountId) || t.accountId,
    t.type === 'income' ? 'Ingreso' : t.type === 'expense' ? 'Gasto' : 'Transferencia',
    t.category,
    t.description,
    t.merchant || 'N/A',
    t.type === 'expense' ? -t.amount : t.amount,
    t.isBankSynced ? 'Sí (API Segura)' : 'Manual',
  ]);
  const transactionsValues = [txHeaders, ...txRows];

  // Prepare data for "Presupuestos y Metas"
  const budgetHeaders = ['Categoría', 'Límite Mensual (USD)', 'Gastado (USD)', '% Utilizado', 'Estado'];
  const budgetRows = categories.map((c) => {
    const pct = c.monthlyLimit > 0 ? ((c.spent / c.monthlyLimit) * 100).toFixed(1) : '0';
    const status = c.monthlyLimit === 0 ? 'Sin límite' : c.spent > c.monthlyLimit ? 'SOBREPASADO' : 'En regla';
    return [c.name, c.monthlyLimit, c.spent, `${pct}%`, status];
  });

  const goalHeaders = ['', '', '', '', ''];
  const goalTitle = ['METAS DE AHORRO', 'OBJETIVO', 'ACTUAL', 'PROGRESO', 'FECHA LÍMITE'];
  const goalRows = goals.map((g) => {
    const pct = ((g.currentAmount / g.targetAmount) * 100).toFixed(1);
    return [g.name, g.targetAmount, g.currentAmount, `${pct}%`, g.deadline || 'Indefinido'];
  });

  const budgetValues = [budgetHeaders, ...budgetRows, goalHeaders, goalTitle, ...goalRows];

  // Batch update all 3 sheets
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Resumen Ejecutivo'!A1",
            values: summaryValues,
          },
          {
            range: "'Transacciones'!A1",
            values: transactionsValues,
          },
          {
            range: "'Presupuestos y Metas'!A1",
            values: budgetValues,
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || 'Error al poblar datos en Google Sheets.');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

// ==========================================
// GMAIL API INTEGRATION
// ==========================================

export interface BankEmailCandidate {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

/**
 * Searches user Gmail messages for recent financial/banking alerts and receipts
 */
export async function searchBankingEmails(): Promise<BankEmailCandidate[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Inicia sesión con Google para escanear correos.');
  }

  // Search query targeting banking receipts, transfers, charges
  const query = encodeURIComponent(
    'subject:(transferencia OR compra OR cargo OR pago OR receipt OR estado OR nómina OR cobro OR debito OR retiro)'
  );

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=8`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!listRes.ok) {
    const err = await listRes.json();
    throw new Error(err.error?.message || 'Error al buscar correos en Gmail.');
  }

  const listData = await listRes.json();
  const messages = listData.messages || [];

  const candidates: BankEmailCandidate[] = [];

  for (const m of messages) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (msgRes.ok) {
        const item = await msgRes.json();
        const headers = item.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Sin asunto';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Desconocido';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        candidates.push({
          id: item.id,
          snippet: item.snippet || '',
          subject,
          from,
          date,
        });
      }
    } catch (e) {
      console.warn('Error fetching email details:', e);
    }
  }

  return candidates;
}

/**
 * Sends a clean monthly summary report email to the user via Gmail API
 */
export async function sendMonthlyFinancialReportEmail(
  toEmail: string,
  monthName: string,
  summary: { totalIncome: number; totalExpense: number; netSavings: number; savingsRate: string }
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Token no disponible para enviar correo.');
  }

  const subject = `Resumen Financiero KuroFinance - ${monthName}`;
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const body = `Hola,

Aquí tienes el balance mensual de tus finanzas personales en KuroFinance para ${monthName}:

--------------------------------------------------
- Ingresos Totales:  $${summary.totalIncome.toFixed(2)} USD
- Gastos Totales:    $${summary.totalExpense.toFixed(2)} USD
- Ahorro Neto:       $${summary.netSavings.toFixed(2)} USD
- Tasa de Ahorro:    ${summary.savingsRate}%
--------------------------------------------------

Tus datos permanecen cifrados de extremo a extremo y protegidos.
Puedes consultar gráficos interactivos y exportar hojas de cálculo en cualquier momento desde KuroFinance.

Saludos,
KuroFinance`;

  const emailLines = [
    `To: ${toEmail}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body,
  ];

  const email = emailLines.join('\r\n');
  const base64Encoded = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64Encoded }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Error al enviar el correo desde Gmail.');
  }

  return true;
}
