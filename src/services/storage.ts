import { Account, Transaction, CategoryBudget, SavingsGoal, SavingsNotification } from '../types/finance';

const ACCOUNTS_KEY = 'kurofinance_accounts';
const TRANSACTIONS_KEY = 'kurofinance_transactions';
const CATEGORIES_KEY = 'kurofinance_categories';
const GOALS_KEY = 'kurofinance_goals';
const NOTIFICATIONS_KEY = 'kurofinance_notifications';

// Realistic starter accounts
export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Scotiabank Cuenta Principal',
    type: 'checking',
    balance: 2840.50,
    currency: 'USD',
    bankName: 'Scotiabank',
    bankCode: 'scotiabank',
    accountNumberMasked: '•••• 4892',
    color: '#EC111A',
    isSynced: true,
    lastSyncAt: new Date().toISOString(),
    e2eEncrypted: true,
    institutionType: 'bank',
  },
  {
    id: 'acc-2',
    name: 'Coopsano Ahorro Programado',
    type: 'savings',
    balance: 4950.00,
    currency: 'USD',
    bankName: 'Cooperativa Coopsano',
    bankCode: 'coopsano',
    accountNumberMasked: '•••• 7120',
    color: '#00873D',
    isSynced: true,
    lastSyncAt: new Date().toISOString(),
    e2eEncrypted: true,
    institutionType: 'cooperative',
  },
  {
    id: 'acc-3',
    name: 'Nu Tarjeta de Crédito Gold',
    type: 'credit',
    balance: -480.20,
    creditLimit: 3000.00,
    currency: 'USD',
    bankName: 'Nu Bank',
    bankCode: 'nu',
    accountNumberMasked: '•••• 7310',
    color: '#820AD1',
    isSynced: true,
    lastSyncAt: new Date().toISOString(),
    e2eEncrypted: true,
    institutionType: 'bank',
  },
  {
    id: 'acc-4',
    name: 'Efectivo en Billetera',
    type: 'cash',
    balance: 215.00,
    currency: 'USD',
    bankName: 'Efectivo',
    bankCode: 'cash',
    accountNumberMasked: 'CASH',
    color: '#10B981',
    isSynced: false,
    e2eEncrypted: true,
    institutionType: 'bank',
  },
];

export const INITIAL_CATEGORIES: CategoryBudget[] = [
  { id: 'cat-1', name: 'Alimentación & Súper', iconName: 'ShoppingBag', color: '#10B981', monthlyLimit: 600, spent: 485 },
  { id: 'cat-2', name: 'Vivienda & Servicios', iconName: 'Home', color: '#3B82F6', monthlyLimit: 950, spent: 910 },
  { id: 'cat-3', name: 'Transporte & Gasolina', iconName: 'Car', color: '#F59E0B', monthlyLimit: 250, spent: 180 },
  { id: 'cat-4', name: 'Restaurantes & Cafés', iconName: 'Utensils', color: '#EC4899', monthlyLimit: 300, spent: 285 },
  { id: 'cat-5', name: 'Entretenimiento & Streaming', iconName: 'Film', color: '#8B5CF6', monthlyLimit: 120, spent: 95 },
  { id: 'cat-6', name: 'Salud & Farmacia', iconName: 'HeartPulse', color: '#EF4444', monthlyLimit: 150, spent: 42 },
  { id: 'cat-7', name: 'Sueldo & Honorarios', iconName: 'Briefcase', color: '#06B6D4', monthlyLimit: 0, spent: 0 },
  { id: 'cat-8', name: 'Inversiones & Rendimientos', iconName: 'TrendingUp', color: '#14B8A6', monthlyLimit: 0, spent: 0 },
];

