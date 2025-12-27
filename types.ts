
export interface DebtMonth {
  id: string;
  month: string; // "2024-05"
  amount: number;
  isPaid: boolean;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  notes?: string; // ملاحظات إضافية
  joinDate: string; // تاريخ أول تفعيل
  planName: string;
  subscriptionAmount: number;
  isPaid: boolean; // Current month status
  activationDate: string; // ISO string with time
  expiryDate: string; // ISO string with time
  lastPaymentDate: string;
  debtHistory: DebtMonth[];
}

export type ViewState = 'login' | 'dashboard' | 'subscribers' | 'renewal' | 'unpaid' | 'calendar' | 'debt-settlement' | 'add-subscriber' | 'invoice' | 'delete-sub' | 'full-list' | 'wire-list' | 'tower-list';
