import { BankProvider, Transaction } from '../types/finance';

const CUSTOM_BANKS_KEY = 'kurofinance_custom_banks';

export const DEFAULT_BANKS: BankProvider[] = [
  {
    id: 'scotiabank',
    name: 'Scotiabank',
    code: 'BNS',
    country: 'Internacional / LATAM',
    color: '#EC111A',
    logoText: 'Scotia',
    apiProtocol: 'OpenBanking-PSD2',
    institutionType: 'bank',
  },
  {
    id: 'coopsano',
    name: 'Cooperativa Coopsano',
    code: 'COOPSANO',
    country: 'Rep. Dominicana / Regional',
    color: '#00873D',
    logoText: 'Coopsano',
    apiProtocol: 'DirectBank-OAuth2',
    institutionType: 'cooperative',
  },
  {
    id: 'bbva',
    name: 'BBVA',
    code: 'BBVA',
    country: 'LATAM & Global',
    color: '#004481',
    logoText: 'BBVA',
    apiProtocol: 'OpenBanking-PSD2',
    institutionType: 'bank',
  },
  {
    id: 'santander',
    name: 'Banco Santander',
    code: 'SAN',
    country: 'LATAM & España',
    color: '#EC0000',
    logoText: 'SAN',
    apiProtocol: 'DirectBank-OAuth2',
    institutionType: 'bank',
  },
  {
    id: 'nu',
    name: 'Nu (Nubank)',
    code: 'NU',
    country: 'México, Colombia, Brasil',
    color: '#820AD1',
    logoText: 'Nu',
    apiProtocol: 'OpenBanking-PSD2',
    institutionType: 'bank',
  },
  {
    id: 'bancolombia',
    name: 'Bancolombia',
    code: 'BCOL',
    country: 'Colombia',
    color: '#FDDA24',
    logoText: 'Bancolombia',
    apiProtocol: 'ISO20022',
    institutionType: 'bank',
  },
  {
    id: 'coop_vegateal',
    name: 'Cooperativa Vega Real',
    code: 'VEGAREAL',
    country: 'Cooperativa de Ahorro',
    color: '#16A34A',
    logoText: 'VegaReal',
    apiProtocol: 'Manual-Coop',
    institutionType: 'cooperative',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    code: 'MP',
    country: 'LATAM',
    color: '#009EE3',
    logoText: 'MP',
    apiProtocol: 'DirectBank-OAuth2',
    institutionType: 'bank',
  },
  {
    id: 'bancochile',
    name: 'Banco de Chile',
    code: 'BCH',
    country: 'Chile',
    color: '#002B49',
    logoText: 'BCH',
    apiProtocol: 'DirectBank-OAuth2',
    institutionType: 'bank',
  },
  {
    id: 'revolut',
    name: 'Revolut / Neobancos',
    code: 'REV',
    country: 'Global',
    color: '#0075EB',
    logoText: 'REV',
    apiProtocol: 'OpenBanking-PSD2',
    institutionType: 'bank',
  },
];