export const INITIAL_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Fondo de Emergencia (6 meses)',
    targetAmount: 12000,
    currentAmount: 7800,
    deadline: '2026-12-31',
    color: '#10B981',
    iconName: 'ShieldCheck',
  },
  {
    id: 'goal-2',
    name: 'Viaje a Japón 2027',
    targetAmount: 4500,
    currentAmount: 1950,
    deadline: '2027-04-15',
    color: '#8B5CF6',
    iconName: 'Plane',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    accountId: 'acc-1',
    type: 'income',
    amount: 3200.00,
    category: 'Sueldo & Honorarios',
    description: 'Depósito de Nómina Quincenal',
    date: '2026-10-24',
    merchant: 'Empresa Empleadora S.A.',
    isBankSynced: true,
  },
  {
    id: 'tx-2',
    accountId: 'acc-3',
    type: 'expense',
    amount: 142.80,
    category: 'Alimentación & Súper',
    description: 'Compras de supermercado semanal',
    date: '2026-10-23',
    merchant: 'Supermercado Central',
    isBankSynced: true,
  },
  {
    id: 'tx-3',
    accountId: 'acc-3',
    type: 'expense',
    amount: 38.50,
    category: 'Restaurantes & Cafés',
    description: 'Cena con amigos',
    date: '2026-10-22',
    merchant: 'Trattoria Bella',
    isBankSynced: true,
  },
  {
    id: 'tx-4',
    accountId: 'acc-1',
    type: 'expense',
    amount: 65.00,
    category: 'Vivienda & Servicios',
    description: 'Pago servicio de Internet Fibra Óptica',
    date: '2026-10-20',
    merchant: 'Telecomunicaciones S.A.',
    isBankSynced: true,
  },
  {
    id: 'tx-5',
    accountId: 'acc-1',
    type: 'transfer',
    amount: 500.00,
    category: 'Inversiones & Rendimientos',
    description: 'Aporte a Fondo de Ahorro Santander',
    date: '2026-10-18',
    toAccountId: 'acc-2',
    isBankSynced: true,
  },
  {
    id: 'tx-6',
    accountId: 'acc-1',
    type: 'expense',
    amount: 45.00,
    category: 'Transporte & Gasolina',
    description: 'Carga de combustible',
    date: '2026-10-17',
    merchant: 'Estación de Servicio Shell',
    isBankSynced: true,
  },
  {
    id: 'tx-7',
    accountId: 'acc-3',
    type: 'expense',
    amount: 15.99,
    category: 'Entretenimiento & Streaming',
    description: 'Suscripción Streaming Premium',
    date: '2026-10-15',
    merchant: 'Streaming Platform Inc',
    isBankSynced: true,
  },
  {
    id: 'tx-8',
    accountId: 'acc-2',
    type: 'income',
    amount: 42.10,
    category: 'Inversiones & Rendimientos',
    description: 'Rendimientos mensuales de plazo fijo',
    date: '2026-10-10',
    merchant: 'Banco Santander Rendimientos',
    isBankSynced: true,
  },
];

export const INITIAL_NOTIFICATIONS: SavingsNotification[] = [
  {
    id: 'notif-1',
    title: '¡Alerta de Presupuesto!',
    message: 'Has utilizado el 95% del límite mensual en Restaurantes & Cafés ($285 de $300). Cocinar en casa estos días te ahorrará ~$60.',
    type: 'warning',
    date: '2026-10-24',
    isRead: false,
    category: 'Restaurantes & Cafés',
    actionText: 'Ver presupuesto',
  },
  {
    id: 'notif-2',
    title: 'Meta en Progreso',
    message: '¡Excelente ritmo! Tu fondo de emergencia ha alcanzado el 65% de la meta ($7,800 / $12,000).',
    type: 'success',
    date: '2026-10-22',
    isRead: false,
    actionText: 'Ver metas',
  },
  {
    id: 'notif-3',
    title: 'Consejo de Ahorro Inteligente',
    message: 'Detectamos cargos de suscripciones digitales este mes. Revisa si utilizas todos tus servicios activos para liberar ~$30/mes.',
    type: 'tip',
    date: '2026-10-19',
    isRead: true,
  },
];

export function getStoredAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ACCOUNTS;
  } catch {
    return INITIAL_ACCOUNTS;
  }
}

export function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function getStoredCategories(): CategoryBudget[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryBudget[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function getStoredGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_GOALS;
  } catch {
    return INITIAL_GOALS;
  }
}

export function saveGoals(goals: SavingsGoal[]): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function getStoredNotifications(): SavingsNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: SavingsNotification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

// Generate CSV file content with UTF-8 BOM
export function generateTransactionsCSV(transactions: Transaction[], accounts: Account[]): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const headers = [
    'ID Transacción',
    'Fecha',
    'Cuenta Origen',
    'Tipo',
    'Categoría',
    'Concepto / Descripción',
    'Comercio / Entidad',
    'Monto',
    'Cuenta Destino (si transferencia)',
    'Sincronizado Banco',
  ];

  const rows = transactions.map((t) => {
    const accountName = accountMap.get(t.accountId) || t.accountId;
    const destAccountName = t.toAccountId ? accountMap.get(t.toAccountId) || t.toAccountId : '';
    const typeLabel = t.type === 'income' ? 'Ingreso' : t.type === 'expense' ? 'Gasto' : 'Transferencia';
    const amountVal = t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount);

    return [
      t.id,
      t.date,
      `"${accountName.replace(/"/g, '""')}"`,
      typeLabel,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      amountVal.toFixed(2),
      destAccountName ? `"${destAccountName.replace(/"/g, '""')}"` : '',
      t.isBankSynced ? 'Sí (API Segura)' : 'Manual',
    ].join(',');
  });

  // UTF-8 BOM + Header + Rows
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

// Download CSV helper in browser
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
