export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
export type InstitutionType = 'bank' | 'cooperative';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  bankName: string;
  bankCode: string;
  accountNumberMasked: string;
  color: string;
  creditLimit?: number;
  isSynced: boolean;
  lastSyncAt?: string;
  e2eEncrypted?: boolean;
  institutionType?: InstitutionType;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  note?: string;
  toAccountId?: string; // used when type === 'transfer'
  isPending?: boolean;
  isBankSynced?: boolean;
  sourceEmailId?: string;
  merchant?: string;
}

export interface CategoryBudget {
  id: string;
  name: string;
  iconName: string;
  color: string;
  monthlyLimit: number;
  spent: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  iconName: string;
}

export interface BankProvider {
  id: string;
  name: string;
  code: string;
  country: string;
  color: string;
  logoText: string;
  apiProtocol: 'OpenBanking-PSD2' | 'FinTS' | 'ISO20022' | 'DirectBank-OAuth2' | 'Manual-Coop';
  institutionType: InstitutionType;
  isCustom?: boolean;
}

export interface SavingsNotification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'tip' | 'success';
  date: string;
  isRead: boolean;
  category?: string;
  actionText?: string;
}

export interface MonthlyReportSummary {
  monthName: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // percentage 0-100
  topCategory: { name: string; amount: number; percentage: number };
  accountBalances: { name: string; balance: number }[];
}