export function getCustomBanks(): BankProvider[] {
  try {
    const raw = localStorage.getItem(CUSTOM_BANKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomBank(newBank: BankProvider): BankProvider[] {
  const current = getCustomBanks();
  const updated = [newBank, ...current.filter((b) => b.id !== newBank.id)];
  localStorage.setItem(CUSTOM_BANKS_KEY, JSON.stringify(updated));
  return updated;
}

export function getAllBanks(): BankProvider[] {
  const custom = getCustomBanks();
  return [...custom, ...DEFAULT_BANKS];
}

export interface BankSyncResult {
  bankId: string;
  bankName: string;
  transactionsFetched: Transaction[];
  syncedAt: string;
  encryptionFingerprint: string;
}

// Generate realistic simulated pending bank movements on demand
export async function simulateSecureBankSync(
  bankId: string,
  targetAccountId: string
): Promise<BankSyncResult> {
  // Simulate network latency & TLS 1.3 / OpenBanking token handshake
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const all = getAllBanks();
  const bank = all.find((b) => b.id === bankId) || all[0];
  const today = new Date().toISOString().split('T')[0];

  const sampleBankMoves: Record<string, Partial<Transaction>[]> = {
    scotiabank: [
      {
        description: 'Compra con Débito Scotia en Supermercado',
        amount: 86.40,
        category: 'Alimentación & Súper',
        type: 'expense',
        merchant: 'Supermercado Central',
      },
      {
        description: 'Depósito / Abono Scotiabank Nómina',
        amount: 850.00,
        category: 'Sueldo & Honorarios',
        type: 'income',
        merchant: 'Empresa Empleadora',
      },
      {
        description: 'Cargo en Estación de Servicio Combustible',
        amount: 42.00,
        category: 'Transporte & Gasolina',
        type: 'expense',
        merchant: 'Estación de Combustible',
      },
    ],
    coopsano: [
      {
        description: 'Aporte de Capital / Ahorro Programado Coopsano',
        amount: 120.00,
        category: 'Inversiones & Rendimientos',
        type: 'expense',
        merchant: 'Cooperativa Coopsano',
      },
      {
        description: 'Abono de Intereses / Excedentes Coopsano',
        amount: 34.50,
        category: 'Inversiones & Rendimientos',
        type: 'income',
        merchant: 'Coopsano Ahorros',
      },
      {
        description: 'Pago Cuota Préstamo Coop Fácil',
        amount: 95.00,
        category: 'Vivienda & Servicios',
        type: 'expense',
        merchant: 'Cooperativa Coopsano',
      },
    ],
    bbva: [
      {
        description: 'Compra en Café Gourmet Deli',
        amount: 8.50,
        category: 'Restaurantes & Cafés',
        type: 'expense',
        merchant: 'Café Gourmet Deli',
      },
      {
        description: 'Abono Transferencia SPEI Recibida',
        amount: 250.00,
        category: 'Sueldo & Honorarios',
        type: 'income',
        merchant: 'Cliente Consultoría',
      },
    ],
    santander: [
      {
        description: 'Pago de peaje autopista TAG',
        amount: 14.20,
        category: 'Transporte & Gasolina',
        type: 'expense',
        merchant: 'Autopistas Centrales',
      },
      {
        description: 'Compra Farmacia San Pablo',
        amount: 28.90,
        category: 'Salud & Farmacia',
        type: 'expense',
        merchant: 'Farmacia San Pablo',
      },
    ],
    nu: [
      {
        description: 'Pago Rappi Comida',
        amount: 22.40,
        category: 'Restaurantes & Cafés',
        type: 'expense',
        merchant: 'Rappi Delivery',
      },
      {
        description: 'Supermercado Fresko',
        amount: 74.30,
        category: 'Alimentación & Súper',
        type: 'expense',
        merchant: 'Fresko Supermarket',
      },
    ],
  };

  const templates = sampleBankMoves[bankId] || [
    {
      description: `Cargo ${bank.name} - Consumo Comercio`,
      amount: 45.00,
      category: 'Alimentación & Súper',
      type: 'expense',
      merchant: bank.name,
    },
    {
      description: `Abono ${bank.name} - Transferencia`,
      amount: 150.00,
      category: 'Sueldo & Honorarios',
      type: 'income',
      merchant: bank.name,
    },
  ];

  const newTransactions: Transaction[] = templates.map((tmpl, idx) => ({
    id: `sync-${bankId}-${Date.now()}-${idx}`,
    accountId: targetAccountId,
    type: tmpl.type || 'expense',
    amount: tmpl.amount || 10,
    category: tmpl.category || 'Alimentación & Súper',
    description: tmpl.description || `Cargo ${bank.name}`,
    date: today,
    merchant: tmpl.merchant,
    isBankSynced: true,
  }));

  // SHA-256 simulation fingerprint for E2EE certificate
  const fingerprint = `SHA256:${Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase()}`;

  return {
    bankId,
    bankName: bank.name,
    transactionsFetched: newTransactions,
    syncedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    encryptionFingerprint: fingerprint,
  };
}
